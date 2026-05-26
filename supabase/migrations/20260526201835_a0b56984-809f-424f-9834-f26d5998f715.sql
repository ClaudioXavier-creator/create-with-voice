
-- 1) whatsapp_config: restrict to authenticated only
DROP POLICY IF EXISTS "Empresas can insert their own WhatsApp config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Empresas can update their own WhatsApp config" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Empresas can delete their own WhatsApp config" ON public.whatsapp_config;

CREATE POLICY "Admins insert WhatsApp config"
ON public.whatsapp_config FOR INSERT TO authenticated
WITH CHECK (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

CREATE POLICY "Admins update WhatsApp config"
ON public.whatsapp_config FOR UPDATE TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa))
WITH CHECK (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

CREATE POLICY "Admins delete WhatsApp config"
ON public.whatsapp_config FOR DELETE TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

-- 2) execucao_pop_carimbos: validate empresa membership and allow empresa-wide read
DROP POLICY IF EXISTS "Users insert own carimbos" ON public.execucao_pop_carimbos;
DROP POLICY IF EXISTS "Users view own carimbos" ON public.execucao_pop_carimbos;

CREATE POLICY "Users view carimbos empresa"
ON public.execucao_pop_carimbos FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid()))
);

CREATE POLICY "Users insert carimbos empresa"
ON public.execucao_pop_carimbos FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid()))
);

-- 3) is_membro_empresa: NULL guards
CREATE OR REPLACE FUNCTION public.is_membro_empresa(_empresa_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _empresa_id IS NULL OR _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.empresa_membros
      WHERE empresa_id = _empresa_id
        AND user_id = _user_id
        AND ativo = true
    )
  END;
$function$;

-- 4) Storage feed-bpf: add expira_em check to convites_empresa join
DROP POLICY IF EXISTS "Users can view their empresa files" ON storage.objects;
CREATE POLICY "Users can view their empresa files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'feed-bpf'
  AND (storage.foldername(name))[1] IN (
    SELECT empresas.id::text FROM public.empresas WHERE empresas.user_id = auth.uid()
    UNION
    SELECT empresa_membros.empresa_id::text FROM public.empresa_membros
      WHERE empresa_membros.user_id = auth.uid() AND empresa_membros.ativo = true
    UNION
    SELECT licenca_empresas.empresa_id::text FROM public.licenca_empresas
      WHERE licenca_empresas.user_id = auth.uid() AND licenca_empresas.ativo = true
    UNION
    SELECT convites_empresa.empresa_id::text FROM public.convites_empresa
      WHERE convites_empresa.email = auth.email()
        AND convites_empresa.aceito_em IS NOT NULL
        AND (convites_empresa.expira_em IS NULL OR convites_empresa.expira_em > now())
  )
);
