
-- Auto-credit referral rewards when an indicated user gets an active paid license
CREATE OR REPLACE FUNCTION public.auto_credit_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_indicacao RECORD;
BEGIN
  -- Only credit for active, non-trial, non-admin licenses
  IF NEW.status <> 'ativa' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.plano,'') = 'trial' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.liberado_admin, false) = true THEN RETURN NEW; END IF;

  -- Find pending referral for this user
  SELECT * INTO v_indicacao
  FROM public.indicacoes
  WHERE indicado_user_id = NEW.user_id
    AND status IN ('pendente','cadastrado')
    AND recompensa_creditada = false
  ORDER BY criado_em ASC
  LIMIT 1;

  IF v_indicacao.id IS NULL THEN RETURN NEW; END IF;

  UPDATE public.indicacoes
  SET status = 'convertido',
      converteu_em = now(),
      recompensa_creditada = true,
      observacoes = COALESCE(observacoes,'') || ' [auto-creditado via licença ' || NEW.id::text || ']'
  WHERE id = v_indicacao.id;

  -- Notify admin
  INSERT INTO public.notificacoes_admin (tipo, titulo, mensagem, severidade, metadata)
  VALUES (
    'referral_convertido',
    'Indicação convertida automaticamente',
    'Recompensa de R$ ' || COALESCE(v_indicacao.recompensa_valor,0)::text || ' creditada para indicador.',
    'info',
    jsonb_build_object('indicacao_id', v_indicacao.id, 'licenca_id', NEW.id, 'indicador_user_id', v_indicacao.indicador_user_id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block license creation
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_credit_referral ON public.licencas;
CREATE TRIGGER trg_auto_credit_referral
AFTER INSERT OR UPDATE OF status ON public.licencas
FOR EACH ROW EXECUTE FUNCTION public.auto_credit_referral();
