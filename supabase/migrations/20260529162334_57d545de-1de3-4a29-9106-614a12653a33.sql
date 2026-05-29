-- Create table for equipment inventory
CREATE TABLE public.equipamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    codigo TEXT,
    fabricante TEXT,
    modelo TEXT,
    serie TEXT,
    data_aquisicao DATE,
    setor TEXT,
    requisitos_manutencao TEXT,
    periodicidade_manutencao TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;

-- Enable RLS
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's equipment" 
ON public.equipamentos FOR SELECT 
USING (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert equipment for their company" 
ON public.equipamentos FOR INSERT 
WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company's equipment" 
ON public.equipamentos FOR UPDATE 
USING (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company's equipment" 
ON public.equipamentos FOR DELETE 
USING (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_equipamentos_updated_at
    BEFORE UPDATE ON public.equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
