
ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS registro_sipeagro text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sipeagro_verificado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sipeagro_data_verificacao date DEFAULT NULL;
