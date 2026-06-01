ALTER TABLE public.expedicao_itens ADD COLUMN IF NOT EXISTS quantidade_sacos INTEGER;

COMMENT ON COLUMN public.expedicao_itens.quantidade_sacos IS 'Quantidade de sacos/volumes físicos expedidos para este lote.';
