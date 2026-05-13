-- 1. Otimização de Performance: Índices para RLS e Queries Frequentes
-- Criando índices para todas as colunas de user_id e empresa_id que ainda não possuem
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT t.table_name, c.column_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.column_name IN ('empresa_id', 'user_id')
        AND NOT EXISTS (
            SELECT 1 
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            JOIN pg_class tc ON tc.oid = i.indrelid
            JOIN pg_namespace n ON n.oid = tc.relnamespace
            WHERE n.nspname = 'public' 
            AND tc.relname = t.table_name 
            AND a.attname = c.column_name
        )
    ) LOOP
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_%I ON public.%I (%I)', r.table_name, r.column_name, r.table_name, r.column_name);
    END LOOP;
END $$;

-- 2. Blindagem de Funções SECURITY DEFINER
-- Revogando execução pública por padrão e definindo search_path seguro
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Atualizando funções críticas para usar auth.uid() em vez de argumentos sem validação
CREATE OR REPLACE FUNCTION public.get_licenca_consultor_ativa(_produto text)
 RETURNS public.licencas
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.licencas
  WHERE user_id = auth.uid() -- Segurança: sempre usa o UID do usuário logado
    AND nivel = 'consultor'
    AND produto = _produto
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

-- 3. Sistema de Auditoria Automática
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela TEXT NOT NULL,
    registro_id UUID NOT NULL,
    operacao TEXT NOT NULL,
    usuario_id UUID REFERENCES auth.users(id),
    dados_antigos JSONB,
    dados_novos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_log FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_log (tabela, registro_id, operacao, usuario_id, dados_antigos)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_log (tabela, registro_id, operacao, usuario_id, dados_antigos, dados_novos)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_log (tabela, registro_id, operacao, usuario_id, dados_novos)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicando auditoria em tabelas críticas (Exemplos)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('empresas', 'licencas', 'documentos', 'user_roles')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', t, t);
    END LOOP;
END $$;
