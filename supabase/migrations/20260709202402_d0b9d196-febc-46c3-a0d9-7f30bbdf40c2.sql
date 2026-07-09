
-- ============ INDICAÇÕES ============
CREATE TABLE IF NOT EXISTS public.indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicado_email TEXT,
  indicado_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  codigo_referral TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','cadastrado','convertido','expirado')),
  produto TEXT,
  recompensa_valor NUMERIC(10,2) DEFAULT 0,
  recompensa_creditada BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  cadastrou_em TIMESTAMPTZ,
  converteu_em TIMESTAMPTZ,
  observacoes TEXT
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicacoes TO authenticated;
GRANT ALL ON public.indicacoes TO service_role;
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem próprias indicações"
  ON public.indicacoes FOR SELECT TO authenticated
  USING (indicador_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users criam próprias indicações"
  ON public.indicacoes FOR INSERT TO authenticated
  WITH CHECK (indicador_user_id = auth.uid());

CREATE POLICY "Admins editam indicações"
  ON public.indicacoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador ON public.indicacoes(indicador_user_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_codigo ON public.indicacoes(codigo_referral);
CREATE INDEX IF NOT EXISTS idx_indicacoes_status ON public.indicacoes(status);

-- Função pública para verificar se um código de referral existe (usado no cadastro)
CREATE OR REPLACE FUNCTION public.validar_codigo_referral(_codigo TEXT)
RETURNS TABLE(indicacao_id UUID, indicador_user_id UUID, valido BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, indicador_user_id, (status IN ('pendente','cadastrado'))
  FROM public.indicacoes
  WHERE codigo_referral = _codigo
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validar_codigo_referral(TEXT) TO anon, authenticated;

-- Trigger: quando um novo usuário se cadastra com codigo_referral em raw_user_meta_data, marca indicação
CREATE OR REPLACE FUNCTION public.processar_referral_novo_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_codigo TEXT;
BEGIN
  v_codigo := NEW.raw_user_meta_data->>'codigo_referral';
  IF v_codigo IS NOT NULL AND v_codigo <> '' THEN
    UPDATE public.indicacoes
    SET indicado_user_id = NEW.id,
        indicado_email = NEW.email,
        status = 'cadastrado',
        cadastrou_em = now()
    WHERE codigo_referral = v_codigo
      AND status = 'pendente';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'processar_referral_novo_user falhou: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_processar_referral ON auth.users;
CREATE TRIGGER trg_processar_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.processar_referral_novo_user();

-- ============ ONBOARDING PROGRESSO ============
CREATE TABLE IF NOT EXISTS public.onboarding_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto TEXT NOT NULL,
  passos_concluidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  tour_completo BOOLEAN DEFAULT false,
  checklist_completo BOOLEAN DEFAULT false,
  primeiro_acesso_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, produto)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_progresso TO authenticated;
GRANT ALL ON public.onboarding_progresso TO service_role;
ALTER TABLE public.onboarding_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users gerenciam próprio onboarding"
  ON public.onboarding_progresso FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins veem todo onboarding"
  ON public.onboarding_progresso FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_onboarding_updated
  BEFORE UPDATE ON public.onboarding_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
