-- ============================================================================
-- FASE 1: Multi-usuário por empresa (Admin / RT / Operador)
-- ============================================================================

-- 1. Enum de papéis
CREATE TYPE public.papel_empresa AS ENUM ('admin', 'rt', 'operador');

-- 2. Tabela de membros (vínculo user ↔ empresa ↔ papel)
CREATE TABLE public.empresa_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  papel public.papel_empresa NOT NULL DEFAULT 'operador',
  nome TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  convidado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, user_id)
);

CREATE INDEX idx_empresa_membros_user ON public.empresa_membros(user_id) WHERE ativo = true;
CREATE INDEX idx_empresa_membros_empresa ON public.empresa_membros(empresa_id) WHERE ativo = true;

ALTER TABLE public.empresa_membros ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de convites pendentes
CREATE TABLE public.convites_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  papel public.papel_empresa NOT NULL DEFAULT 'operador',
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  convidado_por UUID NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  aceito_em TIMESTAMPTZ,
  aceito_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_convites_empresa_token ON public.convites_empresa(token) WHERE aceito_em IS NULL;
CREATE INDEX idx_convites_empresa_email ON public.convites_empresa(lower(email)) WHERE aceito_em IS NULL;

ALTER TABLE public.convites_empresa ENABLE ROW LEVEL SECURITY;

-- 4. Funções SECURITY DEFINER (evitam recursão RLS)

CREATE OR REPLACE FUNCTION public.is_membro_empresa(_empresa_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_membros
    WHERE empresa_id = _empresa_id
      AND user_id = _user_id
      AND ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_papel_empresa(_empresa_id UUID, _user_id UUID)
RETURNS public.papel_empresa
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT papel FROM public.empresa_membros
  WHERE empresa_id = _empresa_id
    AND user_id = _user_id
    AND ativo = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tem_papel_empresa(_empresa_id UUID, _user_id UUID, _papel public.papel_empresa)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_membros
    WHERE empresa_id = _empresa_id
      AND user_id = _user_id
      AND papel = _papel
      AND ativo = true
  );
$$;

-- Limite de membros por plano (a partir da licença ativa da empresa)
CREATE OR REPLACE FUNCTION public.get_limite_membros_empresa(_empresa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano TEXT;
BEGIN
  SELECT plano INTO v_plano
  FROM public.licencas
  WHERE empresa_id = _empresa_id
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY 
    CASE 
      WHEN plano ILIKE '%avancado%' OR plano ILIKE '%avançado%' THEN 1
      WHEN plano ILIKE '%intermediario%' OR plano ILIKE '%intermediário%' THEN 2
      WHEN plano = 'trial' THEN 3
      WHEN plano ILIKE '%entrada%' THEN 4
      ELSE 5
    END
  LIMIT 1;

  IF v_plano IS NULL THEN
    RETURN 5; -- sem licença ativa: limite mínimo
  END IF;

  v_plano := lower(v_plano);
  IF v_plano LIKE '%avancado%' OR v_plano LIKE '%avançado%' THEN
    RETURN 20;
  ELSIF v_plano LIKE '%intermediario%' OR v_plano LIKE '%intermediário%' OR v_plano = 'trial' THEN
    RETURN 10;
  ELSE
    RETURN 5;
  END IF;
END;
$$;

-- 5. Trigger de validação de limite ao adicionar membro
CREATE OR REPLACE FUNCTION public.validar_limite_membros()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_limite INTEGER;
BEGIN
  IF NEW.ativo = false THEN
    RETURN NEW;
  END IF;

  -- Conta membros ativos atuais da empresa (excluindo o próprio em caso de UPDATE)
  SELECT COUNT(*) INTO v_count
  FROM public.empresa_membros
  WHERE empresa_id = NEW.empresa_id
    AND ativo = true
    AND id <> COALESCE(NEW.id, gen_random_uuid());

  v_limite := public.get_limite_membros_empresa(NEW.empresa_id);

  IF v_count >= v_limite THEN
    RAISE EXCEPTION 'Limite de % membros atingido para o plano atual desta empresa. Faça upgrade para adicionar mais.', v_limite
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_limite_membros
BEFORE INSERT OR UPDATE OF ativo ON public.empresa_membros
FOR EACH ROW
EXECUTE FUNCTION public.validar_limite_membros();

-- 6. Trigger de updated_at
CREATE TRIGGER trg_empresa_membros_updated_at
BEFORE UPDATE ON public.empresa_membros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RLS — empresa_membros
CREATE POLICY "Membros visualizam colegas da mesma empresa"
ON public.empresa_membros
FOR SELECT
TO authenticated
USING (public.is_membro_empresa(empresa_id, auth.uid()));

CREATE POLICY "Admin gerencia membros da empresa"
ON public.empresa_membros
FOR ALL
TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'))
WITH CHECK (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'));

-- 8. RLS — convites_empresa
-- Admin gerencia convites da própria empresa
CREATE POLICY "Admin gerencia convites da empresa"
ON public.convites_empresa
FOR ALL
TO authenticated
USING (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'))
WITH CHECK (public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'));

-- Qualquer usuário autenticado pode consultar UM convite pelo token (necessário p/ aceitar)
-- A verificação do token acontece na edge function aceitar-convite.
CREATE POLICY "Service role gerencia convites"
ON public.convites_empresa
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. MIGRAÇÃO: donos atuais viram admin da própria empresa
INSERT INTO public.empresa_membros (empresa_id, user_id, papel, nome, ativo)
SELECT 
  e.id,
  e.user_id,
  'admin'::public.papel_empresa,
  COALESCE(p.nome, 'Administrador'),
  true
FROM public.empresas e
LEFT JOIN public.profiles p ON p.user_id = e.user_id
ON CONFLICT (empresa_id, user_id) DO NOTHING;