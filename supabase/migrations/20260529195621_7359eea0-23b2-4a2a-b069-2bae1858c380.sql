-- Add verification columns to analises_laboratorio
ALTER TABLE public.analises_laboratorio 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';

-- Add verification columns to controle_pragas
ALTER TABLE public.controle_pragas 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';

-- Add verification columns to monitoramento_pcc
ALTER TABLE public.monitoramento_pcc 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';

-- Add verification columns to pac_monitoramento
ALTER TABLE public.pac_monitoramento 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';

-- Add verification columns to registros_limpeza
ALTER TABLE public.registros_limpeza 
ADD COLUMN IF NOT EXISTS verificado_por TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_verificacao TEXT DEFAULT 'pendente';
