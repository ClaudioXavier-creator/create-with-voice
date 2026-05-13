-- Revoke public execute from all functions in public schema (standard security practice)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Re-grant execute to authenticated and service_role for general functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specifically secure sensitive functions (only service_role or authenticated should call)
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM authenticated;

-- Ensure triggers can still run (they run as security definer)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_license() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_empresa_license() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_lead_to_pipeline() TO service_role;
