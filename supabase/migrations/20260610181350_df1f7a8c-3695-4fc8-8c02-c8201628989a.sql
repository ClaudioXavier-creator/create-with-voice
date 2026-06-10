
REVOKE EXECUTE ON FUNCTION public.criar_auditor_token(uuid, text, text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.criar_convite_empresa(uuid, text, text, papel_empresa, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validar_auditor_token(text) FROM PUBLIC, anon, authenticated;
