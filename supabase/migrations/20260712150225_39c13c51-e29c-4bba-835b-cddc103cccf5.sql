-- Revoke column-level SELECT on token_hash so RLS policies granting SELECT do not expose it.
REVOKE SELECT (token_hash) ON public.auditor_tokens FROM authenticated, anon;
REVOKE SELECT (token_hash) ON public.convites_empresa FROM authenticated, anon;

-- Re-grant SELECT on all other columns explicitly (authenticated already has table-level SELECT via prior grants;
-- column revoke above is sufficient. service_role keeps full access via GRANT ALL).