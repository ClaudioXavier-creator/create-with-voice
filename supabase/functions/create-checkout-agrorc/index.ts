import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agro RC CRM — Individual (1 user) e Grupo (20 users) × 3 períodos
// Mensal = subscription | Semestral/Anual = one-time payment
const PLAN_PRICES: Record<string, Record<string, { id: string; mode: "subscription" | "payment" }>> = {
  individual: {
    mensal:    { id: "price_1TQat7HDmwi8j6XZkhjZKnZz", mode: "subscription" },
    semestral: { id: "price_1TQatgHDmwi8j6XZjHuU1Rxx", mode: "payment" },
    anual:     { id: "price_1TQauHHDmwi8j6XZRZDsIBUY", mode: "payment" },
  },
  grupo10: {
    mensal:    { id: "price_1TQavXHDmwi8j6XZUe2L4p9Y", mode: "subscription" }, // Placeholder
    semestral: { id: "price_1TQavZHDmwi8j6XZzI7M5q8A", mode: "payment" },      // Placeholder
    anual:     { id: "price_1TQavbHDmwi8j6XZ9N3N6r7B", mode: "payment" },      // Placeholder
  },
  grupo20: {
    mensal:    { id: "price_1TQauhHDmwi8j6XZVtURafTa", mode: "subscription" },
    semestral: { id: "price_1TQav8HDmwi8j6XZUNdKtQWd", mode: "payment" },
    anual:     { id: "price_1TQayCHDmwi8j6XZ1sLzGIhP", mode: "payment" },
  },
};

const APP_URL = "https://soil-to-client.lovable.app/";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const tipoKey = (body.tipo || "individual").toLowerCase();
    const planoKey = (body.plano || "mensal").toLowerCase();
    const product = (body.produto || "agrorc").toLowerCase();

    const tipoPrices = PLAN_PRICES[tipoKey];
    if (!tipoPrices) throw new Error(`Tipo inválido: ${tipoKey}. Use: individual, grupo10 ou grupo20`);
    const priceConfig = tipoPrices[planoKey];
    if (!priceConfig) throw new Error("Plano inválido. Use: mensal, semestral ou anual");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://bpfconsult.com.br";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: priceConfig.id, quantity: 1 }],
      mode: priceConfig.mode,
      success_url: `${origin}/${product}?checkout=success`,
      cancel_url: `${origin}/${product}?checkout=canceled`,
      allow_promotion_codes: true,
      metadata: {
        produto: product,
        tipo: tipoKey,
        plano: planoKey,
        user_id: userId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
