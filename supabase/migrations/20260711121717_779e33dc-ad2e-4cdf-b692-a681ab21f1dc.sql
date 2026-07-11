
CREATE TABLE public.empresa_modulos_custom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  modulo_codigo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ativado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, modulo_codigo)
);

CREATE INDEX idx_emc_empresa ON public.empresa_modulos_custom(empresa_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_modulos_custom TO authenticated;
GRANT ALL ON public.empresa_modulos_custom TO service_role;

ALTER TABLE public.empresa_modulos_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem módulos da empresa"
  ON public.empresa_modulos_custom FOR SELECT
  USING (public.pode_usar_empresa(empresa_id, auth.uid()));

CREATE POLICY "Membros gerenciam módulos da empresa"
  ON public.empresa_modulos_custom FOR ALL
  USING (public.pode_usar_empresa(empresa_id, auth.uid()))
  WITH CHECK (public.pode_usar_empresa(empresa_id, auth.uid()));

CREATE TRIGGER trg_emc_updated_at
  BEFORE UPDATE ON public.empresa_modulos_custom
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
