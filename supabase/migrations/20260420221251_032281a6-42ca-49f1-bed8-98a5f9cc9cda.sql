DROP POLICY IF EXISTS "Service role gerencia convites" ON public.convites_empresa;

CREATE POLICY "Service role consulta convites"
ON public.convites_empresa
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role insere convites"
ON public.convites_empresa
FOR INSERT
TO service_role
WITH CHECK (auth.uid() IS NULL OR convidado_por IS NOT NULL);

CREATE POLICY "Service role atualiza convites"
ON public.convites_empresa
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role remove convites"
ON public.convites_empresa
FOR DELETE
TO service_role
USING (true);