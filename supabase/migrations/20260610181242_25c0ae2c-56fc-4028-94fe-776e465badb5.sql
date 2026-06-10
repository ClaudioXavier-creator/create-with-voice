
-- ============= AUDITOR_TOKENS =============
ALTER TABLE public.auditor_tokens ADD COLUMN IF NOT EXISTS token_hash text;

UPDATE public.auditor_tokens
SET token_hash = encode(extensions.digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

DROP INDEX IF EXISTS public.idx_auditor_tokens_token;
ALTER TABLE public.auditor_tokens DROP CONSTRAINT IF EXISTS auditor_tokens_token_key;
ALTER TABLE public.auditor_tokens ALTER COLUMN token DROP NOT NULL;
ALTER TABLE public.auditor_tokens ALTER COLUMN token DROP DEFAULT;
ALTER TABLE public.auditor_tokens DROP COLUMN token;

ALTER TABLE public.auditor_tokens ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE public.auditor_tokens ADD CONSTRAINT auditor_tokens_token_hash_key UNIQUE (token_hash);
CREATE INDEX IF NOT EXISTS idx_auditor_tokens_token_hash ON public.auditor_tokens (token_hash) WHERE ativo = true;

CREATE OR REPLACE FUNCTION public.criar_auditor_token(
  _empresa_id uuid,
  _nome_auditor text,
  _orgao_fiscalizador text,
  _duracao_horas integer,
  _observacoes text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_token text;
  v_hash text;
  v_id uuid;
  v_expira timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado');
  END IF;

  IF NOT public.tem_papel_empresa(_empresa_id, v_user_id, 'admin'::papel_empresa) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas administradores da empresa podem gerar tokens');
  END IF;

  IF _duracao_horas IS NULL OR _duracao_horas < 1 OR _duracao_horas > 720 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Duração inválida');
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_expira := now() + (_duracao_horas || ' hours')::interval;

  INSERT INTO public.auditor_tokens (
    token_hash, empresa_id, criado_por, nome_auditor, orgao_fiscalizador, observacoes, expira_em
  ) VALUES (
    v_hash, _empresa_id, v_user_id, _nome_auditor, _orgao_fiscalizador, COALESCE(_observacoes, ''), v_expira
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'token', v_token, 'expira_em', v_expira);
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_auditor_token(_token text)
RETURNS TABLE(id uuid, empresa_id uuid, expira_em timestamptz, ativo boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT t.id, t.empresa_id, t.expira_em, t.ativo
  FROM public.auditor_tokens t
  WHERE t.token_hash = encode(extensions.digest(_token, 'sha256'), 'hex')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.criar_auditor_token(uuid, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_auditor_token(text) TO service_role;

-- ============= CONVITES_EMPRESA =============
ALTER TABLE public.convites_empresa ADD COLUMN IF NOT EXISTS token_hash text;

UPDATE public.convites_empresa
SET token_hash = encode(extensions.digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

DROP INDEX IF EXISTS public.idx_convites_empresa_token;
ALTER TABLE public.convites_empresa DROP CONSTRAINT IF EXISTS convites_empresa_token_key;
ALTER TABLE public.convites_empresa ALTER COLUMN token DROP NOT NULL;
ALTER TABLE public.convites_empresa ALTER COLUMN token DROP DEFAULT;
ALTER TABLE public.convites_empresa DROP COLUMN token;

ALTER TABLE public.convites_empresa ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE public.convites_empresa ADD CONSTRAINT convites_empresa_token_hash_key UNIQUE (token_hash);
CREATE INDEX IF NOT EXISTS idx_convites_empresa_token_hash ON public.convites_empresa (token_hash) WHERE aceito_em IS NULL;

CREATE OR REPLACE FUNCTION public.criar_convite_empresa(
  _empresa_id uuid,
  _email text,
  _nome text,
  _papel papel_empresa,
  _duracao_dias integer DEFAULT 7
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_token text;
  v_hash text;
  v_id uuid;
  v_expira timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado');
  END IF;

  IF NOT public.tem_papel_empresa(_empresa_id, v_user_id, 'admin'::papel_empresa) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas administradores podem convidar membros');
  END IF;

  IF _email IS NULL OR position('@' in _email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'E-mail inválido');
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_expira := now() + (COALESCE(_duracao_dias, 7) || ' days')::interval;

  INSERT INTO public.convites_empresa (
    empresa_id, email, nome, papel, token_hash, convidado_por, expira_em
  ) VALUES (
    _empresa_id, lower(_email), _nome, _papel, v_hash, v_user_id, v_expira
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'token', v_token, 'expira_em', v_expira);
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_convite_empresa(uuid, text, text, papel_empresa, integer) TO authenticated;
