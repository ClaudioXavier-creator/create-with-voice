
-- 1. Enable RLS on modelos_acesso and add no client policies (service_role only)
ALTER TABLE public.modelos_acesso ENABLE ROW LEVEL SECURITY;

-- 2. Add missing UPDATE policy for documentos_bpf storage bucket
CREATE POLICY "Users update own docs bpf"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos_bpf' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'documentos_bpf' AND auth.uid() = owner);

-- 3. Make normas_legislacao bucket private
UPDATE storage.buckets SET public = false WHERE id = 'normas_legislacao';

-- Remove public read policy
DROP POLICY IF EXISTS "Public read normas files" ON storage.objects;
