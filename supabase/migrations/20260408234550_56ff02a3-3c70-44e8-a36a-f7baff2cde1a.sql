ALTER TABLE public.documentos
  ADD COLUMN validade_revisao date DEFAULT NULL,
  ADD COLUMN proxima_revisao date DEFAULT NULL;