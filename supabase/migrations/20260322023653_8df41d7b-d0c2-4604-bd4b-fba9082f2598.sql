
-- Task 1: Enhance POP-03 checklist - add checklist_pop03 table for specific hygiene checks
-- (The existing popsConfig already covers POP-03; we'll add more specific IN 15/2009 items via code)

-- Task 3: Add certificate of analysis fields to recebimento_mp
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS certificado_analise_numero TEXT;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS certificado_analise_url TEXT;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS certificado_analise_valido BOOLEAN DEFAULT NULL;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS validade TEXT;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS quantidade TEXT;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS temperatura TEXT;
ALTER TABLE public.recebimento_mp ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Task 5: Add retrabalho/sobra fields to ordens_producao
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS tipo_ordem TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS ordem_origem_id UUID REFERENCES public.ordens_producao(id);
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS motivo_retrabalho TEXT;
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS quantidade_sobra TEXT;
ALTER TABLE public.ordens_producao ADD COLUMN IF NOT EXISTS destino_sobra TEXT;
