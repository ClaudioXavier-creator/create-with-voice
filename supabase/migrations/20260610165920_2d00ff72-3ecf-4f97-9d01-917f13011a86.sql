-- Função para invocar a edge function de notificação
CREATE OR REPLACE FUNCTION public.notify_error_via_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Filtramos apenas erros críticos para não sobrecarregar o WhatsApp
  IF NEW.error_type IN ('boundary', 'chunk_error', 'boot_failsafe') THEN
    PERFORM
      net.http_post(
        url := (SELECT value FROM (SELECT COALESCE(setting, '') as value FROM pg_settings WHERE name = 'request.header.x-supabase-url') s) || '/functions/v1/notify-error-whatsapp',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM (SELECT COALESCE(setting, '') as value FROM pg_settings WHERE name = 'request.header.apikey') s)
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

-- Gatilho para disparar após a inserção de um log de erro
DROP TRIGGER IF EXISTS on_app_error_insert ON public.app_error_logs;
CREATE TRIGGER on_app_error_insert
  AFTER INSERT ON public.app_error_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_error_via_whatsapp();
