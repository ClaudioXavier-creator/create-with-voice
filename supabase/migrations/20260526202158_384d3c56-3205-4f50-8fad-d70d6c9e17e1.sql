-- Update the audit log trigger function to handle null user_id
CREATE OR REPLACE FUNCTION public.process_audit_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the current user ID, but handle cases where it might be null (e.g., during signup)
    current_user_id := auth.uid();
    
    -- If it's still null and we're in an INSERT, we might be in a system process or signup
    -- We allow it to be null if it's a known system table or we can just make the column nullable
    -- However, the error was "null value in column user_id violates not-null constraint"
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_log (tabela, registro_id, acao, user_id, dados_anteriores)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, current_user_id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_log (tabela, registro_id, acao, user_id, dados_anteriores, dados_novos)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, current_user_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_log (tabela, registro_id, acao, user_id, dados_novos)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, current_user_id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$function$;

-- Make user_id nullable in audit_log to prevent signup failures when no session exists
ALTER TABLE public.audit_log ALTER COLUMN user_id DROP NOT NULL;
