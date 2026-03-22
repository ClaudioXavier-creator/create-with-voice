ALTER TABLE public.pop_planilhas
  ADD COLUMN assinatura_executor text DEFAULT '',
  ADD COLUMN assinatura_executor_data timestamptz,
  ADD COLUMN assinatura_supervisor text DEFAULT '',
  ADD COLUMN assinatura_supervisor_data timestamptz,
  ADD COLUMN assinatura_rt text DEFAULT '',
  ADD COLUMN assinatura_rt_crmv text DEFAULT '',
  ADD COLUMN assinatura_rt_data timestamptz;