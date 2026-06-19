
-- Fix 1: Hide token_hash from authenticated admins (only service_role needs it)
REVOKE SELECT (token_hash) ON public.convites_empresa FROM authenticated;

-- Fix 2: tf_autocontroles_sessoes — use is_membro_empresa for proper multi-tenant isolation
DROP POLICY IF EXISTS tf_auto_select ON public.tf_autocontroles_sessoes;
DROP POLICY IF EXISTS tf_auto_update ON public.tf_autocontroles_sessoes;

CREATE POLICY tf_auto_select ON public.tf_autocontroles_sessoes
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid()))
);

CREATE POLICY tf_auto_update ON public.tf_autocontroles_sessoes
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid()))
)
WITH CHECK (
  auth.uid() = user_id
  OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid()))
);
