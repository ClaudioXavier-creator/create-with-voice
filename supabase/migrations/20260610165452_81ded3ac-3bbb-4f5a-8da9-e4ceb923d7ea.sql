DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_error_logs' AND column_name = 'status') THEN
        ALTER TABLE public.app_error_logs ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'ignored'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_error_logs' AND column_name = 'resolution_notes') THEN
        ALTER TABLE public.app_error_logs ADD COLUMN resolution_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_error_logs' AND column_name = 'resolved_at') THEN
        ALTER TABLE public.app_error_logs ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_error_logs' AND column_name = 'fixed_in_version') THEN
        ALTER TABLE public.app_error_logs ADD COLUMN fixed_in_version TEXT;
    END IF;
END $$;

GRANT ALL ON public.app_error_logs TO service_role;
GRANT ALL ON public.app_error_logs TO authenticated;
