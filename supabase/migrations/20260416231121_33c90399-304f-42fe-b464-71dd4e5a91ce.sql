-- 1) Adicionar campos de produto/nivel/slots à tabela licencas
ALTER TABLE public.licencas
  ADD COLUMN IF NOT EXISTS produto text NOT NULL DEFAULT 'feed_bpf',
  ADD COLUMN IF NOT EXISTS nivel text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS slots_max integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slots_usados integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Constraint de coerência
ALTER TABLE public.licencas
  DROP CONSTRAINT IF EXISTS licencas_produto_check;
ALTER TABLE public.licencas
  ADD CONSTRAINT licencas_produto_check CHECK (produto IN ('feed_bpf','audits_bpf','completo'));

ALTER TABLE public.licencas
  DROP CONSTRAINT IF EXISTS licencas_nivel_check;
ALTER TABLE public.licencas
  ADD CONSTRAINT licencas_nivel_check CHECK (nivel IN ('individual','consultor'));

-- 2) Tabela de vínculo entre licença-mãe (Consultor) e empresas que consomem slot
CREATE TABLE IF NOT EXISTS public.licenca_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  licenca_id uuid NOT NULL REFERENCES public.licencas(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  excedente boolean NOT NULL DEFAULT false,
  stripe_invoice_id text,
  vinculado_em timestamptz NOT NULL DEFAULT now(),
  desvinculado_em timestamptz,
  UNIQUE (licenca_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_licenca_empresas_licenca ON public.licenca_empresas(licenca_id) WHERE ativo;
CREATE INDEX IF NOT EXISTS idx_licenca_empresas_empresa ON public.licenca_empresas(empresa_id) WHERE ativo;

ALTER TABLE public.licenca_empresas ENABLE ROW LEVEL SECURITY;

-- O dono da licença vê seus vínculos
CREATE POLICY "Users view own licenca_empresas"
ON public.licenca_empresas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role gerencia tudo (edge functions)
CREATE POLICY "Service role manages licenca_empresas"
ON public.licenca_empresas FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 3) Função para vincular empresa a uma licença Consultor (consome slot ou marca excedente)
CREATE OR REPLACE FUNCTION public.vincular_empresa_licenca_consultor(
  _licenca_id uuid,
  _empresa_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_licenca public.licencas%ROWTYPE;
  v_empresa_owner uuid;
  v_excedente boolean := false;
  v_vinculo_id uuid;
BEGIN
  SELECT * INTO v_licenca FROM public.licencas WHERE id = _licenca_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Licença não encontrada');
  END IF;

  IF v_licenca.nivel <> 'consultor' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Licença não é do tipo Consultor');
  END IF;

  IF v_licenca.status <> 'ativa' OR v_licenca.data_expiracao < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Licença inativa ou expirada');
  END IF;

  SELECT user_id INTO v_empresa_owner FROM public.empresas WHERE id = _empresa_id;
  IF v_empresa_owner IS NULL OR v_empresa_owner <> v_licenca.user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Empresa não pertence ao titular da licença');
  END IF;

  -- Já existe vínculo ativo?
  IF EXISTS (
    SELECT 1 FROM public.licenca_empresas
    WHERE licenca_id = _licenca_id AND empresa_id = _empresa_id AND ativo = true
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true);
  END IF;

  -- Verifica slots disponíveis
  IF v_licenca.slots_usados >= v_licenca.slots_max THEN
    v_excedente := true;
  END IF;

  INSERT INTO public.licenca_empresas (licenca_id, empresa_id, user_id, excedente)
  VALUES (_licenca_id, _empresa_id, v_licenca.user_id, v_excedente)
  RETURNING id INTO v_vinculo_id;

  IF NOT v_excedente THEN
    UPDATE public.licencas SET slots_usados = slots_usados + 1, updated_at = now()
    WHERE id = _licenca_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'vinculo_id', v_vinculo_id,
    'excedente', v_excedente,
    'slots_usados', CASE WHEN v_excedente THEN v_licenca.slots_usados ELSE v_licenca.slots_usados + 1 END,
    'slots_max', v_licenca.slots_max
  );
END;
$$;

-- 4) Função para desvincular (libera slot)
CREATE OR REPLACE FUNCTION public.desvincular_empresa_licenca_consultor(
  _vinculo_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vinculo public.licenca_empresas%ROWTYPE;
BEGIN
  SELECT * INTO v_vinculo FROM public.licenca_empresas WHERE id = _vinculo_id AND ativo = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Vínculo não encontrado ou já inativo');
  END IF;

  IF v_vinculo.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão');
  END IF;

  UPDATE public.licenca_empresas
  SET ativo = false, desvinculado_em = now()
  WHERE id = _vinculo_id;

  IF NOT v_vinculo.excedente THEN
    UPDATE public.licencas
    SET slots_usados = GREATEST(slots_usados - 1, 0), updated_at = now()
    WHERE id = v_vinculo.licenca_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 5) Função utilitária: licença Consultor ativa do usuário para um produto
CREATE OR REPLACE FUNCTION public.get_licenca_consultor_ativa(_user_id uuid, _produto text)
RETURNS public.licencas
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.licencas
  WHERE user_id = _user_id
    AND nivel = 'consultor'
    AND produto = _produto
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- 6) Atualizar trigger de nova empresa: NÃO criar trial individual se o user já tem licença Consultor Audits ativa com slot disponível
CREATE OR REPLACE FUNCTION public.handle_new_empresa_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_licenca_consultor public.licencas%ROWTYPE;
BEGIN
  -- Verifica se há licença Consultor Audits ativa do user
  SELECT * INTO v_licenca_consultor
  FROM public.licencas
  WHERE user_id = NEW.user_id
    AND nivel = 'consultor'
    AND produto = 'audits_bpf'
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se existe Consultor, vincula automaticamente (consome slot ou marca excedente)
  IF v_licenca_consultor.id IS NOT NULL THEN
    PERFORM public.vincular_empresa_licenca_consultor(v_licenca_consultor.id, NEW.id);
  END IF;

  -- Sempre cria a licença trial individual padrão (Feed_BPF) — comportamento legado preservado
  INSERT INTO public.licencas (user_id, empresa_id, chave_licenca, plano, produto, nivel, slots_max, data_inicio, data_expiracao, status)
  VALUES (
    NEW.user_id,
    NEW.id,
    'TRIAL-' || replace(gen_random_uuid()::text, '-', ''),
    'trial',
    'feed_bpf',
    'individual',
    1,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'ativa'
  );

  RETURN NEW;
END;
$$;