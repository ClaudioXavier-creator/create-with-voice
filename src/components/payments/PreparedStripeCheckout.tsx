import { useCallback, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

export interface PreparedStripeCheckoutProps {
  empresaId: string;
  priceId: string;
  onComplete?: () => void;
}

// Intentionally not mounted in any route or public button until activation is approved.
export function PreparedStripeCheckout({ empresaId, priceId, onComplete }: PreparedStripeCheckoutProps) {
  const [error, setError] = useState<string | null>(null);
  const fetchClientSecret = useCallback(async () => {
    try {
      const { data, error: requestError } = await supabase.functions.invoke("prepare-stripe-checkout", {
        body: { empresa_id: empresaId, priceId, environment: getStripeEnvironment() },
      });
      if (requestError) {
        const details = requestError instanceof FunctionsHttpError ? await requestError.context.json() : null;
        throw new Error(details?.error || requestError.message);
      }
      if (!data?.clientSecret) throw new Error("Não foi possível preparar o pagamento");
      return data.clientSecret as string;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Pagamento indisponível";
      setError(message);
      throw new Error(message);
    }
  }, [empresaId, priceId]);
  return <section aria-label="Pagamento Stripe" className="w-full">
    <PaymentTestModeBanner />
    {error ? <p role="alert" className="py-4 text-destructive">{error}</p> :
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret, onComplete }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>}
  </section>;
}