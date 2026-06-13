CREATE OR REPLACE FUNCTION public.handle_new_empresa_membro_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.empresa_membros (empresa_id, user_id, papel, nome, ativo)
  VALUES (NEW.id, NEW.user_id, 'admin', NULL, true)
  ON CONFLICT (empresa_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_empresa_created_membro_admin ON public.empresas;
CREATE TRIGGER on_empresa_created_membro_admin
  AFTER INSERT ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_empresa_membro_admin();

INSERT INTO public.empresa_membros (empresa_id, user_id, papel, ativo)
SELECT e.id, e.user_id, 'admin', true
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.empresa_membros m
  WHERE m.empresa_id = e.id AND m.user_id = e.user_id
)
ON CONFLICT (empresa_id, user_id) DO NOTHING;

DROP POLICY IF EXISTS "service_role can update suppressed_emails" ON public.suppressed_emails;
CREATE POLICY "service_role can update suppressed_emails"
  ON public.suppressed_emails FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role can delete suppressed_emails" ON public.suppressed_emails;
CREATE POLICY "service_role can delete suppressed_emails"
  ON public.suppressed_emails FOR DELETE
  TO service_role
  USING (true);