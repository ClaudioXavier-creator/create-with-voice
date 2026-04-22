CREATE OR REPLACE FUNCTION public.get_limite_membros_empresa(_empresa_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nivel TEXT;
  v_plano TEXT;
BEGIN
  SELECT nivel, plano
    INTO v_nivel, v_plano
  FROM public.licencas
  WHERE empresa_id = _empresa_id
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  v_nivel := lower(coalesce(v_nivel, ''));
  v_plano := lower(coalesce(v_plano, ''));

  IF v_nivel LIKE '%avancado%' OR v_nivel LIKE '%avançado%' THEN
    RETURN 20;
  ELSIF v_nivel LIKE '%intermediario%' OR v_nivel LIKE '%intermediário%' THEN
    RETURN 10;
  ELSIF v_nivel LIKE '%entrada%' THEN
    RETURN 5;
  END IF;

  IF v_plano LIKE '%avancado%' OR v_plano LIKE '%avançado%' THEN
    RETURN 20;
  ELSIF v_plano LIKE '%intermediario%' OR v_plano LIKE '%intermediário%' THEN
    RETURN 10;
  ELSE
    RETURN 5;
  END IF;
END;
$function$;