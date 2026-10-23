import { loadStripe, type Stripe } from "@stripe/stripe-js";
type StripeEnv = "sandbox" | "live";
const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error("Pagamentos não configurados. Conclua a ativação do Stripe antes de aceitar pagamentos reais.");
}

let stripePromise: Promise<Stripe | null> | null = null;
export function getStripe(): Promise<Stripe | null> {
  getStripeEnvironment();
  if (!stripePromise) stripePromise = loadStripe(clientToken);
  return stripePromise;
}