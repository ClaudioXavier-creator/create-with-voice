ALTER TABLE public.recebimento_mp 
ADD COLUMN IF NOT EXISTS numero_nota_fiscal TEXT,
ADD COLUMN IF NOT EXISTS nota_fiscal_url TEXT,
ADD COLUMN IF NOT EXISTS laudo_url TEXT;

COMMENT ON COLUMN public.recebimento_mp.numero_nota_fiscal IS 'Número da Nota Fiscal de entrada da matéria-prima';
COMMENT ON COLUMN public.recebimento_mp.nota_fiscal_url IS 'URL do arquivo da Nota Fiscal de entrada';
COMMENT ON COLUMN public.recebimento_mp.laudo_url IS 'URL de laudos técnicos ou análises complementares do fornecedor';
