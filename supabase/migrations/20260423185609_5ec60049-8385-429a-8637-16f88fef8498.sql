ALTER TABLE public.expedicoes
ADD COLUMN IF NOT EXISTS operador_nome text DEFAULT ''::text,
ADD COLUMN IF NOT EXISTS pin_hash_confirmacao text,
ADD COLUMN IF NOT EXISTS assinatura_data timestamp with time zone,
ADD COLUMN IF NOT EXISTS comprovante_arquivo_nome text DEFAULT ''::text,
ADD COLUMN IF NOT EXISTS comprovante_arquivo_path text DEFAULT ''::text,
ADD COLUMN IF NOT EXISTS sync_origem text NOT NULL DEFAULT 'online'::text;

ALTER TABLE public.expedicao_itens
ADD COLUMN IF NOT EXISTS operador_nome text DEFAULT ''::text,
ADD COLUMN IF NOT EXISTS pin_hash_confirmacao text,
ADD COLUMN IF NOT EXISTS assinatura_data timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expedicoes_sync_origem_check'
  ) THEN
    ALTER TABLE public.expedicoes
    ADD CONSTRAINT expedicoes_sync_origem_check
    CHECK (sync_origem IN ('online', 'offline_queue'));
  END IF;
END $$;