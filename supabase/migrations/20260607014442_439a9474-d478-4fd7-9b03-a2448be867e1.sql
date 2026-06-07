
CREATE TABLE public.app_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  message TEXT,
  stack TEXT,
  component_stack TEXT,
  route TEXT,
  user_agent TEXT,
  app_version TEXT,
  boot_elapsed_ms INTEGER,
  extra JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.app_error_logs TO anon, authenticated;
GRANT SELECT ON public.app_error_logs TO authenticated;
GRANT ALL ON public.app_error_logs TO service_role;

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON public.app_error_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all error logs"
  ON public.app_error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_app_error_logs_created ON public.app_error_logs(created_at DESC);
CREATE INDEX idx_app_error_logs_type ON public.app_error_logs(error_type);
