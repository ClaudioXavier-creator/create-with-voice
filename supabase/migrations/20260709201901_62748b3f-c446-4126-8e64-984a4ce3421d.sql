
-- 1) Central de Notificações
CREATE TABLE public.notificacoes_admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('lead_quente','ticket','licenca_expirando','erro_critico','meta','sistema','venda','cadencia')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  lida_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_admin_user_lida ON public.notificacoes_admin(user_id, lida, created_at DESC);
CREATE INDEX idx_notif_admin_tipo ON public.notificacoes_admin(tipo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes_admin TO authenticated;
GRANT ALL ON public.notificacoes_admin TO service_role;
ALTER TABLE public.notificacoes_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins podem ver todas notificações"
ON public.notificacoes_admin FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial') OR user_id = auth.uid());

CREATE POLICY "admins podem inserir notificações"
ON public.notificacoes_admin FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));

CREATE POLICY "admins podem atualizar notificações"
ON public.notificacoes_admin FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial') OR user_id = auth.uid());

CREATE POLICY "admins podem deletar notificações"
ON public.notificacoes_admin FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Preferências de notificação por admin
CREATE TABLE public.notificacoes_preferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  canais JSONB NOT NULL DEFAULT '{"in_app":true,"email":true,"whatsapp":false}'::jsonb,
  tipos_habilitados JSONB NOT NULL DEFAULT '{"lead_quente":true,"ticket":true,"licenca_expirando":true,"erro_critico":true,"meta":true,"sistema":true,"venda":true,"cadencia":true}'::jsonb,
  horario_silencio_inicio TIME DEFAULT '22:00',
  horario_silencio_fim TIME DEFAULT '07:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes_preferencias TO authenticated;
GRANT ALL ON public.notificacoes_preferencias TO service_role;
ALTER TABLE public.notificacoes_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cada admin gerencia suas preferências"
ON public.notificacoes_preferencias FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_notif_pref_updated
BEFORE UPDATE ON public.notificacoes_preferencias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) UTM tracking para atribuição de marketing
CREATE TABLE public.lead_utm (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID,
  lead_origem TEXT,
  email TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_utm_lead ON public.lead_utm(lead_id);
CREATE INDEX idx_lead_utm_source_campaign ON public.lead_utm(utm_source, utm_campaign);

GRANT SELECT ON public.lead_utm TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_utm TO authenticated;
GRANT ALL ON public.lead_utm TO service_role;
ALTER TABLE public.lead_utm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "captura pública de UTM"
ON public.lead_utm FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins/comercial leem UTM"
ON public.lead_utm FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));

-- 4) Cache de insights IA por lead
CREATE TABLE public.ai_lead_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_origem TEXT,
  proxima_acao TEXT,
  sinais_compra JSONB DEFAULT '[]'::jsonb,
  resumo TEXT,
  rascunho_email TEXT,
  rascunho_whatsapp TEXT,
  temperatura TEXT CHECK (temperatura IN ('frio','morno','quente','muito_quente')),
  score INTEGER,
  gerado_por TEXT DEFAULT 'gemini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_ai_lead_insights_lead ON public.ai_lead_insights(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_lead_insights TO authenticated;
GRANT ALL ON public.ai_lead_insights TO service_role;
ALTER TABLE public.ai_lead_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins/comercial leem insights IA"
ON public.ai_lead_insights FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));

CREATE POLICY "admins/comercial gerenciam insights IA"
ON public.ai_lead_insights FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));

CREATE TRIGGER trg_ai_insights_updated
BEFORE UPDATE ON public.ai_lead_insights
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
