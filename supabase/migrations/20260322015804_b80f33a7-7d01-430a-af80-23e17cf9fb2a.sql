
-- Sensitivity matrix cells (row product vs column product → SIM/NÃO)
CREATE TABLE public.matriz_sensibilidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  produto_anterior text NOT NULL,
  produto_seguinte text NOT NULL,
  requer_flushing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, produto_anterior, produto_seguinte)
);

ALTER TABLE public.matriz_sensibilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own matriz_sensibilidade" ON public.matriz_sensibilidade
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Risk matrix rows
CREATE TABLE public.matriz_risco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  etapa_processo text NOT NULL,
  perigo_identificado text NOT NULL,
  tipo_perigo text NOT NULL DEFAULT 'Químico',
  probabilidade text NOT NULL DEFAULT 'Média',
  severidade text NOT NULL DEFAULT 'Média',
  nivel_risco text NOT NULL DEFAULT 'Médio',
  medidas_controle text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.matriz_risco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own matriz_risco" ON public.matriz_risco
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
