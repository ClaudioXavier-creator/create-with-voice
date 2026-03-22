
ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS bairro text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cep text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cidade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS estado text DEFAULT '',
  ADD COLUMN IF NOT EXISTS inscricao_estadual text DEFAULT '',
  ADD COLUMN IF NOT EXISTS registro_mapa text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contato_qualidade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contato_qualidade_tel_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contato_comercial text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contato_comercial_tel_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS produtos_fornecidos text DEFAULT '',
  ADD COLUMN IF NOT EXISTS doc_certificado_registro_mapa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_alvara_funcionamento boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_certificado_registro_produto boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_ficha_tecnica boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_certificado_analise boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS resultado_qualificacao text DEFAULT 'pendente';
