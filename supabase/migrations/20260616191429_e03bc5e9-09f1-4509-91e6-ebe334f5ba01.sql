
-- 1) ALTERAÇÕES EM TABELAS EXISTENTES
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS numero_sipeagro TEXT,
  ADD COLUMN IF NOT EXISTS validade_registro_sipeagro DATE,
  ADD COLUMN IF NOT EXISTS atividades_sipeagro TEXT[],
  ADD COLUMN IF NOT EXISTS autorizacao_medicamentos TEXT,
  ADD COLUMN IF NOT EXISTS validade_autorizacao_medicamentos DATE;

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS especie_destino TEXT,
  ADD COLUMN IF NOT EXISTS linha_compartilhada BOOLEAN DEFAULT false;

ALTER TABLE public.recebimento_mp
  ADD COLUMN IF NOT EXISTS armazenamento_inadequado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacao_armazenamento TEXT;

ALTER TABLE public.tf_autocontroles_sessoes
  ADD COLUMN IF NOT EXISTS plano_acao_anterior_url TEXT,
  ADD COLUMN IF NOT EXISTS cumprimento_plano_anterior JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.validacao_limpeza_linha
  ADD COLUMN IF NOT EXISTS formula_id UUID,
  ADD COLUMN IF NOT EXISTS ordem_producao_id UUID;

-- 2) NOVAS TABELAS

-- 2.1 Amostras de Retenção (Rastreabilidade)
CREATE TABLE IF NOT EXISTS public.amostras_retencao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_coleta DATE NOT NULL DEFAULT CURRENT_DATE,
  produto TEXT NOT NULL,
  lote TEXT NOT NULL,
  quantidade_g NUMERIC,
  local_armazenamento TEXT,
  responsavel_coleta TEXT,
  prazo_descarte DATE,
  data_descarte DATE,
  status TEXT NOT NULL DEFAULT 'armazenada',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amostras_retencao TO authenticated;
GRANT ALL ON public.amostras_retencao TO service_role;
ALTER TABLE public.amostras_retencao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amostras_ret_select" ON public.amostras_retencao FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "amostras_ret_insert" ON public.amostras_retencao FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amostras_ret_update" ON public.amostras_retencao FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "amostras_ret_delete" ON public.amostras_retencao FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_amostras_ret_upd BEFORE UPDATE ON public.amostras_retencao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.2 Receituários de Medicamentos (Controle de Substâncias)
CREATE TABLE IF NOT EXISTS public.receituarios_medicamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_receita TEXT,
  medico_veterinario TEXT NOT NULL,
  crmv TEXT NOT NULL,
  uf_crmv TEXT,
  produto TEXT NOT NULL,
  lote_op TEXT,
  principio_ativo TEXT,
  dosagem TEXT,
  especie_destino TEXT,
  validade_receita DATE,
  arquivo_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receituarios_medicamentos TO authenticated;
GRANT ALL ON public.receituarios_medicamentos TO service_role;
ALTER TABLE public.receituarios_medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rec_med_select" ON public.receituarios_medicamentos FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "rec_med_insert" ON public.receituarios_medicamentos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rec_med_update" ON public.receituarios_medicamentos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "rec_med_delete" ON public.receituarios_medicamentos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_rec_med_upd BEFORE UPDATE ON public.receituarios_medicamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.3 Mapa de Iscas/Armadilhas (Pragas)
CREATE TABLE IF NOT EXISTS public.mapa_iscas_armadilhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  setor TEXT,
  coordenadas TEXT,
  produto_quimico_id UUID,
  periodicidade_dias INTEGER DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapa_iscas_armadilhas TO authenticated;
GRANT ALL ON public.mapa_iscas_armadilhas TO service_role;
ALTER TABLE public.mapa_iscas_armadilhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iscas_select" ON public.mapa_iscas_armadilhas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "iscas_insert" ON public.mapa_iscas_armadilhas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "iscas_update" ON public.mapa_iscas_armadilhas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "iscas_delete" ON public.mapa_iscas_armadilhas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_iscas_upd BEFORE UPDATE ON public.mapa_iscas_armadilhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.4 Inspeções dos Pontos (Pragas)
CREATE TABLE IF NOT EXISTS public.inspecoes_iscas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ponto_id UUID NOT NULL REFERENCES public.mapa_iscas_armadilhas(id) ON DELETE CASCADE,
  data_inspecao DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ok',
  presenca_pragas BOOLEAN DEFAULT false,
  acao_tomada TEXT,
  foto_url TEXT,
  responsavel TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspecoes_iscas TO authenticated;
GRANT ALL ON public.inspecoes_iscas TO service_role;
ALTER TABLE public.inspecoes_iscas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insp_iscas_select" ON public.inspecoes_iscas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "insp_iscas_insert" ON public.inspecoes_iscas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insp_iscas_update" ON public.inspecoes_iscas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "insp_iscas_delete" ON public.inspecoes_iscas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_insp_iscas_upd BEFORE UPDATE ON public.inspecoes_iscas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.5 Cadastro de Produtos Químicos (FISPQ, registro MAPA/ANVISA)
CREATE TABLE IF NOT EXISTS public.produtos_quimicos_cadastro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_comercial TEXT NOT NULL,
  principio_ativo TEXT,
  fabricante TEXT,
  registro_mapa TEXT,
  registro_anvisa TEXT,
  validade_registro DATE,
  categoria TEXT,
  fispq_url TEXT,
  local_armazenamento TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos_quimicos_cadastro TO authenticated;
GRANT ALL ON public.produtos_quimicos_cadastro TO service_role;
ALTER TABLE public.produtos_quimicos_cadastro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pq_select" ON public.produtos_quimicos_cadastro FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "pq_insert" ON public.produtos_quimicos_cadastro FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pq_update" ON public.produtos_quimicos_cadastro FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "pq_delete" ON public.produtos_quimicos_cadastro FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_pq_upd BEFORE UPDATE ON public.produtos_quimicos_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.6 Tempos de Mistura Validados (PCP)
CREATE TABLE IF NOT EXISTS public.tempos_mistura_validados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  formula_id UUID,
  nome_formula TEXT NOT NULL,
  tempo_mistura_seg INTEGER NOT NULL,
  cv_homogeneidade NUMERIC,
  data_validacao DATE NOT NULL DEFAULT CURRENT_DATE,
  proxima_validacao DATE,
  metodo TEXT,
  laudo_url TEXT,
  responsavel TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tempos_mistura_validados TO authenticated;
GRANT ALL ON public.tempos_mistura_validados TO service_role;
ALTER TABLE public.tempos_mistura_validados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tmv_select" ON public.tempos_mistura_validados FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "tmv_insert" ON public.tempos_mistura_validados FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tmv_update" ON public.tempos_mistura_validados FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "tmv_delete" ON public.tempos_mistura_validados FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER trg_tmv_upd BEFORE UPDATE ON public.tempos_mistura_validados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
