
CREATE OR REPLACE FUNCTION public.handle_new_user_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.licencas (user_id, chave_licenca, plano, data_inicio, data_expiracao, status)
  VALUES (
    NEW.id,
    'TRIAL-' || encode(gen_random_bytes(8), 'hex'),
    'trial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'ativa'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_license
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_license();

CREATE POLICY "Users can activate license"
  ON public.licencas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
