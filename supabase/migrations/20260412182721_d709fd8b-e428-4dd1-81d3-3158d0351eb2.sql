-- Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Users can manage own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role manages all roles" ON public.user_roles;

-- Only SELECT for authenticated users
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Full access only for service_role
CREATE POLICY "Service role manages all roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);