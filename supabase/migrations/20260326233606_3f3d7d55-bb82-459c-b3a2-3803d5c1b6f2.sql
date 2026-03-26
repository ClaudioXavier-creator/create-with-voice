
-- Table for ASO and health exams (POP-03 / Saúde dos Manipuladores)
CREATE TABLE public.saude_manipuladores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funcionario TEXT NOT NULL,
  tipo_exame TEXT NOT NULL DEFAULT 'periodico',
  data_exame DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  medico TEXT DEFAULT '',
  crm TEXT DEFAULT '',
  apto BOOLEAN DEFAULT true,
  restricoes TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  status TEXT DEFAULT 'valido',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saude_manipuladores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saude_manipuladores" ON public.saude_manipuladores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table for visitor control (Auditoria / IN 15/2009)
CREATE TABLE public.controle_visitantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_visita DATE NOT NULL DEFAULT CURRENT_DATE,
  nome_visitante TEXT NOT NULL,
  empresa TEXT DEFAULT '',
  documento TEXT DEFAULT '',
  motivo TEXT DEFAULT '',
  areas_visitadas TEXT DEFAULT '',
  hora_entrada TEXT DEFAULT '',
  hora_saida TEXT DEFAULT '',
  acompanhante TEXT DEFAULT '',
  epi_fornecido BOOLEAN DEFAULT false,
  orientacao_biosseguridade BOOLEAN DEFAULT false,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.controle_visitantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own controle_visitantes" ON public.controle_visitantes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
