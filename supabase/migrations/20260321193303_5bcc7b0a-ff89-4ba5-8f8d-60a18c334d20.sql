
-- Ordens de Produção (PCP)
CREATE TABLE IF NOT EXISTS public.ordens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero_ordem text NOT NULL,
  data_programada date NOT NULL DEFAULT CURRENT_DATE,
  produto text NOT NULL,
  formula_nome text NOT NULL DEFAULT '',
  lote_produto text DEFAULT '',
  quantidade_programada text DEFAULT '',
  unidade text DEFAULT 'kg',
  numero_batidas integer DEFAULT 1,
  peso_por_batida text DEFAULT '',
  prioridade text DEFAULT 'normal',
  status text DEFAULT 'programada',
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ordens_producao"
  ON public.ordens_producao FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Itens da fórmula (ingredientes de cada ordem)
CREATE TABLE IF NOT EXISTS public.formula_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ordem_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  materia_prima text NOT NULL,
  lote_mp text DEFAULT '',
  fornecedor text DEFAULT '',
  quantidade_formula text DEFAULT '',
  unidade text DEFAULT 'kg',
  percentual text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.formula_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own formula_itens"
  ON public.formula_itens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Batidas de produção (cada mistura)
CREATE TABLE IF NOT EXISTS public.batidas_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ordem_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  numero_batida integer NOT NULL DEFAULT 1,
  operador text DEFAULT '',
  hora_inicio time DEFAULT NULL,
  hora_fim time DEFAULT NULL,
  tempo_mistura_minutos integer DEFAULT NULL,
  temperatura text DEFAULT '',
  status text DEFAULT 'pendente',
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.batidas_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own batidas_producao"
  ON public.batidas_producao FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
