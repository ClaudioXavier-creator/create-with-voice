
REVOKE SELECT (token_hash) ON public.convites_empresa FROM authenticated, anon;
REVOKE SELECT (pin_hash) ON public.empresa_pin FROM authenticated, anon;
