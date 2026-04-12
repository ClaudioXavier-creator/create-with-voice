-- Add empresa_id and admin override flag to licencas
ALTER TABLE public.licencas
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS liberado_admin boolean NOT NULL DEFAULT false;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_licencas_empresa_id ON public.licencas(empresa_id);

-- Update RLS: users can view licenses for their own empresas
DROP POLICY IF EXISTS "Users can view own license" ON public.licencas;
CREATE POLICY "Users can view own empresa licenses"
  ON public.licencas
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
  );

-- Auto-create trial license when a new empresa is created
CREATE OR REPLACE FUNCTION public.handle_new_empresa_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.licencas (user_id, empresa_id, chave_licenca, plano, data_inicio, data_expiracao, status)
  VALUES (
    NEW.user_id,
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

CREATE TRIGGER on_empresa_created_license
  AFTER INSERT ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_empresa_license();