
-- 1. Fix search_path on email queue functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 2. Revoke public execute on all SECURITY DEFINER functions, then grant only to needed roles

-- Internal trigger functions: no client execute
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_license() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_empresa_license() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validar_limite_membros() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_lead_to_pipeline() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Email queue: service_role only
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- RLS helper functions: revoke from anon, allow authenticated (used inside policies but harmless to expose to logged-in users)
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.tem_papel_empresa(uuid, uuid, papel_empresa) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tem_papel_empresa(uuid, uuid, papel_empresa) TO authenticated;

REVOKE ALL ON FUNCTION public.is_membro_empresa(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_membro_empresa(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_papel_empresa(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_papel_empresa(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.can_access_crm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_crm(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_licenca_consultor_ativa(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_licenca_consultor_ativa(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_limite_membros_empresa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_limite_membros_empresa(uuid) TO authenticated;

-- Client-callable RPCs: authenticated only
REVOKE ALL ON FUNCTION public.aprovar_documento_pop(uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprovar_documento_pop(uuid, text, text, text, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.criar_nova_versao_pop(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_nova_versao_pop(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.vincular_empresa_licenca_consultor(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vincular_empresa_licenca_consultor(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.desvincular_empresa_licenca_consultor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.desvincular_empresa_licenca_consultor(uuid) TO authenticated;
