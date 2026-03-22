-- Produtos registry (central product catalog)
CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nome text NOT NULL,
  marca text DEFAULT '',
  classificacao text NOT NULL DEFAULT 'racao',
  especie_alvo text DEFAULT '',
  categoria_animal text DEFAULT '',
  registro_mapa text DEFAULT '',
  peso_liquido text DEFAULT '',
  unidade_peso text DEFAULT 'kg',
  validade_meses integer DEFAULT 6,
  forma_fisica text DEFAULT '',
  armazenamento text DEFAULT '',
  modo_uso text DEFAULT '',
  precaucoes text DEFAULT '',
  indicacoes text DEFAULT '',
  composicao text DEFAULT '',
  niveis_garantia jsonb DEFAULT '{}',
  foto_url text DEFAULT '',
  diferenciais text DEFAULT '',
  modo_preparo text DEFAULT '',
  embalagem text DEFAULT '',
  observacoes text DEFAULT '',
  status text DEFAULT 'ativo'
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own produtos"
  ON public.produtos FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Rótulos (labels per product, IN 22 compliant)
CREATE TABLE public.rotulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tipo_rotulo text NOT NULL DEFAULT 'racao',
  nome_comercial text DEFAULT '',
  classificacao_label text DEFAULT '',
  especie_categoria text DEFAULT '',
  composicao_ingredientes text DEFAULT '',
  niveis_garantia_texto text DEFAULT '',
  indicacoes_uso text DEFAULT '',
  modo_usar text DEFAULT '',
  precaucoes_restricoes text DEFAULT '',
  peso_liquido text DEFAULT '',
  prazo_validade text DEFAULT '',
  armazenamento text DEFAULT '',
  lote_placeholder text DEFAULT 'LOTE: ___________',
  fabricacao_placeholder text DEFAULT 'FAB: ___/___/______',
  registro_mapa text DEFAULT '',
  razao_social text DEFAULT '',
  cnpj text DEFAULT '',
  endereco text DEFAULT '',
  rt_nome text DEFAULT '',
  rt_crmv text DEFAULT '',
  sac_contato text DEFAULT '',
  largura_mm integer DEFAULT 100,
  altura_mm integer DEFAULT 50,
  status text DEFAULT 'ativo'
);

ALTER TABLE public.rotulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rotulos"
  ON public.rotulos FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);