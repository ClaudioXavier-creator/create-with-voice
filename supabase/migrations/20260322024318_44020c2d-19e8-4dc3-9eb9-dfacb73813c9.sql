
-- Task 3: Add product disposal types (vencido/rejeitado) to controle_residuos
ALTER TABLE public.controle_residuos ADD COLUMN IF NOT EXISTS motivo_descarte TEXT;
ALTER TABLE public.controle_residuos ADD COLUMN IF NOT EXISTS lote_produto TEXT;
ALTER TABLE public.controle_residuos ADD COLUMN IF NOT EXISTS produto_nome TEXT;

-- Task 4: Add species segregation and animal origin fields to rastreabilidade
ALTER TABLE public.rastreabilidade ADD COLUMN IF NOT EXISTS especie_destino TEXT;
ALTER TABLE public.rastreabilidade ADD COLUMN IF NOT EXISTS contem_origem_animal BOOLEAN DEFAULT false;
ALTER TABLE public.rastreabilidade ADD COLUMN IF NOT EXISTS tipo_origem_animal TEXT;

-- Task 5: Add intermediate verification fields to calibracoes
ALTER TABLE public.calibracoes ADD COLUMN IF NOT EXISTS data_verificacao_intermediaria DATE;
ALTER TABLE public.calibracoes ADD COLUMN IF NOT EXISTS proxima_verificacao_intermediaria DATE;
ALTER TABLE public.calibracoes ADD COLUMN IF NOT EXISTS resultado_verificacao TEXT;
ALTER TABLE public.calibracoes ADD COLUMN IF NOT EXISTS verificacao_conforme BOOLEAN;
