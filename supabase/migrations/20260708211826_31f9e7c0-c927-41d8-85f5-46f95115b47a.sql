
ALTER TABLE public.modelos_empresa
  ADD COLUMN IF NOT EXISTS webhook_token uuid UNIQUE DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_modelos_empresa_webhook_token
  ON public.modelos_empresa(webhook_token);

-- Backfill para modelos existentes sem token
UPDATE public.modelos_empresa SET webhook_token = gen_random_uuid() WHERE webhook_token IS NULL;
