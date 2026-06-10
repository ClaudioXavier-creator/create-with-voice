
CREATE TABLE public.whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  message_sid TEXT UNIQUE,
  from_number TEXT,
  to_number TEXT,
  body TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound','outbound')),
  status TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_mensagens_empresa ON public.whatsapp_mensagens(empresa_id);
CREATE INDEX idx_whatsapp_mensagens_from ON public.whatsapp_mensagens(from_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_mensagens TO authenticated;
GRANT ALL ON public.whatsapp_mensagens TO service_role;

ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da empresa veem mensagens"
ON public.whatsapp_mensagens FOR SELECT TO authenticated
USING (
  empresa_id IS NULL OR EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = whatsapp_mensagens.empresa_id
      AND em.user_id = auth.uid()
  )
);

CREATE POLICY "Membros da empresa inserem mensagens"
ON public.whatsapp_mensagens FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = whatsapp_mensagens.empresa_id
      AND em.user_id = auth.uid()
  )
);

CREATE POLICY "Membros da empresa atualizam mensagens"
ON public.whatsapp_mensagens FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = whatsapp_mensagens.empresa_id
      AND em.user_id = auth.uid()
  )
);

CREATE POLICY "Membros da empresa apagam mensagens"
ON public.whatsapp_mensagens FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = whatsapp_mensagens.empresa_id
      AND em.user_id = auth.uid()
  )
);
