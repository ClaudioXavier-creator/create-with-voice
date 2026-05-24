-- Create a table for WhatsApp configurations (Evolution API)
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    instance_name TEXT,
    is_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id)
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
-- Since empresa_id is linked to the company, we should ensure the user belongs to that company.
-- For simplicity in this ecosystem, let's allow users to see/edit config if they have access to the company.

CREATE POLICY "Empresas can view their own WhatsApp config" 
ON public.whatsapp_config 
FOR SELECT 
USING (
    empresa_id IN (
        SELECT id FROM public.empresas WHERE user_id = auth.uid()
        UNION
        SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Empresas can insert their own WhatsApp config" 
ON public.whatsapp_config 
FOR INSERT 
WITH CHECK (
    empresa_id IN (
        SELECT id FROM public.empresas WHERE user_id = auth.uid()
        UNION
        SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Empresas can update their own WhatsApp config" 
ON public.whatsapp_config 
FOR UPDATE 
USING (
    empresa_id IN (
        SELECT id FROM public.empresas WHERE user_id = auth.uid()
        UNION
        SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Empresas can delete their own WhatsApp config" 
ON public.whatsapp_config 
FOR DELETE 
USING (
    empresa_id IN (
        SELECT id FROM public.empresas WHERE user_id = auth.uid()
        UNION
        SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON public.whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
