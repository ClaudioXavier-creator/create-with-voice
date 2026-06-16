
CREATE TABLE public.tf_autocontroles_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel TEXT,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  score_pct NUMERIC,
  total_nc INTEGER DEFAULT 0,
  total_nc_obrigatorios INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tf_autocontroles_sessoes TO authenticated;
GRANT ALL ON public.tf_autocontroles_sessoes TO service_role;

ALTER TABLE public.tf_autocontroles_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tf_auto_select" ON public.tf_autocontroles_sessoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id AND e.user_id = auth.uid())));

CREATE POLICY "tf_auto_insert" ON public.tf_autocontroles_sessoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tf_auto_update" ON public.tf_autocontroles_sessoes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id AND e.user_id = auth.uid())));

CREATE POLICY "tf_auto_delete" ON public.tf_autocontroles_sessoes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_tf_auto_updated
  BEFORE UPDATE ON public.tf_autocontroles_sessoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
