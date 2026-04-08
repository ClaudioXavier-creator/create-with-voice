
-- Create private bucket for scanned BPF documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('feed-bpf', 'feed-bpf', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage: users can manage their own files
CREATE POLICY "Users can upload to their empresa folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feed-bpf' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.empresas WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view their empresa files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'feed-bpf' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.empresas WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their empresa files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'feed-bpf' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.empresas WHERE user_id = auth.uid()
));

-- Table to track uploaded documents with metadata
CREATE TABLE public.documentos_bpf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pop',
  pop_codigo TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  arquivo_nome TEXT NOT NULL,
  arquivo_path TEXT NOT NULL,
  data_documento DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_bpf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documentos_bpf"
ON public.documentos_bpf FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
