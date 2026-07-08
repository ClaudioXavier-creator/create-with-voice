
-- 1. Habilita o novo produto no constraint de licenças
ALTER TABLE public.licencas DROP CONSTRAINT IF EXISTS licencas_produto_check;
ALTER TABLE public.licencas ADD CONSTRAINT licencas_produto_check
  CHECK (produto = ANY (ARRAY[
    'feed_bpf'::text, 'audits_bpf'::text, 'completo'::text,
    'agrogestao'::text, 'nutricrm'::text, 'feedbpf'::text,
    'auditsbpf'::text, 'feed_bpf_custom'::text
  ]));

-- 2. Atualiza função de criação de licença trial para reconhecer feed_bpf_custom
CREATE OR REPLACE FUNCTION public.handle_new_empresa_license()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_licenca_consultor public.licencas%ROWTYPE;
  v_produto TEXT;
  v_user_meta JSONB;
  v_valid_products TEXT[] := ARRAY['feed_bpf', 'audits_bpf', 'completo', 'agrogestao', 'nutricrm', 'feed_bpf_custom'];
BEGIN
  SELECT raw_user_meta_data INTO v_user_meta
  FROM auth.users
  WHERE id = NEW.user_id;

  v_produto := lower(coalesce(v_user_meta->>'produto', 'feed_bpf'));

  IF v_produto = 'feedbpf' THEN v_produto := 'feed_bpf'; END IF;
  IF v_produto = 'auditsbpf' THEN v_produto := 'audits_bpf'; END IF;
  IF v_produto = 'feedbpfcustom' OR v_produto = 'feed-bpf-custom' THEN v_produto := 'feed_bpf_custom'; END IF;

  IF NOT (v_produto = ANY(v_valid_products)) THEN
    v_produto := 'feed_bpf';
  END IF;

  SELECT * INTO v_licenca_consultor
  FROM public.licencas
  WHERE user_id = NEW.user_id
    AND nivel = 'consultor'
    AND (produto = 'audits_bpf' OR produto = 'auditsbpf')
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_licenca_consultor.id IS NOT NULL THEN
    PERFORM public.vincular_empresa_licenca_consultor(v_licenca_consultor.id, NEW.id);
  END IF;

  INSERT INTO public.licencas (user_id, empresa_id, chave_licenca, plano, produto, nivel, slots_max, data_inicio, data_expiracao, status)
  VALUES (
    NEW.user_id,
    NEW.id,
    'TRIAL-' || replace(gen_random_uuid()::text, '-', ''),
    'trial',
    v_produto,
    'individual',
    1,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'ativa'
  );

  RETURN NEW;
END;
$function$;

-- 3. Tabela: modelos_empresa
CREATE TABLE public.modelos_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  pop_codigo TEXT,
  arquivo_referencia_path TEXT,
  arquivo_referencia_nome TEXT,
  campos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.modelos_empresa TO authenticated;
GRANT ALL ON public.modelos_empresa TO service_role;

ALTER TABLE public.modelos_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da empresa gerenciam modelos"
  ON public.modelos_empresa
  FOR ALL
  TO authenticated
  USING (public.pode_usar_empresa(empresa_id, auth.uid()))
  WITH CHECK (public.pode_usar_empresa(empresa_id, auth.uid()) AND user_id = auth.uid());

CREATE INDEX idx_modelos_empresa_empresa ON public.modelos_empresa(empresa_id);
CREATE INDEX idx_modelos_empresa_pop ON public.modelos_empresa(pop_codigo);

CREATE TRIGGER update_modelos_empresa_updated_at
  BEFORE UPDATE ON public.modelos_empresa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Tabela: registros_customizados
CREATE TABLE public.registros_customizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  modelo_id UUID NOT NULL REFERENCES public.modelos_empresa(id) ON DELETE RESTRICT,
  pop_codigo TEXT,
  titulo TEXT NOT NULL,
  responsavel TEXT,
  data_execucao DATE NOT NULL DEFAULT CURRENT_DATE,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'vigente', 'obsoleto')),
  hash_integridade TEXT,
  pdf_path TEXT,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_customizados TO authenticated;
GRANT ALL ON public.registros_customizados TO service_role;

ALTER TABLE public.registros_customizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da empresa gerenciam registros customizados"
  ON public.registros_customizados
  FOR ALL
  TO authenticated
  USING (public.pode_usar_empresa(empresa_id, auth.uid()))
  WITH CHECK (public.pode_usar_empresa(empresa_id, auth.uid()) AND user_id = auth.uid());

CREATE INDEX idx_registros_cust_empresa ON public.registros_customizados(empresa_id);
CREATE INDEX idx_registros_cust_modelo ON public.registros_customizados(modelo_id);
CREATE INDEX idx_registros_cust_pop ON public.registros_customizados(pop_codigo);

CREATE TRIGGER update_registros_customizados_updated_at
  BEFORE UPDATE ON public.registros_customizados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
