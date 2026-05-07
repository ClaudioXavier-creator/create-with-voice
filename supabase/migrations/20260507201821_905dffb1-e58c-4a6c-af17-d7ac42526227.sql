
CREATE OR REPLACE FUNCTION public.can_access_crm(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'comercial'::app_role)
  )
$$;

CREATE TABLE public.crm_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  lead_origem TEXT NOT NULL CHECK (lead_origem IN ('produto', 'site')),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  produto_interesse TEXT,
  etapa TEXT NOT NULL DEFAULT 'novo' CHECK (etapa IN ('novo','contato','qualificado','proposta','ganho','perdido')),
  responsavel_id UUID,
  responsavel_nome TEXT,
  valor_estimado NUMERIC(12,2),
  motivo_perda TEXT,
  observacoes TEXT,
  ganho_em TIMESTAMPTZ,
  perdido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, lead_origem)
);
CREATE INDEX idx_crm_pipeline_etapa ON public.crm_pipeline(etapa);
CREATE INDEX idx_crm_pipeline_created ON public.crm_pipeline(created_at DESC);

ALTER TABLE public.crm_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view pipeline" ON public.crm_pipeline FOR SELECT TO authenticated USING (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM users insert pipeline" ON public.crm_pipeline FOR INSERT TO authenticated WITH CHECK (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM users update pipeline" ON public.crm_pipeline FOR UPDATE TO authenticated USING (public.can_access_crm(auth.uid())) WITH CHECK (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM users delete pipeline" ON public.crm_pipeline FOR DELETE TO authenticated USING (public.can_access_crm(auth.uid()));
CREATE TRIGGER trg_crm_pipeline_updated BEFORE UPDATE ON public.crm_pipeline FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipeline(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ligacao','email','whatsapp','reuniao','nota')),
  descricao TEXT NOT NULL,
  autor_id UUID NOT NULL,
  autor_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_interacoes_pipeline ON public.crm_interacoes(pipeline_id, created_at DESC);
ALTER TABLE public.crm_interacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users manage interacoes" ON public.crm_interacoes FOR ALL TO authenticated USING (public.can_access_crm(auth.uid())) WITH CHECK (public.can_access_crm(auth.uid()));

CREATE TABLE public.crm_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipeline(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  vencimento TIMESTAMPTZ NOT NULL,
  responsavel_id UUID,
  responsavel_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','concluida','cancelada')),
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_tarefas_vencimento ON public.crm_tarefas(vencimento) WHERE status = 'pendente';
ALTER TABLE public.crm_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users manage tarefas" ON public.crm_tarefas FOR ALL TO authenticated USING (public.can_access_crm(auth.uid())) WITH CHECK (public.can_access_crm(auth.uid()));
CREATE TRIGGER trg_crm_tarefas_updated BEFORE UPDATE ON public.crm_tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_emails_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipeline(id) ON DELETE CASCADE,
  para_email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo_html TEXT NOT NULL,
  enviado_por UUID NOT NULL,
  enviado_por_nome TEXT,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','falhou')),
  erro TEXT,
  message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_emails_pipeline ON public.crm_emails_enviados(pipeline_id, created_at DESC);
ALTER TABLE public.crm_emails_enviados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view emails" ON public.crm_emails_enviados FOR SELECT TO authenticated USING (public.can_access_crm(auth.uid()));
CREATE POLICY "CRM users insert emails" ON public.crm_emails_enviados FOR INSERT TO authenticated WITH CHECK (public.can_access_crm(auth.uid()) AND auth.uid() = enviado_por);

INSERT INTO public.crm_pipeline (lead_id, lead_origem, nome, email, telefone, produto_interesse, etapa, created_at)
SELECT id, 'produto', nome, email, telefone, produto_interesse, 'novo', created_at
FROM public.leads
ON CONFLICT (lead_id, lead_origem) DO NOTHING;

INSERT INTO public.crm_pipeline (lead_id, lead_origem, nome, email, telefone, produto_interesse, etapa, observacoes, created_at)
SELECT id, 'site', nome, email, telefone, programa, 'novo', mensagem, created_at
FROM public.leads_contato
ON CONFLICT (lead_id, lead_origem) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_lead_to_pipeline()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'leads' THEN
    INSERT INTO public.crm_pipeline (lead_id, lead_origem, nome, email, telefone, produto_interesse, etapa)
    VALUES (NEW.id, 'produto', NEW.nome, NEW.email, NEW.telefone, NEW.produto_interesse, 'novo')
    ON CONFLICT (lead_id, lead_origem) DO NOTHING;
  ELSIF TG_TABLE_NAME = 'leads_contato' THEN
    INSERT INTO public.crm_pipeline (lead_id, lead_origem, nome, email, telefone, produto_interesse, etapa, observacoes)
    VALUES (NEW.id, 'site', NEW.nome, NEW.email, NEW.telefone, NEW.programa, 'novo', NEW.mensagem)
    ON CONFLICT (lead_id, lead_origem) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leads_to_pipeline AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.sync_lead_to_pipeline();
CREATE TRIGGER trg_leads_contato_to_pipeline AFTER INSERT ON public.leads_contato FOR EACH ROW EXECUTE FUNCTION public.sync_lead_to_pipeline();
