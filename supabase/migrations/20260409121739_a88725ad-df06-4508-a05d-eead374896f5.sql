
-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-bpf',
  'documentos-bpf',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos-bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos-bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documentos-bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documentos-bpf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add columns for file attachments on recebimento_mp
ALTER TABLE public.recebimento_mp
ADD COLUMN IF NOT EXISTS contraprova_retida boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contraprova_quantidade text,
ADD COLUMN IF NOT EXISTS contraprova_validade text,
ADD COLUMN IF NOT EXISTS contraprova_local text;

-- Add laudo_url to analises_laboratorio if not already present
ALTER TABLE public.analises_laboratorio
ADD COLUMN IF NOT EXISTS laudo_url text;

-- Add certificado columns to calibracoes
ALTER TABLE public.calibracoes
ADD COLUMN IF NOT EXISTS certificado_numero text,
ADD COLUMN IF NOT EXISTS verificacao_conforme boolean,
ADD COLUMN IF NOT EXISTS resultado_verificacao text,
ADD COLUMN IF NOT EXISTS data_verificacao_intermediaria text,
ADD COLUMN IF NOT EXISTS proxima_verificacao_intermediaria text;
