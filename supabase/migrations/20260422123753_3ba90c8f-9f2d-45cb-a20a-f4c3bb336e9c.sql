ALTER TABLE public.licencas DROP CONSTRAINT IF EXISTS licencas_nivel_check;
ALTER TABLE public.licencas
  ADD CONSTRAINT licencas_nivel_check
  CHECK (nivel = ANY (ARRAY['individual'::text, 'consultor'::text, 'entrada'::text, 'intermediario'::text, 'avancado'::text]));

ALTER TABLE public.licencas DROP CONSTRAINT IF EXISTS licencas_produto_check;
ALTER TABLE public.licencas
  ADD CONSTRAINT licencas_produto_check
  CHECK (produto = ANY (ARRAY['feed_bpf'::text, 'audits_bpf'::text, 'completo'::text, 'agrogestao'::text, 'nutricrm'::text]));