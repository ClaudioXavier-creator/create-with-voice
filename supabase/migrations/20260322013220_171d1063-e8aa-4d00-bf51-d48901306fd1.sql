
-- Table for storing regulatory norms/legislation documents
CREATE TABLE public.normas_legislacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  codigo text DEFAULT '',
  tipo text DEFAULT 'instrucao_normativa',
  orgao text DEFAULT 'MAPA',
  data_publicacao date,
  resumo text DEFAULT '',
  arquivo_nome text DEFAULT '',
  arquivo_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.normas_legislacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own normas" ON public.normas_legislacao
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for legislation files
INSERT INTO storage.buckets (id, name, public) VALUES ('normas_legislacao', 'normas_legislacao', true);

CREATE POLICY "Users upload own normas files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'normas_legislacao' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own normas files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'normas_legislacao' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own normas files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'normas_legislacao' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read normas files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'normas_legislacao');
