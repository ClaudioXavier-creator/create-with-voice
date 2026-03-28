
-- Add tipo_limpeza to registros_limpeza (POP 02 - seca/úmida)
ALTER TABLE public.registros_limpeza ADD COLUMN IF NOT EXISTS tipo_limpeza text DEFAULT 'umida';

-- Add contraprova fields to recebimento_mp
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS contraprova_retida boolean DEFAULT false;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS contraprova_local text DEFAULT '';
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS contraprova_validade text DEFAULT '';
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS contraprova_quantidade text DEFAULT '';

-- Add contraprova fields to producao
ALTER TABLE public.producao ADD COLUMN IF NOT EXISTS contraprova_retida boolean DEFAULT false;
ALTER TABLE public.producao ADD COLUMN IF NOT EXISTS contraprova_local text DEFAULT '';
ALTER TABLE public.producao ADD COLUMN IF NOT EXISTS contraprova_validade text DEFAULT '';
ALTER TABLE public.producao ADD COLUMN IF NOT EXISTS contraprova_quantidade text DEFAULT '';

-- Add sequencia_producao to ordens_producao for sequencing
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS sequencia_producao integer DEFAULT 0;
