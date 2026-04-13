
CREATE TABLE public.leads_contato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  mensagem TEXT,
  programa TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_contato ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own leads
CREATE POLICY "Users can create leads"
ON public.leads_contato
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users with admin role can view all leads
CREATE POLICY "Admins can view all leads"
ON public.leads_contato
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own leads
CREATE POLICY "Users can view own leads"
ON public.leads_contato
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
