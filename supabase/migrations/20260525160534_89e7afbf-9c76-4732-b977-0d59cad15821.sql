
-- Fix 1: pode_usar_empresa should return false on NULL empresa_id
CREATE OR REPLACE FUNCTION public.pode_usar_empresa(_empresa_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result boolean;
BEGIN
  -- Reject null empresa_id to prevent license/tenant bypass
  IF _empresa_id IS NULL OR _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.empresa_membros em
    WHERE em.empresa_id = _empresa_id
      AND em.user_id = _user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.empresas e
    WHERE e.id = _empresa_id
      AND e.user_id = _user_id
  ) INTO v_result;

  RETURN COALESCE(v_result, false);
END;
$$;

-- Fix 2: restrict whatsapp_config SELECT to admin role
DROP POLICY IF EXISTS "Members can view whatsapp config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Membros podem ver whatsapp_config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Usuarios podem ver whatsapp_config da empresa" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Empresa members can view whatsapp_config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_select" ON public.whatsapp_config;

CREATE POLICY "Only admins can view whatsapp_config"
ON public.whatsapp_config
FOR SELECT
TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'));
