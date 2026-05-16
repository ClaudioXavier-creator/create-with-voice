
-- 1. Restringir INSERT em leads para evitar spoofing de user_id
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );

-- 2. Adicionar policy UPDATE para bucket feed-bpf (mesma lógica do INSERT/DELETE)
CREATE POLICY "Users can update their empresa files"
  ON storage.objects
  FOR UPDATE
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
  )
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

-- 3. Adicionar policy UPDATE para bucket normas_legislacao
CREATE POLICY "Users update own normas files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'normas_legislacao' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'normas_legislacao' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Permitir aprovadores e membros da empresa visualizarem o histórico de aprovações
CREATE POLICY "Aprovadores podem ver aprovacoes"
  ON public.documento_aprovacoes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = aprovador_user_id);

CREATE POLICY "Membros da empresa podem ver aprovacoes"
  ON public.documento_aprovacoes
  FOR SELECT
  TO authenticated
  USING (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid()));
