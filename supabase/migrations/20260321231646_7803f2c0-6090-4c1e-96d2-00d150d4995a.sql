CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

CREATE OR REPLACE FUNCTION public.handle_new_user_license()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.licencas (user_id, chave_licenca, plano, data_inicio, data_expiracao, status)
  VALUES (
    NEW.id,
    'TRIAL-' || encode(public.gen_random_bytes(8), 'hex'),
    'trial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'ativa'
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created_license ON auth.users;
CREATE TRIGGER on_auth_user_created_license
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_license();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();