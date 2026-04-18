
CREATE TABLE public.expedicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  numero_nf text NOT NULL,
  serie_nf text DEFAULT '',
  chave_acesso text DEFAULT '',
  data_emissao date,
  data_saida date,
  cliente_nome text NOT NULL,
  cliente_cnpj text DEFAULT '',
  cliente_ie text DEFAULT '',
  cliente_endereco text DEFAULT '',
  cliente_cidade text DEFAULT '',
  cliente_uf text DEFAULT '',
  cliente_cep text DEFAULT '',
  cliente_telefone text DEFAULT '',
  transportadora_nome text DEFAULT '',
  transportadora_cnpj text DEFAULT '',
  motorista_nome text DEFAULT '',
  motorista_cpf text DEFAULT '',
  veiculo_placa text DEFAULT '',
  veiculo_uf text DEFAULT '',
  peso_bruto_kg numeric,
  peso_liquido_kg numeric,
  valor_total numeric,
  observacoes text DEFAULT '',
  xml_content text,
  origem text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'emitida',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expedicoes_user ON public.expedicoes(user_id);
CREATE INDEX idx_expedicoes_empresa ON public.expedicoes(empresa_id);
CREATE INDEX idx_expedicoes_nf ON public.expedicoes(numero_nf);
CREATE INDEX idx_expedicoes_cliente_cnpj ON public.expedicoes(cliente_cnpj);

ALTER TABLE public.expedicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expedicoes" ON public.expedicoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_expedicoes_updated_at
  BEFORE UPDATE ON public.expedicoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.expedicao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  expedicao_id uuid NOT NULL REFERENCES public.expedicoes(id) ON DELETE CASCADE,
  produto text NOT NULL,
  codigo_produto text DEFAULT '',
  lote_produto text DEFAULT '',
  quantidade numeric NOT NULL DEFAULT 0,
  unidade text DEFAULT 'kg',
  valor_unitario numeric,
  valor_total numeric,
  rastreabilidade_id uuid,
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expedicao_itens_user ON public.expedicao_itens(user_id);
CREATE INDEX idx_expedicao_itens_expedicao ON public.expedicao_itens(expedicao_id);
CREATE INDEX idx_expedicao_itens_lote ON public.expedicao_itens(lote_produto);

ALTER TABLE public.expedicao_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expedicao_itens" ON public.expedicao_itens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
