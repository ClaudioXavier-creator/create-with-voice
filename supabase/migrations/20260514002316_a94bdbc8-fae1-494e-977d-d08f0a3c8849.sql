CREATE OR REPLACE FUNCTION public.handle_new_empresa_license()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_licenca_consultor public.licencas%ROWTYPE;
  v_produto TEXT;
  v_user_meta JSONB;
BEGIN
  -- Busca metadados do usuário no esquema auth
  SELECT raw_user_meta_data INTO v_user_meta
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Recupera o produto do cadastro ou assume feedbpf como padrão
  v_produto := lower(coalesce(v_user_meta->>'produto', 'feedbpf'));
  
  -- Normalização de nomes de produtos (remover hífens e underscores)
  v_produto := replace(replace(v_produto, '-', ''), '_', '');

  -- Verifica se há licença Consultor Audits ativa do user
  SELECT * INTO v_licenca_consultor
  FROM public.licencas
  WHERE user_id = NEW.user_id
    AND nivel = 'consultor'
    AND produto = 'auditsbpf' -- Normalizado
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
$function$;
