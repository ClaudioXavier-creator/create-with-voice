DROP POLICY IF EXISTS "Users can create leads" ON public.leads_contato;

CREATE POLICY "Users can create leads"
ON public.leads_contato
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);