ALTER TABLE public.manuais_bpf
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'rascunho_pendente',
  ADD COLUMN IF NOT EXISTS resp_legal_nome TEXT,
  ADD COLUMN IF NOT EXISTS resp_legal_hash TEXT,
  ADD COLUMN IF NOT EXISTS resp_legal_assinado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resp_legal_user_id UUID,
  ADD COLUMN IF NOT EXISTS resp_tecnico_nome TEXT,
  ADD COLUMN IF NOT EXISTS resp_tecnico_crmv TEXT,
  ADD COLUMN IF NOT EXISTS resp_tecnico_hash TEXT,
  ADD COLUMN IF NOT EXISTS resp_tecnico_assinado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resp_tecnico_user_id UUID;

-- Índice para consultar rapidamente versões pendentes
CREATE INDEX IF NOT EXISTS idx_manuais_bpf_status ON public.manuais_bpf(user_id, status);

-- Validação: status permitidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manuais_bpf_status_check'
  ) THEN
    ALTER TABLE public.manuais_bpf
      ADD CONSTRAINT manuais_bpf_status_check
      CHECK (status IN ('rascunho_pendente','aguardando_rt','aguardando_legal','vigente','obsoleto'));
  END IF;
END $$;