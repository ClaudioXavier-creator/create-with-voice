
-- 1. LICENÇAS: Remove UPDATE policy from authenticated users (prevent plan escalation)
DROP POLICY IF EXISTS "Users can activate license" ON public.licencas;

-- 2. MODELOS_ACESSO: Block all client access explicitly
CREATE POLICY "Deny all client select on modelos_acesso"
ON public.modelos_acesso FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Deny all client insert on modelos_acesso"
ON public.modelos_acesso FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny all client update on modelos_acesso"
ON public.modelos_acesso FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all client delete on modelos_acesso"
ON public.modelos_acesso FOR DELETE
TO authenticated, anon
USING (false);

-- 3. STORAGE: Fix documentos_bpf SELECT policy (scope by folder)
DROP POLICY IF EXISTS "Authenticated users read own docs bpf" ON storage.objects;
CREATE POLICY "Authenticated users read own docs bpf"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos_bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. STORAGE: Fix documentos_bpf UPDATE policy (use folder path instead of owner)
DROP POLICY IF EXISTS "Users update own docs bpf" ON storage.objects;
CREATE POLICY "Users update own docs bpf"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos_bpf' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documentos_bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);
