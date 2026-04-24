-- Tabela de tokens temporários para acesso do auditor
CREATE TABLE public.auditor_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  criado_por uuid NOT NULL,
  nome_auditor text,
  orgao_fiscalizador text,
  observacoes text DEFAULT '',
  expira_em timestamptz NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  revogado_em timestamptz,
  total_acessos integer NOT NULL DEFAULT 0,
  ultimo_acesso_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditor_tokens_empresa ON public.auditor_tokens(empresa_id);
CREATE INDEX idx_auditor_tokens_token ON public.auditor_tokens(token) WHERE ativo = true;

ALTER TABLE public.auditor_tokens ENABLE ROW LEVEL SECURITY;

-- Admin da empresa gerencia tokens
CREATE POLICY "Admin gerencia auditor_tokens"
ON public.auditor_tokens
FOR ALL
TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa))
WITH CHECK (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

-- Service role (edge function) pode validar e atualizar contadores
CREATE POLICY "Service role gerencia auditor_tokens"
ON public.auditor_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TRIGGER set_auditor_tokens_updated_at
BEFORE UPDATE ON public.auditor_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de trilha de auditoria
CREATE TABLE public.auditor_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.auditor_tokens(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  modulo text NOT NULL,
  recurso_id text,
  ip_address text,
  user_agent text,
  acessado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditor_acessos_token ON public.auditor_acessos(token_id);
CREATE INDEX idx_auditor_acessos_empresa ON public.auditor_acessos(empresa_id);

ALTER TABLE public.auditor_acessos ENABLE ROW LEVEL SECURITY;

-- Admin da empresa visualiza trilha
CREATE POLICY "Admin visualiza auditor_acessos"
ON public.auditor_acessos
FOR SELECT
TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa));

-- Service role insere registros de acesso
CREATE POLICY "Service role insere auditor_acessos"
ON public.auditor_acessos
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role consulta auditor_acessos"
ON public.auditor_acessos
FOR SELECT
TO service_role
USING (true);