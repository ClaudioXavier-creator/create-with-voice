
CREATE OR REPLACE FUNCTION public._export_auth_users_full()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'phone', u.phone,
      'encrypted_password', u.encrypted_password,
      'email_confirmed_at', u.email_confirmed_at,
      'phone_confirmed_at', u.phone_confirmed_at,
      'confirmed_at', u.confirmed_at,
      'last_sign_in_at', u.last_sign_in_at,
      'raw_app_meta_data', u.raw_app_meta_data,
      'raw_user_meta_data', u.raw_user_meta_data,
      'is_super_admin', u.is_super_admin,
      'created_at', u.created_at,
      'updated_at', u.updated_at,
      'banned_until', u.banned_until,
      'aud', u.aud,
      'role', u.role,
      'identities', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', i.id,
          'user_id', i.user_id,
          'provider', i.provider,
          'provider_id', i.provider_id,
          'identity_data', i.identity_data,
          'created_at', i.created_at,
          'updated_at', i.updated_at,
          'last_sign_in_at', i.last_sign_in_at,
          'email', i.email
        )) FROM auth.identities i WHERE i.user_id = u.id
      ), '[]'::jsonb)
    )
  ) INTO result
  FROM auth.users u;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public._export_auth_users_full() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._export_auth_users_full() TO service_role;

COMMENT ON FUNCTION public._export_auth_users_full() IS
  'TEMPORÁRIA - Migração de usuários. Remover após export com: DROP FUNCTION public._export_auth_users_full();';
