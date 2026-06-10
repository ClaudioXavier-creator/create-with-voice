-- Função para invocar a edge function de notificação (corrigida)
CREATE OR REPLACE FUNCTION public.notify_error_via_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT := 'https://uyrcxfypdzasdminxizq.supabase.co';
  -- A chave de serviço ou anon key para invocar a function. Usando service role key via vault seria melhor, mas aqui usaremos a anon key por simplicidade de trigger.
  -- No contexto do Lovable/Supabase, a anon key é pública e suficiente para invocar functions se não houver restrição rígida.
  supabase_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cmN4ZnlwZHphc2RtaW54aXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTYxODcsImV4cCI6MjA4OTY5MjE4N30.bFdhKPlriMLyTX4jd9sgwm52taBFEHFx8zBeoerjHbQ';
BEGIN
  -- Filtramos apenas erros críticos
  IF NEW.error_type IN ('boundary', 'chunk_error', 'boot_failsafe') THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/notify-error-whatsapp',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || supabase_key
        ),
        body := jsonb_build_object(
          'id', NEW.id,
          'type', NEW.error_type,
          'message', NEW.message,
          'route', NEW.route,
          'version', NEW.app_version
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
