CREATE TABLE public.mapa_estabelecimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fonte_linha_id TEXT,
  cnpj TEXT,
  registro_estabelecimento TEXT,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  situacao TEXT,
  categoria TEXT,
  atividade TEXT,
  municipio TEXT,
  uf TEXT,
  endereco TEXT,
  cep TEXT,
  data_registro DATE,
  data_atualizacao_fonte DATE,
  importado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  importacao_id UUID,
  dados_brutos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.mapa_importacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arquivo_nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processando',
  total_linhas INTEGER NOT NULL DEFAULT 0,
  total_importadas INTEGER NOT NULL DEFAULT 0,
  total_rejeitadas INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  imported_by UUID NOT NULL,
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT mapa_importacoes_status_check CHECK (status = ANY (ARRAY['processando'::text, 'concluida'::text, 'concluida_parcial'::text, 'falhou'::text]))
);

ALTER TABLE public.mapa_estabelecimentos
  ADD CONSTRAINT mapa_estabelecimentos_importacao_id_fkey
  FOREIGN KEY (importacao_id)
  REFERENCES public.mapa_importacoes(id)
  ON DELETE SET NULL;

CREATE INDEX idx_mapa_estabelecimentos_cnpj ON public.mapa_estabelecimentos (cnpj);
CREATE INDEX idx_mapa_estabelecimentos_registro ON public.mapa_estabelecimentos (registro_estabelecimento);
CREATE INDEX idx_mapa_estabelecimentos_razao_social ON public.mapa_estabelecimentos (razao_social);
CREATE INDEX idx_mapa_estabelecimentos_municipio_uf ON public.mapa_estabelecimentos (municipio, uf);
CREATE INDEX idx_mapa_estabelecimentos_importacao_id ON public.mapa_estabelecimentos (importacao_id);

ALTER TABLE public.mapa_estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view MAPA establishments"
ON public.mapa_estabelecimentos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert MAPA establishments"
ON public.mapa_estabelecimentos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update MAPA establishments"
ON public.mapa_estabelecimentos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete MAPA establishments"
ON public.mapa_estabelecimentos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view MAPA imports"
ON public.mapa_importacoes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert MAPA imports"
ON public.mapa_importacoes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND imported_by = auth.uid());

CREATE POLICY "Admins can update MAPA imports"
ON public.mapa_importacoes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete MAPA imports"
ON public.mapa_importacoes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mapa_estabelecimentos_updated_at
BEFORE UPDATE ON public.mapa_estabelecimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mapa_importacoes_updated_at
BEFORE UPDATE ON public.mapa_importacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();