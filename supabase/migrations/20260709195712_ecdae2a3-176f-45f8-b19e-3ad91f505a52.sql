
-- Cadências: templates de sequência de follow-up
CREATE TABLE public.crm_cadencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  produto TEXT,
  etapa_gatilho TEXT NOT NULL DEFAULT 'novo',
  tier_gatilho TEXT NOT NULL DEFAULT 'todos',
  ativo BOOLEAN NOT NULL DEFAULT true,
  passos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_cadencias TO authenticated;
GRANT ALL ON public.crm_cadencias TO service_role;
ALTER TABLE public.crm_cadencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/comercial manage cadências"
  ON public.crm_cadencias FOR ALL TO authenticated
  USING (public.can_access_crm(auth.uid()))
  WITH CHECK (public.can_access_crm(auth.uid()));

CREATE TRIGGER trg_crm_cadencias_updated_at
  BEFORE UPDATE ON public.crm_cadencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Execuções por lead
CREATE TABLE public.crm_cadencia_execucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cadencia_id UUID NOT NULL REFERENCES public.crm_cadencias(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES public.crm_pipeline(id) ON DELETE CASCADE,
  lead_email TEXT,
  lead_telefone TEXT,
  lead_nome TEXT,
  passo_atual INTEGER NOT NULL DEFAULT 0,
  proximo_envio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ativa',
  ultimo_erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cad_exec_worker ON public.crm_cadencia_execucoes(status, proximo_envio_em) WHERE status = 'ativa';
CREATE INDEX idx_cad_exec_pipeline ON public.crm_cadencia_execucoes(pipeline_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_cadencia_execucoes TO authenticated;
GRANT ALL ON public.crm_cadencia_execucoes TO service_role;
ALTER TABLE public.crm_cadencia_execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/comercial manage execuções"
  ON public.crm_cadencia_execucoes FOR ALL TO authenticated
  USING (public.can_access_crm(auth.uid()))
  WITH CHECK (public.can_access_crm(auth.uid()));

CREATE TRIGGER trg_crm_cad_exec_updated_at
  BEFORE UPDATE ON public.crm_cadencia_execucoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
