
-- Migrate all RLS policies from public to authenticated role
-- Each table: drop old policy, create new one scoped to authenticated

-- analises_laboratorio
DROP POLICY IF EXISTS "Users manage own analises" ON public.analises_laboratorio;
CREATE POLICY "Users manage own analises" ON public.analises_laboratorio FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- arquivos_bpf
DROP POLICY IF EXISTS "Users manage own arquivos_bpf" ON public.arquivos_bpf;
CREATE POLICY "Users manage own arquivos_bpf" ON public.arquivos_bpf FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- audit_log
DROP POLICY IF EXISTS "Users insert own audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Users view own audit_log" ON public.audit_log;
CREATE POLICY "Users insert own audit_log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own audit_log" ON public.audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- batidas_producao
DROP POLICY IF EXISTS "Users manage own batidas_producao" ON public.batidas_producao;
CREATE POLICY "Users manage own batidas_producao" ON public.batidas_producao FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- calibracoes
DROP POLICY IF EXISTS "Users manage own calibracoes" ON public.calibracoes;
CREATE POLICY "Users manage own calibracoes" ON public.calibracoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- checklist_items
DROP POLICY IF EXISTS "Users manage own checklist" ON public.checklist_items;
CREATE POLICY "Users manage own checklist" ON public.checklist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- controle_pragas
DROP POLICY IF EXISTS "Users manage own pragas" ON public.controle_pragas;
CREATE POLICY "Users manage own pragas" ON public.controle_pragas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- controle_residuos
DROP POLICY IF EXISTS "Users manage own controle_residuos" ON public.controle_residuos;
CREATE POLICY "Users manage own controle_residuos" ON public.controle_residuos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- controle_substancias
DROP POLICY IF EXISTS "Users manage own controle_substancias" ON public.controle_substancias;
CREATE POLICY "Users manage own controle_substancias" ON public.controle_substancias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- controle_visitantes
DROP POLICY IF EXISTS "Users manage own controle_visitantes" ON public.controle_visitantes;
CREATE POLICY "Users manage own controle_visitantes" ON public.controle_visitantes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cronogramas_higiene
DROP POLICY IF EXISTS "Users manage own cronogramas_higiene" ON public.cronogramas_higiene;
CREATE POLICY "Users manage own cronogramas_higiene" ON public.cronogramas_higiene FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- documento_versoes
DROP POLICY IF EXISTS "Users manage own documento_versoes" ON public.documento_versoes;
CREATE POLICY "Users manage own documento_versoes" ON public.documento_versoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- documentos
DROP POLICY IF EXISTS "Users manage own documentos" ON public.documentos;
CREATE POLICY "Users manage own documentos" ON public.documentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- empresas
DROP POLICY IF EXISTS "Users manage own empresas" ON public.empresas;
CREATE POLICY "Users manage own empresas" ON public.empresas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- execucao_pops
DROP POLICY IF EXISTS "Users manage own execucao_pops" ON public.execucao_pops;
CREATE POLICY "Users manage own execucao_pops" ON public.execucao_pops FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- formula_itens
DROP POLICY IF EXISTS "Users manage own formula_itens" ON public.formula_itens;
CREATE POLICY "Users manage own formula_itens" ON public.formula_itens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fornecedores
DROP POLICY IF EXISTS "Users manage own fornecedores" ON public.fornecedores;
CREATE POLICY "Users manage own fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- legislacao_alertas
DROP POLICY IF EXISTS "Users manage own legislacao_alertas" ON public.legislacao_alertas;
CREATE POLICY "Users manage own legislacao_alertas" ON public.legislacao_alertas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- matriz_risco
DROP POLICY IF EXISTS "Users manage own matriz_risco" ON public.matriz_risco;
CREATE POLICY "Users manage own matriz_risco" ON public.matriz_risco FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- matriz_sensibilidade
DROP POLICY IF EXISTS "Users manage own matriz_sensibilidade" ON public.matriz_sensibilidade;
CREATE POLICY "Users manage own matriz_sensibilidade" ON public.matriz_sensibilidade FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- manutencoes
DROP POLICY IF EXISTS "Users manage own manutencoes" ON public.manutencoes;
CREATE POLICY "Users manage own manutencoes" ON public.manutencoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- nao_conformidades
DROP POLICY IF EXISTS "Users manage own NCs" ON public.nao_conformidades;
CREATE POLICY "Users manage own NCs" ON public.nao_conformidades FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- normas_legislacao
DROP POLICY IF EXISTS "Users manage own normas" ON public.normas_legislacao;
CREATE POLICY "Users manage own normas" ON public.normas_legislacao FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ordens_producao
DROP POLICY IF EXISTS "Users manage own ordens_producao" ON public.ordens_producao;
CREATE POLICY "Users manage own ordens_producao" ON public.ordens_producao FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- planejamento_anual
DROP POLICY IF EXISTS "Users manage own planejamento_anual" ON public.planejamento_anual;
CREATE POLICY "Users manage own planejamento_anual" ON public.planejamento_anual FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- pop_planilha_itens
DROP POLICY IF EXISTS "Users manage own pop_planilha_itens" ON public.pop_planilha_itens;
CREATE POLICY "Users manage own pop_planilha_itens" ON public.pop_planilha_itens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- pop_planilhas
DROP POLICY IF EXISTS "Users manage own pop_planilhas" ON public.pop_planilhas;
CREATE POLICY "Users manage own pop_planilhas" ON public.pop_planilhas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- producao
DROP POLICY IF EXISTS "Users manage own producao" ON public.producao;
CREATE POLICY "Users manage own producao" ON public.producao FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- produtos
DROP POLICY IF EXISTS "Users manage own produtos" ON public.produtos;
CREATE POLICY "Users manage own produtos" ON public.produtos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- rastreabilidade
DROP POLICY IF EXISTS "Users manage own rastreabilidade" ON public.rastreabilidade;
CREATE POLICY "Users manage own rastreabilidade" ON public.rastreabilidade FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- recebimento_mp
DROP POLICY IF EXISTS "Users manage own recebimento" ON public.recebimento_mp;
CREATE POLICY "Users manage own recebimento" ON public.recebimento_mp FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- registros_limpeza
DROP POLICY IF EXISTS "Users manage own registros_limpeza" ON public.registros_limpeza;
CREATE POLICY "Users manage own registros_limpeza" ON public.registros_limpeza FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- relatorios
DROP POLICY IF EXISTS "Users manage own relatorios" ON public.relatorios;
CREATE POLICY "Users manage own relatorios" ON public.relatorios FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
