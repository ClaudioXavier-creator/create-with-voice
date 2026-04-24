-- 1. Adicionar colunas de workflow à tabela documentos
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'vigente',
  ADD COLUMN IF NOT EXISTS documento_pai_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprovado_por UUID,
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovador_nome TEXT,
  ADD COLUMN IF NOT EXISTS aprovacao_hash TEXT,
  ADD COLUMN IF NOT EXISTS motivo_revisao TEXT;

-- Constraint de valores válidos
ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS documentos_workflow_status_check;
ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_workflow_status_check
  CHECK (workflow_status IN ('rascunho', 'em_revisao', 'vigente', 'obsoleto'));

CREATE INDEX IF NOT EXISTS idx_documentos_workflow_status ON public.documentos(workflow_status);
CREATE INDEX IF NOT EXISTS idx_documentos_pai ON public.documentos(documento_pai_id);

-- 2. Tabela de trilha de aprovações (imutável)
CREATE TABLE IF NOT EXISTS public.documento_aprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  empresa_id UUID,
  user_id UUID NOT NULL,
  aprovador_user_id UUID NOT NULL,
  aprovador_nome TEXT NOT NULL,
  status_anterior TEXT NOT NULL,
  status_novo TEXT NOT NULL,
  versao TEXT,
  motivo TEXT,
  hash_assinatura TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documento_aprovacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own documento_aprovacoes"
  ON public.documento_aprovacoes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own documento_aprovacoes"
  ON public.documento_aprovacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_doc_aprovacoes_doc ON public.documento_aprovacoes(documento_id);
CREATE INDEX IF NOT EXISTS idx_doc_aprovacoes_empresa ON public.documento_aprovacoes(empresa_id);

-- 3. Função de aprovação com validação de PIN
CREATE OR REPLACE FUNCTION public.aprovar_documento_pop(
  _documento_id UUID,
  _pin_hash TEXT,
  _aprovador_nome TEXT,
  _novo_status TEXT,
  _motivo TEXT DEFAULT NULL,
  _ip TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.documentos%ROWTYPE;
  v_pin_armazenado TEXT;
  v_status_anterior TEXT;
  v_hash TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado');
  END IF;

  SELECT * INTO v_doc FROM public.documentos WHERE id = _documento_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Documento não encontrado');
  END IF;

  IF v_doc.user_id <> v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão sobre este documento');
  END IF;

  IF _novo_status NOT IN ('em_revisao', 'vigente', 'obsoleto') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Status inválido para aprovação');
  END IF;

  -- Valida PIN da empresa (se houver empresa vinculada)
  IF v_doc.empresa_id IS NOT NULL THEN
    SELECT pin_hash INTO v_pin_armazenado
    FROM public.empresa_pin
    WHERE empresa_id = v_doc.empresa_id
    LIMIT 1;

    IF v_pin_armazenado IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'PIN da empresa não configurado. Configure em /configurar-pin');
    END IF;

    IF v_pin_armazenado <> _pin_hash THEN
      RETURN jsonb_build_object('ok', false, 'error', 'PIN incorreto');
    END IF;
  END IF;

  v_status_anterior := COALESCE(v_doc.workflow_status, 'rascunho');
  v_hash := encode(digest(_pin_hash || now()::text || v_doc.id::text || _novo_status, 'sha256'), 'hex');

  -- Se aprovando como vigente: marca versão anterior (mesmo documento_pai_id ou o próprio pai) como obsoleta
  IF _novo_status = 'vigente' AND v_doc.documento_pai_id IS NOT NULL THEN
    UPDATE public.documentos
    SET workflow_status = 'obsoleto', updated_at = now()
    WHERE id = v_doc.documento_pai_id
      AND workflow_status = 'vigente';
  END IF;

  -- Atualiza documento
  UPDATE public.documentos
  SET workflow_status = _novo_status,
      aprovado_por = v_user_id,
      aprovado_em = now(),
      aprovador_nome = _aprovador_nome,
      aprovacao_hash = v_hash,
      motivo_revisao = COALESCE(_motivo, motivo_revisao),
      updated_at = now()
  WHERE id = _documento_id;

  -- Registra trilha
  INSERT INTO public.documento_aprovacoes (
    documento_id, empresa_id, user_id, aprovador_user_id, aprovador_nome,
    status_anterior, status_novo, versao, motivo, hash_assinatura, ip_address, user_agent
  ) VALUES (
    _documento_id, v_doc.empresa_id, v_user_id, v_user_id, _aprovador_nome,
    v_status_anterior, _novo_status, v_doc.versao, _motivo, v_hash, _ip, _user_agent
  );

  RETURN jsonb_build_object(
    'ok', true,
    'status_novo', _novo_status,
    'hash', v_hash,
    'aprovado_em', now()
  );
END;
$$;

-- 4. Função para criar nova versão (rascunho) a partir de POP vigente
CREATE OR REPLACE FUNCTION public.criar_nova_versao_pop(
  _documento_pai_id UUID,
  _nova_versao TEXT,
  _motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pai public.documentos%ROWTYPE;
  v_novo_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado');
  END IF;

  SELECT * INTO v_pai FROM public.documentos WHERE id = _documento_pai_id;
  IF NOT FOUND OR v_pai.user_id <> v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Documento pai não encontrado');
  END IF;

  -- Verifica se já existe rascunho aberto para este pai
  IF EXISTS (
    SELECT 1 FROM public.documentos
    WHERE documento_pai_id = _documento_pai_id
      AND workflow_status IN ('rascunho', 'em_revisao')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Já existe uma revisão em aberto para este POP');
  END IF;

  INSERT INTO public.documentos (
    user_id, empresa_id, codigo, nome, versao, data_revisao, responsavel,
    status, workflow_status, documento_pai_id, motivo_revisao
  ) VALUES (
    v_user_id, v_pai.empresa_id, v_pai.codigo, v_pai.nome, _nova_versao, CURRENT_DATE, v_pai.responsavel,
    'em_revisao', 'rascunho', _documento_pai_id, _motivo
  )
  RETURNING id INTO v_novo_id;

  RETURN jsonb_build_object('ok', true, 'novo_documento_id', v_novo_id);
END;
$$;