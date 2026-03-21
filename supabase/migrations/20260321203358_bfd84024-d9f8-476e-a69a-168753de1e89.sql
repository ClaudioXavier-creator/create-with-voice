
CREATE TABLE public.licencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chave_licenca text NOT NULL UNIQUE,
  plano text NOT NULL DEFAULT 'trial',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_expiracao date NOT NULL,
  status text NOT NULL DEFAULT 'ativa',
  stripe_checkout_id text,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.licencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own license"
  ON public.licencas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all licenses"
  ON public.licencas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_licencas_updated_at
  BEFORE UPDATE ON public.licencas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
