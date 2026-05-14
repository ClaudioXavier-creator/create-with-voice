-- Restringe INSERT autenticado em leads_contato para exigir user_id = auth.uid().
-- Mantém INSERT anônimo (formulário público) com user_id NULL.
DROP POLICY IF EXISTS "Users can create leads" ON public.leads_contato;

CREATE POLICY "Authenticated users insert own leads"
ON public.leads_contato
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous can submit contact lead"
ON public.leads_contato
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);
