
-- fornecedor_auditorias
DROP POLICY IF EXISTS "Users can view their own supplier audits" ON public.fornecedor_auditorias;
DROP POLICY IF EXISTS "Users can insert their own supplier audits" ON public.fornecedor_auditorias;
DROP POLICY IF EXISTS "Users can update their own supplier audits" ON public.fornecedor_auditorias;
DROP POLICY IF EXISTS "Users can delete their own supplier audits" ON public.fornecedor_auditorias;

CREATE POLICY "Empresa members can view supplier audits" ON public.fornecedor_auditorias FOR SELECT USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can insert supplier audits" ON public.fornecedor_auditorias FOR INSERT WITH CHECK (auth.uid() = user_id AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can update supplier audits" ON public.fornecedor_auditorias FOR UPDATE USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can delete supplier audits" ON public.fornecedor_auditorias FOR DELETE USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));

-- monitoramento_pcc
DROP POLICY IF EXISTS "Users can view their own PCC monitoring" ON public.monitoramento_pcc;
DROP POLICY IF EXISTS "Users can insert their own PCC monitoring" ON public.monitoramento_pcc;
DROP POLICY IF EXISTS "Users can update their own PCC monitoring" ON public.monitoramento_pcc;
DROP POLICY IF EXISTS "Users can delete their own PCC monitoring" ON public.monitoramento_pcc;

CREATE POLICY "Empresa members can view PCC monitoring" ON public.monitoramento_pcc FOR SELECT USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can insert PCC monitoring" ON public.monitoramento_pcc FOR INSERT WITH CHECK (auth.uid() = user_id AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can update PCC monitoring" ON public.monitoramento_pcc FOR UPDATE USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can delete PCC monitoring" ON public.monitoramento_pcc FOR DELETE USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));

-- pac_monitoramento
DROP POLICY IF EXISTS "Users can view their own PAC monitoring" ON public.pac_monitoramento;
DROP POLICY IF EXISTS "Users can insert their own PAC monitoring" ON public.pac_monitoramento;
DROP POLICY IF EXISTS "Users can update their own PAC monitoring" ON public.pac_monitoramento;
DROP POLICY IF EXISTS "Users can delete their own PAC monitoring" ON public.pac_monitoramento;

CREATE POLICY "Empresa members can view PAC monitoring" ON public.pac_monitoramento FOR SELECT USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can insert PAC monitoring" ON public.pac_monitoramento FOR INSERT WITH CHECK (auth.uid() = user_id AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can update PAC monitoring" ON public.pac_monitoramento FOR UPDATE USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
CREATE POLICY "Empresa members can delete PAC monitoring" ON public.pac_monitoramento FOR DELETE USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));
