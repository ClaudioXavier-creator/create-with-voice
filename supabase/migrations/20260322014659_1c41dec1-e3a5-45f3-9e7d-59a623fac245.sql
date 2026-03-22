
-- POP 02/03: Cronogramas de Higiene e Sanitização (IN 15/2009)
CREATE TABLE public.cronogramas_higiene (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  area text NOT NULL,
  equipamento text DEFAULT '',
  procedimento text NOT NULL,
  produto_utilizado text DEFAULT '',
  concentracao text DEFAULT '',
  frequencia text NOT NULL DEFAULT 'diario',
  responsavel text DEFAULT '',
  horario_previsto text DEFAULT '',
  observacoes text DEFAULT '',
  status text DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cronogramas_higiene ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cronogramas_higiene" ON public.cronogramas_higiene FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Registros de execução de limpeza
CREATE TABLE public.registros_limpeza (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cronograma_id uuid REFERENCES public.cronogramas_higiene(id) ON DELETE CASCADE,
  data_execucao date NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio text DEFAULT '',
  hora_fim text DEFAULT '',
  executor text NOT NULL,
  conforme boolean DEFAULT true,
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.registros_limpeza ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own registros_limpeza" ON public.registros_limpeza FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POP 05: Manutenção Preventiva (IN 04/2007)
CREATE TABLE public.manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  equipamento text NOT NULL,
  codigo_equipamento text DEFAULT '',
  tipo text NOT NULL DEFAULT 'preventiva',
  descricao text NOT NULL,
  responsavel text DEFAULT '',
  data_programada date DEFAULT CURRENT_DATE,
  data_execucao date,
  proxima_manutencao date,
  custo text DEFAULT '',
  pecas_trocadas text DEFAULT '',
  observacoes text DEFAULT '',
  status text DEFAULT 'programada',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own manutencoes" ON public.manutencoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POP 04: Controle de Resíduos e Efluentes (Decreto 12.031/2024)
CREATE TABLE public.controle_residuos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo_residuo text NOT NULL,
  classificacao text DEFAULT 'classe_II',
  origem text DEFAULT '',
  destino_final text DEFAULT '',
  empresa_coletora text DEFAULT '',
  licenca_ambiental text DEFAULT '',
  frequencia_coleta text DEFAULT 'semanal',
  quantidade text DEFAULT '',
  unidade text DEFAULT 'kg',
  data_coleta date DEFAULT CURRENT_DATE,
  responsavel text DEFAULT '',
  manifesto_numero text DEFAULT '',
  observacoes text DEFAULT '',
  status text DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.controle_residuos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own controle_residuos" ON public.controle_residuos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Controle de substâncias proibidas/indesejáveis (IN 15/2009) - adicionado à tabela de recebimento
CREATE TABLE public.controle_substancias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  materia_prima text NOT NULL,
  fornecedor text DEFAULT '',
  lote text DEFAULT '',
  substancia text NOT NULL,
  tipo text NOT NULL DEFAULT 'proibida',
  limite_maximo text DEFAULT '',
  resultado text DEFAULT '',
  unidade text DEFAULT '',
  conforme boolean DEFAULT true,
  metodo_analise text DEFAULT '',
  data_analise date DEFAULT CURRENT_DATE,
  referencia_normativa text DEFAULT 'IN 15/2009',
  observacoes text DEFAULT '',
  status text DEFAULT 'conforme',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.controle_substancias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own controle_substancias" ON public.controle_substancias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Validação de Limpeza de Linha (IN 04/2007 e IN 15/2009)
CREATE TABLE public.validacao_limpeza_linha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  linha_producao text NOT NULL,
  produto_anterior text NOT NULL,
  produto_seguinte text NOT NULL,
  contem_medicamento boolean DEFAULT false,
  tipo_validacao text DEFAULT 'visual',
  resultado text DEFAULT 'aprovado',
  residuo_detectado text DEFAULT '',
  limite_aceitavel text DEFAULT '',
  metodo_analise text DEFAULT '',
  responsavel text DEFAULT '',
  data_validacao date DEFAULT CURRENT_DATE,
  hora_validacao text DEFAULT '',
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.validacao_limpeza_linha ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own validacao_limpeza_linha" ON public.validacao_limpeza_linha FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
