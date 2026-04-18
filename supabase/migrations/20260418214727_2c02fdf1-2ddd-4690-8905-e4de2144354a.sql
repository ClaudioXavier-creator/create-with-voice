-- PIN único por empresa para operadores chão de fábrica
CREATE TABLE public.empresa_pin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_pin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own empresa_pin"
ON public.empresa_pin
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_empresa_pin_updated_at
BEFORE UPDATE ON public.empresa_pin
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carimbos antifraude para execuções POP
CREATE TABLE public.execucao_pop_carimbos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execucao_id UUID NOT NULL,
  empresa_id UUID,
  user_id UUID NOT NULL,
  operador_nome TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  carimbo_data TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.execucao_pop_carimbos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own carimbos"
ON public.execucao_pop_carimbos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own carimbos"
ON public.execucao_pop_carimbos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_carimbos_execucao ON public.execucao_pop_carimbos(execucao_id);