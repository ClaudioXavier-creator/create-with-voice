ALTER TABLE public.arquivos_bpf
  ADD COLUMN IF NOT EXISTS tipo_doc TEXT,
  ADD COLUMN IF NOT EXISTS numero_doc INTEGER,
  ADD COLUMN IF NOT EXISTS data_ref DATE,
  ADD COLUMN IF NOT EXISTS nome_padronizado TEXT;

CREATE INDEX IF NOT EXISTS idx_arquivos_bpf_padrao
  ON public.arquivos_bpf(empresa_id, pop_codigo, tipo_doc, numero_doc);