
-- 1. Fix modelos_acesso: remove SELECT policy exposing password hashes
DROP POLICY IF EXISTS "Anyone authenticated can check passwords" ON public.modelos_acesso;

-- 2. Fix documentos_bpf bucket: make it private
UPDATE storage.buckets SET public = false WHERE id = 'documentos_bpf';

-- Remove any overly permissive public read policy on this bucket
DROP POLICY IF EXISTS "Public read docs" ON storage.objects;

-- Add proper authenticated-only read policy for documentos_bpf
CREATE POLICY "Authenticated users read own docs bpf"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos_bpf');

-- 3. Fix profiles: change policies from public to authenticated
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also allow service_role to insert (for the handle_new_user trigger)
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
