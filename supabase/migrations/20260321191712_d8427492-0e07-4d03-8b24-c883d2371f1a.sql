
-- Table for BPF document files (manual, POPs, ITs, planilhas)
CREATE TABLE IF NOT EXISTS public.arquivos_bpf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  categoria text NOT NULL, -- 'manual_bpf', 'pop', 'it', 'planilha_preenchida', 'outro'
  titulo text NOT NULL,
  descricao text DEFAULT '',
  arquivo_nome text DEFAULT '',
  arquivo_url text DEFAULT '',
  documento_ref_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arquivos_bpf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own arquivos_bpf"
  ON public.arquivos_bpf FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Make storage bucket public so uploaded files can be viewed
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_bpf', 'documentos_bpf', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos_bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos_bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos_bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos_bpf');
