ALTER TABLE public.arquivos_bpf ADD COLUMN IF NOT EXISTS pop_codigo TEXT;
CREATE INDEX IF NOT EXISTS idx_arquivos_bpf_pop_codigo ON public.arquivos_bpf(empresa_id, pop_codigo);