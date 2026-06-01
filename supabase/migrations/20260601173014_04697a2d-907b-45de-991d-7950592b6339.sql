ALTER TABLE public.ordens_producao 
ADD COLUMN IF NOT EXISTS tempo_mistura_padrao_minutos INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS tipo_embalagem TEXT,
ADD COLUMN IF NOT EXISTS local_armazenamento TEXT;

COMMENT ON COLUMN public.ordens_producao.tempo_mistura_padrao_minutos IS 'Tempo de mistura mínimo definido para esta ordem (IN 04/2007).';
COMMENT ON COLUMN public.ordens_producao.tipo_embalagem IS 'Tipo de ensaque (ex: Sacos 25kg, Big Bag 1000kg).';
COMMENT ON COLUMN public.ordens_producao.local_armazenamento IS 'Local de estocagem do produto acabado.';