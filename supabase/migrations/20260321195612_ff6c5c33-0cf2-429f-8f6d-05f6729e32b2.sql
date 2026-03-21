
-- Fornecedores table
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  contato TEXT DEFAULT '',
  email TEXT DEFAULT '',
  tipo_produto TEXT DEFAULT '',
  status_qualificacao TEXT DEFAULT 'pendente',
  nota_avaliacao INTEGER DEFAULT 0,
  ultima_avaliacao DATE,
  proxima_avaliacao DATE,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fornecedores" ON public.fornecedores
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Calibracoes table
CREATE TABLE public.calibracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  equipamento TEXT NOT NULL,
  codigo TEXT DEFAULT '',
  tipo TEXT DEFAULT 'balanca',
  localizacao TEXT DEFAULT '',
  data_calibracao DATE DEFAULT CURRENT_DATE,
  proxima_calibracao DATE,
  responsavel TEXT DEFAULT '',
  certificado_numero TEXT DEFAULT '',
  status TEXT DEFAULT 'calibrado',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calibracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calibracoes" ON public.calibracoes
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
