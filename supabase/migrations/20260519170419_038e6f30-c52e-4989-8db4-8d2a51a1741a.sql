
-- Helper: verifica se user pode usar um empresa_id (dono ou membro ativo, ou null)
CREATE OR REPLACE FUNCTION public.pode_usar_empresa(_empresa_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _empresa_id IS NULL
      OR EXISTS (SELECT 1 FROM public.empresas WHERE id = _empresa_id AND user_id = _user_id)
      OR public.is_membro_empresa(_empresa_id, _user_id);
$$;

-- ============ Tabelas operacionais: substitui políticas ALL por user_id por políticas que também consideram membros da empresa ============

-- analises_laboratorio
DROP POLICY IF EXISTS "Users manage own analises" ON public.analises_laboratorio;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.analises_laboratorio
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- calibracoes
DROP POLICY IF EXISTS "Users manage own calibracoes" ON public.calibracoes;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.calibracoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- documento_versoes
DROP POLICY IF EXISTS "Users manage own documento_versoes" ON public.documento_versoes;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.documento_versoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- documentos
DROP POLICY IF EXISTS "Users manage own documentos" ON public.documentos;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.documentos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- expedicao_itens
DROP POLICY IF EXISTS "Users manage own expedicao_itens" ON public.expedicao_itens;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.expedicao_itens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- expedicoes
DROP POLICY IF EXISTS "Users manage own expedicoes" ON public.expedicoes;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.expedicoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- formula_ingredientes
DROP POLICY IF EXISTS "Users manage own formula_ingredientes" ON public.formula_ingredientes;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.formula_ingredientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- formulas
DROP POLICY IF EXISTS "Users manage own formulas" ON public.formulas;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.formulas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- fornecedores
DROP POLICY IF EXISTS "Users manage own fornecedores" ON public.fornecedores;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.fornecedores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- manuais_bpf
DROP POLICY IF EXISTS "Users manage own manuais_bpf" ON public.manuais_bpf;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.manuais_bpf
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- nao_conformidades
DROP POLICY IF EXISTS "Users manage own NCs" ON public.nao_conformidades;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.nao_conformidades
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- ordens_producao
DROP POLICY IF EXISTS "Users manage own ordens_producao" ON public.ordens_producao;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.ordens_producao
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- rastreabilidade
DROP POLICY IF EXISTS "Users manage own rastreabilidade" ON public.rastreabilidade;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.rastreabilidade
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- recebimento_mp
DROP POLICY IF EXISTS "Users manage own recebimento" ON public.recebimento_mp;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.recebimento_mp
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- documento_aprovacoes: já tem SELECT por membro. Reforça INSERT para validar empresa_id.
DROP POLICY IF EXISTS "Users insert own documento_aprovacoes" ON public.documento_aprovacoes;
CREATE POLICY "Users insert own documento_aprovacoes" ON public.documento_aprovacoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

-- reclamacoes_qualidade
DROP POLICY IF EXISTS "Users can view own reclamacoes" ON public.reclamacoes_qualidade;
DROP POLICY IF EXISTS "Users can insert own reclamacoes" ON public.reclamacoes_qualidade;
DROP POLICY IF EXISTS "Users can update own reclamacoes" ON public.reclamacoes_qualidade;
DROP POLICY IF EXISTS "Users can delete own reclamacoes" ON public.reclamacoes_qualidade;

CREATE POLICY "Acesso por dono ou membro empresa" ON public.reclamacoes_qualidade
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())));

CREATE POLICY "Inserir como dono em empresa permitida" ON public.reclamacoes_qualidade
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.pode_usar_empresa(empresa_id, auth.uid()));

CREATE POLICY "Atualizar como dono ou membro empresa" ON public.reclamacoes_qualidade
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
  WITH CHECK (public.pode_usar_empresa(empresa_id, auth.uid()));

CREATE POLICY "Deletar como dono" ON public.reclamacoes_qualidade
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ licencas: bloqueio explícito de INSERT/UPDATE/DELETE para authenticated ============
CREATE POLICY "Bloquear mutacoes diretas por authenticated" ON public.licencas
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
