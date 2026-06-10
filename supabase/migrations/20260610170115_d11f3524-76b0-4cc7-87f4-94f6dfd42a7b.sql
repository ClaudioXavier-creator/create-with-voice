-- Mantemos a função mas removemos o gatilho automático por enquanto para evitar erros de banco até que pg_net esteja 100% estável no ambiente
DROP TRIGGER IF EXISTS on_app_error_insert ON public.app_error_logs;
