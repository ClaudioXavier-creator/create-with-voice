-- First, check and update handle_new_empresa_license to be more robust and use correct product names
CREATE OR REPLACE FUNCTION public.handle_new_empresa_license()
RETURNS TRIGGER AS $$
DECLARE
  v_licenca_consultor public.licencas%ROWTYPE;
  v_produto TEXT;
  v_user_meta JSONB;
  v_valid_products TEXT[] := ARRAY['feed_bpf', 'audits_bpf', 'completo', 'agrogestao', 'nutricrm'];
BEGIN
  -- Busca metadados do usuário no esquema auth
  SELECT raw_user_meta_data INTO v_user_meta
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Recupera o produto do cadastro ou assume feed_bpf como padrão (usando o nome correto com underscore)
  v_produto := lower(coalesce(v_user_meta->>'produto', 'feed_bpf'));
  
  -- Normalização: se vier sem underscore, tenta corrigir para o formato que o constraint aceita
  IF v_produto = 'feedbpf' THEN v_produto := 'feed_bpf'; END IF;
  IF v_produto = 'auditsbpf' THEN v_produto := 'audits_bpf'; END IF;

  -- Se ainda não for um produto válido, força feed_bpf para evitar erro de constraint
  IF NOT (v_produto = ANY(v_valid_products)) THEN
    v_produto := 'feed_bpf';
  END IF;

  -- Verifica se há licença Consultor Audits ativa do user
  SELECT * INTO v_licenca_consultor
  FROM public.licencas
  WHERE user_id = NEW.user_id
    AND nivel = 'consultor'
    AND (produto = 'audits_bpf' OR produto = 'auditsbpf')
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se existe Consultor, vincula automaticamente
  IF v_licenca_consultor.id IS NOT NULL THEN
    PERFORM public.vincular_empresa_licenca_consultor(v_licenca_consultor.id, NEW.id);
  END IF;

  -- Cria a licença trial para o produto específico do cadastro
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the constraint on licencas table to be more permissive if needed, 
-- though the trigger fix above should handle most cases by mapping to valid existing names.
-- Let's add the non-underscore versions to the constraint just in case.

ALTER TABLE public.licencas DROP CONSTRAINT IF EXISTS licencas_produto_check;
ALTER TABLE public.licencas ADD CONSTRAINT licencas_produto_check 
CHECK (produto = ANY (ARRAY['feed_bpf'::text, 'audits_bpf'::text, 'completo'::text, 'agrogestao'::text, 'nutricrm'::text, 'feedbpf'::text, 'auditsbpf'::text]));
