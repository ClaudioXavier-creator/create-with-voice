
-- ===== CAMPANHAS =====
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  template_texto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','em_andamento','pausada','concluida','cancelada')),
  origem TEXT NOT NULL DEFAULT 'crm' CHECK (origem IN ('crm','manual')),
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  intervalo_min_seg INT NOT NULL DEFAULT 30 CHECK (intervalo_min_seg >= 10),
  intervalo_max_seg INT NOT NULL DEFAULT 90 CHECK (intervalo_max_seg >= 10),
  pausa_a_cada INT NOT NULL DEFAULT 20 CHECK (pausa_a_cada > 0),
  pausa_duracao_seg INT NOT NULL DEFAULT 300 CHECK (pausa_duracao_seg >= 0),
  limite_diario INT NOT NULL DEFAULT 300 CHECK (limite_diario > 0),
  total INT NOT NULL DEFAULT 0,
  enviados INT NOT NULL DEFAULT 0,
  erros INT NOT NULL DEFAULT 0,
  optouts INT NOT NULL DEFAULT 0,
  enviados_hoje INT NOT NULL DEFAULT 0,
  enviados_hoje_data DATE,
  iniciada_em TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  ultimo_envio_em TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campanhas TO authenticated;
GRANT ALL ON public.campanhas TO service_role;

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem campanhas" ON public.campanhas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins criam campanhas" ON public.campanhas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins editam campanhas" ON public.campanhas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins excluem campanhas" ON public.campanhas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_campanhas_updated BEFORE UPDATE ON public.campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== FILA DE MENSAGENS =====
CREATE TABLE public.campanha_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  nome TEXT,
  empresa TEXT,
  produto TEXT,
  mensagem_final TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviando','enviado','erro','optout','cancelado')),
  agendado_para TIMESTAMPTZ NOT NULL DEFAULT now(),
  tentativas INT NOT NULL DEFAULT 0,
  erro TEXT,
  enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_camp_msg_campanha ON public.campanha_mensagens(campanha_id);
CREATE INDEX idx_camp_msg_agenda ON public.campanha_mensagens(status, agendado_para) WHERE status = 'pendente';
CREATE INDEX idx_camp_msg_telefone ON public.campanha_mensagens(telefone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campanha_mensagens TO authenticated;
GRANT ALL ON public.campanha_mensagens TO service_role;

ALTER TABLE public.campanha_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam mensagens campanha" ON public.campanha_mensagens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ===== OPT-OUT =====
CREATE TABLE public.campanha_optout (
  telefone TEXT PRIMARY KEY,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.campanha_optout TO authenticated;
GRANT ALL ON public.campanha_optout TO service_role;

ALTER TABLE public.campanha_optout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam optouts" ON public.campanha_optout FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
