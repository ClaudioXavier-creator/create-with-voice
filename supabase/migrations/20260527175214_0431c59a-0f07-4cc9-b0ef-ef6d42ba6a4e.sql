-- Set search_path for all functions, handling arguments correctly (stripping defaults)
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN 
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name, 
            p.proname as function_name, 
            oidvectortypes(p.proargtypes) as arg_types
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public'
    LOOP 
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
                           func_record.schema_name, func_record.function_name, func_record.arg_types);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function %.%: %', func_record.schema_name, func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Revoke EXECUTE on all functions from PUBLIC by default for better security
-- This is a common best practice: revoke from public, then grant back to authenticated/anon as needed.
-- But since we don't want to break existing logic, we'll focus on auditability.

-- Ensure audit logging is active for critical tables
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Try to get empresa_id from the record
    BEGIN
        v_empresa_id := COALESCE(NEW.empresa_id, OLD.empresa_id);
    EXCEPTION WHEN OTHERS THEN
        v_empresa_id := NULL;
    END;

    -- If no empresa_id in record, try to find from session/members
    IF v_empresa_id IS NULL AND v_user_id IS NOT NULL THEN
        SELECT empresa_id INTO v_empresa_id FROM public.empresa_membros WHERE user_id = v_user_id LIMIT 1;
    END IF;

    INSERT INTO public.audit_log (
        acao,
        tabela,
        registro_id,
        dados_anteriores,
        dados_novos,
        user_id,
        empresa_id
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        v_user_id,
        v_empresa_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit trigger to key tables
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN SELECT table_name 
                 FROM information_schema.tables 
                 WHERE table_schema = 'public' 
                 AND table_name IN ('nao_conformidades', 'produtos', 'fornecedores', 'formulas', 'licencas', 'empresas', 'recebimento_mp', 'producao', 'rastreabilidade')
    LOOP
        -- Drop if exists to avoid errors on retry
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_audit_' || t_name, t_name);
        EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', 
                       'trg_audit_' || t_name, t_name);
    END LOOP;
END $$;
