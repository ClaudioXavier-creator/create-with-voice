
CREATE TABLE public.reclamacoes_qualidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Identificação
  numero_reclamacao TEXT NOT NULL,
  data_reclamacao DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente TEXT NOT NULL,
  contato_cliente TEXT,
  
  -- Produto reclamado
  produto TEXT NOT NULL,
  lote TEXT,
  nota_fiscal TEXT,
  data_compra DATE,
  quantidade_reclamada TEXT,
  
  -- Descrição da reclamação
  tipo_reclamacao TEXT NOT NULL DEFAULT 'qualidade_produto',
  descricao_problema TEXT NOT NULL,
  evidencias TEXT,
  
  -- Análise técnica
  causa_raiz TEXT,
  analise_tecnica TEXT,
  responsavel_analise TEXT,
  data_analise DATE,
  
  -- Plano de ação / resolução
  acao_imediata TEXT,
  acao_corretiva TEXT,
  acao_preventiva TEXT,
  prazo_resolucao DATE,
  responsavel_resolucao TEXT,
  
  -- Recolhimento (recall)
  requer_recolhimento BOOLEAN DEFAULT false,
  motivo_recolhimento TEXT,
  lotes_afetados TEXT,
  quantidade_recolhida TEXT,
  data_inicio_recolhimento DATE,
  data_fim_recolhimento DATE,
  destino_produto_recolhido TEXT,
  status_recolhimento TEXT,
  
  -- Conclusão
  conclusao TEXT,
  cliente_notificado BOOLEAN DEFAULT false,
  data_resposta_cliente DATE,
  satisfacao_cliente TEXT,
  
  -- Status geral
  status TEXT NOT NULL DEFAULT 'aberta',
  pop_referencia TEXT DEFAULT 'POP-009',
  
  observacoes TEXT
);

ALTER TABLE public.reclamacoes_qualidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reclamacoes" ON public.reclamacoes_qualidade
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reclamacoes" ON public.reclamacoes_qualidade
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reclamacoes" ON public.reclamacoes_qualidade
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reclamacoes" ON public.reclamacoes_qualidade
  FOR DELETE TO authenticated USING (user_id = auth.uid());
