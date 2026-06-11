
DROP POLICY IF EXISTS "Membros da empresa veem mensagens" ON public.whatsapp_mensagens;
CREATE POLICY "Membros da empresa veem mensagens"
ON public.whatsapp_mensagens
FOR SELECT
USING (
  empresa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = whatsapp_mensagens.empresa_id
      AND em.user_id = auth.uid()
      AND em.ativo = true
  )
);

CREATE OR REPLACE FUNCTION public.pode_usar_empresa(_empresa_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result boolean;
BEGIN
  IF _empresa_id IS NULL OR _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = _empresa_id
      AND em.user_id = _user_id
      AND em.ativo = true
  ) OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = _empresa_id
      AND e.user_id = _user_id
  ) INTO v_result;

  RETURN COALESCE(v_result, false);
END;
$function$;

REVOKE SELECT (token_hash) ON public.auditor_tokens FROM authenticated, anon;
REVOKE SELECT (token_hash) ON public.convites_empresa FROM authenticated, anon;

GRANT SELECT (
  id, empresa_id, criado_por, nome_auditor, orgao_fiscalizador,
  observacoes, expira_em, ativo, revogado_em, total_acessos,
  ultimo_acesso_em, created_at, updated_at
) ON public.auditor_tokens TO authenticated;

GRANT SELECT (
  id, empresa_id, email, nome, papel, convidado_por,
  expira_em, aceito_em, aceito_por, created_at
) ON public.convites_empresa TO authenticated;
