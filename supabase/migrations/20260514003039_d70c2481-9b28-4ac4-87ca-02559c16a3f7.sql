-- 1. Tabelas Agro RC CRM
CREATE TABLE IF NOT EXISTS public.agrorc_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    nome TEXT NOT NULL,
    documento TEXT,
    telefone TEXT,
    email TEXT,
    regiao TEXT,
    segmento TEXT,
    score_desempenho INTEGER DEFAULT 0,
    perfil_produtivo JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agrorc_visitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_id UUID REFERENCES public.agrorc_clientes(id) ON DELETE CASCADE,
    data_planejada DATE NOT NULL,
    data_realizada TIMESTAMPTZ,
    geolocalizacao JSONB, -- {lat, lng, precisao}
    fotos TEXT[], -- array de URLs do storage
    relatorio TEXT,
    status TEXT DEFAULT 'agendada', -- agendada, realizada, cancelada
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agrorc_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_id UUID REFERENCES public.agrorc_clientes(id),
    titulo TEXT NOT NULL,
    valor NUMERIC(15,2),
    etapa TEXT DEFAULT 'prospeccao', -- prospeccao, proposta, negociacao, fechamento, perdido
    data_fechamento_prevista DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabelas NutriCRM
CREATE TABLE IF NOT EXISTS public.nutricrm_projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_nome TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'em_analise',
    anexos TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabelas AgroGestão
CREATE TABLE IF NOT EXISTS public.agrogestao_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    gerente_id UUID REFERENCES auth.users(id) NOT NULL,
    vendedor_id UUID REFERENCES auth.users(id) NOT NULL,
    periodo TEXT NOT NULL, -- YYYY-MM
    valor_meta NUMERIC(15,2) NOT NULL,
    valor_realizado NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS em todas
ALTER TABLE public.agrorc_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrorc_visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrorc_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutricrm_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrogestao_metas ENABLE ROW LEVEL SECURITY;

-- 5. Políticas Multi-tenant (Isolamento por Empresa + Usuário)
CREATE POLICY "Isolamento por empresa - agrorc_clientes" ON public.agrorc_clientes
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.empresa_membros WHERE empresa_id = agrorc_clientes.empresa_id AND user_id = auth.uid() AND ativo = true)
    OR user_id = auth.uid()
);

CREATE POLICY "Isolamento por empresa - agrorc_visitas" ON public.agrorc_visitas
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.empresa_membros WHERE empresa_id = agrorc_visitas.empresa_id AND user_id = auth.uid() AND ativo = true)
    OR user_id = auth.uid()
);

CREATE POLICY "Isolamento por empresa - agrorc_pipeline" ON public.agrorc_pipeline
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.empresa_membros WHERE empresa_id = agrorc_pipeline.empresa_id AND user_id = auth.uid() AND ativo = true)
    OR user_id = auth.uid()
);

CREATE POLICY "Isolamento por empresa - nutricrm_projetos" ON public.nutricrm_projetos
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.empresa_membros WHERE empresa_id = nutricrm_projetos.empresa_id AND user_id = auth.uid() AND ativo = true)
    OR user_id = auth.uid()
);

CREATE POLICY "Isolamento por empresa - agrogestao_metas" ON public.agrogestao_metas
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.empresa_membros WHERE empresa_id = agrogestao_metas.empresa_id AND user_id = auth.uid() AND ativo = true)
    OR gerente_id = auth.uid()
);
