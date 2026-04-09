
-- 1. Add compliance fields to recebimento_mp
ALTER TABLE public.recebimento_mp
  ADD COLUMN IF NOT EXISTS registro_mapa_produto text DEFAULT '',
  ADD COLUMN IF NOT EXISTS registro_mapa_isento boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS temperatura_veiculo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS integridade_carga boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS integridade_observacoes text DEFAULT '';

-- 2. Add flush fields to producao
ALTER TABLE public.producao
  ADD COLUMN IF NOT EXISTS flush_tipo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flush_volume text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flush_produto_anterior text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flush_realizado boolean DEFAULT false;

-- 3. Create documento_versoes table for POP revision history
CREATE TABLE public.documento_versoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id),
  documento_id uuid REFERENCES public.documentos(id) ON DELETE CASCADE NOT NULL,
  versao_anterior text DEFAULT '',
  versao_nova text NOT NULL,
  data_revisao date DEFAULT CURRENT_DATE,
  responsavel text DEFAULT '',
  motivo text DEFAULT '',
  alteracoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documento_versoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documento_versoes"
  ON public.documento_versoes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Create audit_log table
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id),
  tabela text NOT NULL,
  registro_id uuid,
  acao text NOT NULL DEFAULT 'criar',
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip_address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audit_log"
  ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own audit_log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_log_tabela ON public.audit_log(tabela);
CREATE INDEX idx_audit_log_registro ON public.audit_log(registro_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_documento_versoes_doc ON public.documento_versoes(documento_id);
