
-- Tabela principal: cada planilha representa um período (mês/ano) de um POP específico
CREATE TABLE public.pop_planilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pop_codigo TEXT NOT NULL, -- ex: 'POP-01', 'POP-02'
  pop_nome TEXT NOT NULL, -- ex: 'Limpeza e Higienização'
  periodicidade TEXT NOT NULL DEFAULT 'diario', -- diario, semanal, mensal, quinzenal
  mes INTEGER NOT NULL, -- 1-12
  ano INTEGER NOT NULL,
  observacoes TEXT DEFAULT '',
  status TEXT DEFAULT 'em_andamento', -- em_andamento, concluida, verificada
  verificado_por TEXT DEFAULT '',
  data_verificacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pop_codigo, periodicidade, mes, ano)
);

-- Tabela de itens: cada registro individual (dia, semana, etc.)
CREATE TABLE public.pop_planilha_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  planilha_id UUID NOT NULL REFERENCES public.pop_planilhas(id) ON DELETE CASCADE,
  periodo_label TEXT NOT NULL, -- ex: '1' (dia 1), '1a' (semana 1), '1ª Quinzena'
  area TEXT NOT NULL, -- ex: 'Escritório e anexos', 'Área de produção'
  conforme BOOLEAN, -- true=C, false=NC, null=não preenchido
  responsavel TEXT DEFAULT '',
  funcao TEXT DEFAULT '',
  data_registro DATE,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pop_planilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pop_planilha_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pop_planilhas" ON public.pop_planilhas
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own pop_planilha_itens" ON public.pop_planilha_itens
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_pop_planilhas_updated_at
  BEFORE UPDATE ON public.pop_planilhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
