-- Expansão do CAPA em Não Conformidades
ALTER TABLE public.nao_conformidades 
ADD COLUMN IF NOT EXISTS acao_preventiva TEXT,
ADD COLUMN IF NOT EXISTS verificacao_eficacia TEXT,
ADD COLUMN IF NOT EXISTS data_verificacao DATE;

-- Tabela de Monitoramento de PCC (Pontos Críticos de Controle)
CREATE TABLE IF NOT EXISTS public.monitoramento_pcc (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    ponto_critico TEXT NOT NULL, -- Ex: Tratamento Térmico, Detector de Metais
    parametro TEXT NOT NULL, -- Ex: Temperatura, Velocidade
    limite_critico TEXT, -- Limite operacional
    valor_encontrado TEXT NOT NULL,
    conformidade BOOLEAN DEFAULT TRUE,
    acao_corretiva TEXT,
    responsavel TEXT NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitoramento_pcc TO authenticated;
GRANT ALL ON public.monitoramento_pcc TO service_role;
ALTER TABLE public.monitoramento_pcc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PCC monitoring" ON public.monitoramento_pcc FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own PCC monitoring" ON public.monitoramento_pcc FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own PCC monitoring" ON public.monitoramento_pcc FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own PCC monitoring" ON public.monitoramento_pcc FOR DELETE USING (auth.uid() = user_id);

-- Tabela de Monitoramento de PAC (Programa de Autocontrole / POP 10)
CREATE TABLE IF NOT EXISTS public.pac_monitoramento (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    elemento_controle TEXT NOT NULL, -- Ex: Manutenção, Higiene, Água
    item_avaliado TEXT NOT NULL,
    resultado TEXT,
    conformidade BOOLEAN DEFAULT TRUE,
    acao_corretiva TEXT,
    monitor TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pac_monitoramento TO authenticated;
GRANT ALL ON public.pac_monitoramento TO service_role;
ALTER TABLE public.pac_monitoramento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PAC monitoring" ON public.pac_monitoramento FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own PAC monitoring" ON public.pac_monitoramento FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own PAC monitoring" ON public.pac_monitoramento FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own PAC monitoring" ON public.pac_monitoramento FOR DELETE USING (auth.uid() = user_id);

-- Tabela de Auditorias de Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedor_auditorias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    data_auditoria DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_auditoria TEXT NOT NULL, -- Presencial, Documental
    auditor TEXT NOT NULL,
    pontuacao_obtida INTEGER,
    status TEXT DEFAULT 'concluida', -- concluida, pendente, cancelada
    observacoes TEXT,
    itens_auditoria JSONB, -- Lista de itens e conformidades
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_auditorias TO authenticated;
GRANT ALL ON public.fornecedor_auditorias TO service_role;
ALTER TABLE public.fornecedor_auditorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own supplier audits" ON public.fornecedor_auditorias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own supplier audits" ON public.fornecedor_auditorias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own supplier audits" ON public.fornecedor_auditorias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own supplier audits" ON public.fornecedor_auditorias FOR DELETE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_monitoramento_pcc_updated_at BEFORE UPDATE ON public.monitoramento_pcc FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pac_monitoramento_updated_at BEFORE UPDATE ON public.pac_monitoramento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedor_auditorias_updated_at BEFORE UPDATE ON public.fornecedor_auditorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
