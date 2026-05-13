-- Update SELECT policy for feed-bpf bucket
DROP POLICY IF EXISTS "Users can view their empresa files" ON storage.objects;
CREATE POLICY "Users can view their empresa files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feed-bpf' 
  AND (storage.foldername(name))[1] IN (
    -- Own companies
    SELECT id::text FROM public.empresas WHERE user_id = auth.uid()
    UNION
    -- Member companies
    SELECT empresa_id::text FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true
    UNION
    -- Companies linked via license
    SELECT empresa_id::text FROM public.licenca_empresas WHERE user_id = auth.uid() AND ativo = true
    UNION
    -- Invite acceptance logic (if needed)
    SELECT empresa_id::text FROM public.convites_empresa WHERE email = auth.email() AND aceito_em IS NOT NULL
  )
);

-- Update INSERT policy for feed-bpf bucket
DROP POLICY IF EXISTS "Users can upload to their empresa folders" ON storage.objects;
CREATE POLICY "Users can upload to their empresa folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-bpf' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.empresas WHERE user_id = auth.uid()
    UNION
    SELECT empresa_id::text FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true
    UNION
    SELECT empresa_id::text FROM public.licenca_empresas WHERE user_id = auth.uid() AND ativo = true
  )
);

-- Update DELETE policy for feed-bpf bucket
DROP POLICY IF EXISTS "Users can delete their empresa files" ON storage.objects;
CREATE POLICY "Users can delete their empresa files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feed-bpf' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.empresas WHERE user_id = auth.uid()
    UNION
    SELECT empresa_id::text FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true
    UNION
    SELECT empresa_id::text FROM public.licenca_empresas WHERE user_id = auth.uid() AND ativo = true
  )
);
