
ALTER TABLE public.licencas DROP CONSTRAINT IF EXISTS licencas_produto_check;
ALTER TABLE public.licencas ADD CONSTRAINT licencas_produto_check
  CHECK (produto = ANY (ARRAY[
    'feed_bpf'::text, 'audits_bpf'::text, 'completo'::text,
    'agrogestao'::text, 'nutricrm'::text, 'feedbpf'::text,
    'auditsbpf'::text, 'feed_bpf_custom'::text, 'feedbpfcustom'::text
  ]));

CREATE OR REPLACE FUNCTION public.handle_new_empresa_license()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_licenca_consultor public.licencas%ROWTYPE;
  v_produto TEXT;
  v_user_meta JSONB;
  v_valid_products TEXT[] := ARRAY['feed_bpf', 'audits_bpf', 'completo', 'agrogestao', 'nutricrm', 'feedbpfcustom'];
BEGIN
  SELECT raw_user_meta_data INTO v_user_meta FROM auth.users WHERE id = NEW.user_id;

  v_produto := lower(coalesce(v_user_meta->>'produto', 'feed_bpf'));
  IF v_produto = 'feedbpf' THEN v_produto := 'feed_bpf'; END IF;
  IF v_produto = 'auditsbpf' THEN v_produto := 'audits_bpf'; END IF;
  IF v_produto IN ('feed_bpf_custom','feed-bpf-custom','feedbpf-custom') THEN v_produto := 'feedbpfcustom'; END IF;

  IF NOT (v_produto = ANY(v_valid_products)) THEN v_produto := 'feed_bpf'; END IF;

  SELECT * INTO v_licenca_consultor
  FROM public.licencas
  WHERE user_id = NEW.user_id AND nivel = 'consultor'
    AND (produto = 'audits_bpf' OR produto = 'auditsbpf')
    AND status = 'ativa' AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC LIMIT 1;

  IF v_licenca_consultor.id IS NOT NULL THEN
    PERFORM public.vincular_empresa_licenca_consultor(v_licenca_consultor.id, NEW.id);
  END IF;

  INSERT INTO public.licencas (user_id, empresa_id, chave_licenca, plano, produto, nivel, slots_max, data_inicio, data_expiracao, status)
  VALUES (NEW.user_id, NEW.id, 'TRIAL-' || replace(gen_random_uuid()::text, '-', ''),
    'trial', v_produto, 'individual', 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'ativa');

  RETURN NEW;
END;
$function$;
