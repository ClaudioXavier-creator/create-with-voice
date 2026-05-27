
-- Tighten WITH CHECK on multi-tenant CRM tables to require active empresa license
DROP POLICY IF EXISTS "Isolamento por empresa - agrorc_pipeline" ON public.agrorc_pipeline;
CREATE POLICY "Isolamento por empresa - agrorc_pipeline" ON public.agrorc_pipeline
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = agrorc_pipeline.empresa_id AND em.user_id = auth.uid() AND em.ativo = true)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.pode_usar_empresa(empresa_id, auth.uid())
  AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = agrorc_pipeline.empresa_id AND em.user_id = auth.uid() AND em.ativo = true))
);

DROP POLICY IF EXISTS "Isolamento por empresa - agrorc_clientes" ON public.agrorc_clientes;
CREATE POLICY "Isolamento por empresa - agrorc_clientes" ON public.agrorc_clientes
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = agrorc_clientes.empresa_id AND em.user_id = auth.uid() AND em.ativo = true)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.pode_usar_empresa(empresa_id, auth.uid())
  AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = agrorc_clientes.empresa_id AND em.user_id = auth.uid() AND em.ativo = true))
);

DROP POLICY IF EXISTS "Isolamento por empresa - agrorc_visitas" ON public.agrorc_visitas;
CREATE POLICY "Isolamento por empresa - agrorc_visitas" ON public.agrorc_visitas
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = agrorc_visitas.empresa_id AND em.user_id = auth.uid() AND em.ativo = true)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.pode_usar_empresa(empresa_id, auth.uid())
  AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = agrorc_visitas.empresa_id AND em.user_id = auth.uid() AND em.ativo = true))
);

DROP POLICY IF EXISTS "Isolamento por empresa - nutricrm_projetos" ON public.nutricrm_projetos;
CREATE POLICY "Isolamento por empresa - nutricrm_projetos" ON public.nutricrm_projetos
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = nutricrm_projetos.empresa_id AND em.user_id = auth.uid() AND em.ativo = true)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.pode_usar_empresa(empresa_id, auth.uid())
  AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = nutricrm_projetos.empresa_id AND em.user_id = auth.uid() AND em.ativo = true))
);

-- Scope empresa_pin by both owner AND active empresa membership
DROP POLICY IF EXISTS "Users manage own empresa_pin" ON public.empresa_pin;
CREATE POLICY "Users manage own empresa_pin" ON public.empresa_pin
FOR ALL TO authenticated
USING (
  auth.uid() = user_id
  AND (empresa_id IS NULL OR EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = empresa_pin.empresa_id AND em.user_id = auth.uid() AND em.ativo = true))
)
WITH CHECK (
  auth.uid() = user_id
  AND (empresa_id IS NULL OR EXISTS (SELECT 1 FROM public.empresa_membros em WHERE em.empresa_id = empresa_pin.empresa_id AND em.user_id = auth.uid() AND em.ativo = true))
);
