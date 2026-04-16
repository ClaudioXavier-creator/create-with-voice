
-- Tabela de fórmulas (versionadas)
CREATE TABLE public.formulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  produto_nome TEXT NOT NULL,
  codigo TEXT NOT NULL,
  versao TEXT NOT NULL DEFAULT '01',
  data_versao DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ativa',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own formulas"
ON public.formulas FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_formulas_updated_at
BEFORE UPDATE ON public.formulas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_formulas_produto ON public.formulas(produto_id);
CREATE INDEX idx_formulas_user ON public.formulas(user_id);

-- Tabela de ingredientes (matérias-primas) das fórmulas
CREATE TABLE public.formula_ingredientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  formula_id UUID NOT NULL REFERENCES public.formulas(id) ON DELETE CASCADE,
  materia_prima TEXT NOT NULL,
  quantidade_kg NUMERIC(12,3) NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.formula_ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own formula_ingredientes"
ON public.formula_ingredientes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_formula_ing_formula ON public.formula_ingredientes(formula_id);

-- Adiciona campos na ordens_producao para vincular fórmula, volume do misturador e batidas
ALTER TABLE public.ordens_producao
  ADD COLUMN IF NOT EXISTS formula_id UUID REFERENCES public.formulas(id),
  ADD COLUMN IF NOT EXISTS volume_misturador_kg INTEGER,
  ADD COLUMN IF NOT EXISTS quantidade_sacos INTEGER,
  ADD COLUMN IF NOT EXISTS proximo_produto TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS necessita_flushing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS material_flushing TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS verificacao_responsavel TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS verificacao_data DATE;

-- Tabela para os lotes de matéria-prima usados em cada batida da OP
CREATE TABLE public.batida_lotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ordem_id UUID NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  numero_batida INTEGER NOT NULL DEFAULT 1,
  materia_prima TEXT NOT NULL,
  lote_mp TEXT DEFAULT '',
  quantidade_kg NUMERIC(12,3) NOT NULL DEFAULT 0,
  fornecedor TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batida_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own batida_lotes"
ON public.batida_lotes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_batida_lotes_ordem ON public.batida_lotes(ordem_id);
