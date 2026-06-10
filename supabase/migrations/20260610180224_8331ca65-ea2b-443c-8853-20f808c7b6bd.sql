DROP POLICY IF EXISTS "Admin gerencia membros da empresa" ON public.empresa_membros;

CREATE POLICY "Admin seleciona membros"
ON public.empresa_membros FOR SELECT TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

CREATE POLICY "Admin insere membros"
ON public.empresa_membros FOR INSERT TO authenticated
WITH CHECK (
  public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa)
  AND (convidado_por IS NULL OR convidado_por = auth.uid())
);

CREATE POLICY "Admin atualiza membros"
ON public.empresa_membros FOR UPDATE TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa))
WITH CHECK (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

CREATE POLICY "Admin remove membros"
ON public.empresa_membros FOR DELETE TO authenticated
USING (
  public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa)
  AND user_id <> auth.uid()
);