
-- Fix remaining tables with public role

-- treinamentos
DROP POLICY IF EXISTS "Users manage own treinamentos" ON public.treinamentos;
CREATE POLICY "Users manage own treinamentos" ON public.treinamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- rotulos
DROP POLICY IF EXISTS "Users manage own rotulos" ON public.rotulos;
CREATE POLICY "Users manage own rotulos" ON public.rotulos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- testes_rastreabilidade
DROP POLICY IF EXISTS "Users manage own testes_rastreabilidade" ON public.testes_rastreabilidade;
CREATE POLICY "Users manage own testes_rastreabilidade" ON public.testes_rastreabilidade FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saude_manipuladores
DROP POLICY IF EXISTS "Users manage own saude_manipuladores" ON public.saude_manipuladores;
CREATE POLICY "Users manage own saude_manipuladores" ON public.saude_manipuladores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- validacao_limpeza_linha
DROP POLICY IF EXISTS "Users manage own validacao_limpeza_linha" ON public.validacao_limpeza_linha;
CREATE POLICY "Users manage own validacao_limpeza_linha" ON public.validacao_limpeza_linha FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix storage policies: documentos-bpf bucket (public -> authenticated)
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos-bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-bpf' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documentos-bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Fix storage: relatorios bucket (public -> authenticated)
DROP POLICY IF EXISTS "Users can delete own relatorios" ON storage.objects;
CREATE POLICY "Users can delete own relatorios" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'relatorios' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload relatorios" ON storage.objects;
CREATE POLICY "Users can upload relatorios" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'relatorios' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view own relatorios" ON storage.objects;
CREATE POLICY "Users can view own relatorios" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'relatorios' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Fix storage: documentos_bpf bucket remaining public policies
DROP POLICY IF EXISTS "Users delete own docs" ON storage.objects;
CREATE POLICY "Users delete own docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos_bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users upload own docs" ON storage.objects;
CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos_bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users view own docs" ON storage.objects;
CREATE POLICY "Users view own docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos_bpf' AND (auth.uid())::text = (storage.foldername(name))[1]);
