
CREATE TABLE public.planejamento_anual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'analise',
  atividade TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  frequencia TEXT NOT NULL DEFAULT 'mensal',
  quantidade_prevista INTEGER DEFAULT 1,
  mes_inicio INTEGER DEFAULT 1,
  proxima_execucao DATE,
  ultima_execucao DATE,
  responsavel TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planejamento_anual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own planejamento_anual"
  ON public.planejamento_anual
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
