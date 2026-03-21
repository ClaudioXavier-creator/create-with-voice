
-- Tabela de relatórios (digitais e digitalizados)
CREATE TABLE public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('digital', 'digitalizado')),
  modulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  arquivo_url TEXT DEFAULT '',
  arquivo_nome TEXT DEFAULT '',
  data_geracao DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own relatorios" ON public.relatorios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON public.relatorios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de execução de ITs e POPs
CREATE TABLE public.execucao_pops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  documento_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  codigo_pop TEXT NOT NULL,
  nome_pop TEXT NOT NULL,
  data_execucao DATE NOT NULL DEFAULT CURRENT_DATE,
  executor TEXT NOT NULL,
  setor TEXT DEFAULT '',
  status TEXT DEFAULT 'concluido' CHECK (status IN ('pendente', 'em_execucao', 'concluido', 'nao_conforme')),
  observacoes TEXT DEFAULT '',
  checklist_auditoria_ref TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.execucao_pops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own execucao_pops" ON public.execucao_pops FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket para uploads de relatórios digitalizados
INSERT INTO storage.buckets (id, name, public) VALUES ('relatorios', 'relatorios', false);
CREATE POLICY "Users can upload relatorios" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'relatorios' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own relatorios" ON storage.objects FOR SELECT USING (bucket_id = 'relatorios' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own relatorios" ON storage.objects FOR DELETE USING (bucket_id = 'relatorios' AND auth.uid()::text = (storage.foldername(name))[1]);
