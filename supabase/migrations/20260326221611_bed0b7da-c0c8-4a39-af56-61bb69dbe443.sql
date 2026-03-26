
CREATE TABLE public.modelos_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senha_hash text NOT NULL,
  descricao text DEFAULT 'Senha padrão de acesso aos modelos',
  ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.modelos_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can check passwords"
  ON public.modelos_acesso FOR SELECT TO authenticated
  USING (ativa = true);
