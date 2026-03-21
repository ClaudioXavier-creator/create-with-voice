
CREATE TABLE public.legislacao_alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  fonte TEXT DEFAULT '',
  tipo TEXT DEFAULT 'atualizacao',
  relevancia TEXT DEFAULT 'media',
  data_publicacao DATE DEFAULT CURRENT_DATE,
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.legislacao_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own legislacao_alertas"
  ON public.legislacao_alertas
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
