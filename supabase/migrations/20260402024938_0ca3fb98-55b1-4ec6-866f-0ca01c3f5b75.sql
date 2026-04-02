
-- Update the trial function to 7 days instead of 30
CREATE OR REPLACE FUNCTION public.handle_new_user_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.licencas (user_id, chave_licenca, plano, data_inicio, data_expiracao, status)
  VALUES (
    NEW.id,
    'TRIAL-' || replace(gen_random_uuid()::text, '-', ''),
    'trial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'ativa'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users for new signups
CREATE OR REPLACE TRIGGER on_auth_user_created_license
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_license();
