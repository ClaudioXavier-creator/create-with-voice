-- 1. Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Integridade Referencial (FKs Faltantes)
ALTER TABLE public.documento_aprovacoes 
ADD CONSTRAINT fk_documento_aprovacoes_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.manuais_bpf 
ADD CONSTRAINT fk_manuais_bpf_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.execucao_pop_carimbos 
ADD CONSTRAINT fk_execucao_pop_carimbos_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 3. Blindagem de Funções com Verificação de Autorização
CREATE OR REPLACE FUNCTION public.get_limite_membros_empresa(_empresa_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nivel TEXT;
  v_plano TEXT;
BEGIN
  -- Segurança: Verifica se o usuário tem acesso a esta empresa antes de retornar dados
  IF NOT EXISTS (
    SELECT 1 FROM public.empresas WHERE id = _empresa_id AND (user_id = auth.uid() OR id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true))
  ) THEN
    RETURN 5; -- Retorno seguro (limite mínimo) se não houver acesso
  END IF;

  SELECT nivel, plano
    INTO v_nivel, v_plano
  FROM public.licencas
  WHERE empresa_id = _empresa_id
    AND status = 'ativa'
    AND data_expiracao >= CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;

  v_nivel := lower(coalesce(v_nivel, ''));
  v_plano := lower(coalesce(v_plano, ''));

  IF v_nivel LIKE '%avancado%' OR v_nivel LIKE '%avançado%' OR v_plano LIKE '%avancado%' OR v_plano LIKE '%avançado%' THEN
    RETURN 20;
  ELSIF v_nivel LIKE '%intermediario%' OR v_nivel LIKE '%intermediário%' OR v_plano LIKE '%intermediario%' OR v_plano LIKE '%intermediário%' THEN
    RETURN 10;
  ELSE
    RETURN 5;
  END IF;
END;
$function$;

-- Ajustando vincular_empresa_licenca_consultor para verificar titularidade
CREATE OR REPLACE FUNCTION public.vincular_empresa_licenca_consultor(_licenca_id uuid, _empresa_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_licenca public.licencas%ROWTYPE;
  v_empresa_owner uuid;
  v_excedente boolean := false;
  v_vinculo_id uuid;
BEGIN
  SELECT * INTO v_licenca FROM public.licencas WHERE id = _licenca_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Licença não encontrada');
  END IF;

  -- Segurança: Apenas o dono da licença pode vincular empresas
  IF v_licenca.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas o titular da licença pode realizar este vínculo');
  END IF;

  IF v_licenca.nivel <> 'consultor' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Licença não é do tipo Consultor');
  END IF;

  IF v_licenca.status <> 'ativa' OR v_licenca.data_expiracao < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Licença inativa ou expirada');
  END IF;

  SELECT user_id INTO v_empresa_owner FROM public.empresas WHERE id = _empresa_id;
  IF v_empresa_owner IS NULL OR v_empresa_owner <> v_licenca.user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Empresa não pertence ao titular da licença');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.licenca_empresas
    WHERE licenca_id = _licenca_id AND empresa_id = _empresa_id AND ativo = true
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true);
  END IF;

  IF v_licenca.slots_usados >= v_licenca.slots_max THEN
    v_excedente := true;
  END IF;

  INSERT INTO public.licenca_empresas (licenca_id, empresa_id, user_id, excedente)
  VALUES (_licenca_id, _empresa_id, v_licenca.user_id, v_excedente)
  RETURNING id INTO v_vinculo_id;

  IF NOT v_excedente THEN
    UPDATE public.licencas SET slots_usados = slots_usados + 1, updated_at = now()
    WHERE id = _licenca_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'vinculo_id', v_vinculo_id, 'excedente', v_excedente);
END;
$function$;

-- 4. Expansão da Auditoria para Todas as Tabelas de Negócio
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('audit_log', 'schema_migrations', 'profiles') -- Profiles já tem logs de auth
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', t, t);
    END LOOP;
END $$;
