-- Tabela de histórico de manuais BPF gerados
CREATE TABLE public.manuais_bpf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID,
  versao INTEGER NOT NULL DEFAULT 1,
  titulo TEXT NOT NULL DEFAULT 'Manual BPF',
  arquivo_path TEXT,
  arquivo_nome TEXT,
  conteudo TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  total_pops INTEGER NOT NULL DEFAULT 0,
  total_its INTEGER NOT NULL DEFAULT 0,
  total_documentos INTEGER NOT NULL DEFAULT 0,
  total_fornecedores INTEGER NOT NULL DEFAULT 0,
  total_produtos INTEGER NOT NULL DEFAULT 0,
  total_calibracoes INTEGER NOT NULL DEFAULT 0,
  gerado_por_nome TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_manuais_bpf_user ON public.manuais_bpf(user_id);
CREATE INDEX idx_manuais_bpf_empresa ON public.manuais_bpf(empresa_id);

ALTER TABLE public.manuais_bpf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own manuais_bpf"
ON public.manuais_bpf
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_manuais_bpf_updated_at
BEFORE UPDATE ON public.manuais_bpf
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies para manuais dentro do bucket documentos-bpf
-- Estrutura: manuais/{user_id}/Manual_BPF_v{N}_{timestamp}.txt
CREATE POLICY "Users view own manuais files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-bpf'
  AND (storage.foldername(name))[1] = 'manuais'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users upload own manuais files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-bpf'
  AND (storage.foldername(name))[1] = 'manuais'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users delete own manuais files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-bpf'
  AND (storage.foldername(name))[1] = 'manuais'
  AND (storage.foldername(name))[2] = auth.uid()::text
);