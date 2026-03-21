
ALTER TABLE public.rastreabilidade
  ADD COLUMN IF NOT EXISTS cliente_destino text DEFAULT '',
  ADD COLUMN IF NOT EXISTS local_entrega text DEFAULT '',
  ADD COLUMN IF NOT EXISTS data_venda date,
  ADD COLUMN IF NOT EXISTS nota_fiscal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantidade_vendida text DEFAULT '',
  ADD COLUMN IF NOT EXISTS recall_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recall_motivo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS recall_data date,
  ADD COLUMN IF NOT EXISTS recall_status text DEFAULT '';
