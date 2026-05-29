-- Add verification columns to execucao_pops
ALTER TABLE public.execucao_pops 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';

-- Add verification columns to recebimento_mp
ALTER TABLE public.recebimento_mp 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';

-- Add verification columns to fornecedores
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';
