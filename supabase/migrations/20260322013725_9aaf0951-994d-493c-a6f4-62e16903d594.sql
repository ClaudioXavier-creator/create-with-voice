
-- Lab analyses table
CREATE TABLE public.analises_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo_analise text NOT NULL DEFAULT 'fisico_quimica',
  produto text NOT NULL,
  lote text DEFAULT '',
  data_analise date DEFAULT CURRENT_DATE,
  data_resultado date,
  laboratorio text DEFAULT '',
  metodo text DEFAULT '',
  parametro text DEFAULT '',
  resultado text DEFAULT '',
  unidade text DEFAULT '',
  limite_referencia text DEFAULT '',
  conforme boolean,
  laudo_numero text DEFAULT '',
  laudo_url text DEFAULT '',
  observacoes text DEFAULT '',
  status text DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analises_laboratorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own analises" ON public.analises_laboratorio
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Traceability test results table
CREATE TABLE public.testes_rastreabilidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lote_testado text NOT NULL,
  produto text NOT NULL,
  direcao text NOT NULL DEFAULT 'completo',
  data_teste timestamptz DEFAULT now(),
  tempo_segundos integer DEFAULT 0,
  montante_encontrado boolean DEFAULT false,
  jusante_encontrado boolean DEFAULT false,
  materias_primas_rastreadas integer DEFAULT 0,
  destinos_rastreados integer DEFAULT 0,
  resultado text DEFAULT 'pendente',
  observacoes text DEFAULT '',
  detalhes_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testes_rastreabilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own testes_rastreabilidade" ON public.testes_rastreabilidade
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
