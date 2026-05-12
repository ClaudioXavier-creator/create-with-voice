import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Nutri_Agro Labels — Grupo 10 e Grupo 20 × 3 períodos
// Mensal = subscription | Semestral/Anual = one-time payment
const PLAN_PRICES: Record<string, Record<string, { id: string; mode: "subscription" | "payment" }>> = {
  grupo10: {
    mensal:    { id: "price_1TWLDSHDmwi8j6XZxnHtmb3e", mode: "subscription" },
    semestral: { id: "price_1TWLJsHDmwi8j6XZ8RPX08kN", mode: "payment" },
    anual:     { id: "price_1TWLMwHDmwi8j6XZVyPbJ6Bl", mode: "payment" },
  },
  grupo20: {
    mensal:    { id: "price_1TWLNmHDmwi8j6XZeRA9TrTA", mode: "subscription" },
    semestral: { id: "price_1TWLOGHDmwi8j6XZqvjlkz2M", mode: "payment" },
    anual:     { id: "price_1TWLRzHDmwi8j6XZflZC0fzF", mode: "payment" },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    let userEmail: string | undefined;
    let userId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data?.user?.email) {
        userEmail = data.user.email;
        userId = data.user.id;
      }
    }

    const body = await req.json().catch(() => ({}));
    const tipoKey = (body.tipo || "grupo10").toLowerCase();
    const planoKey = (body.plano || "mensal").toLowerCase();

    const tipoPrices = PLAN_PRICES[tipoKey];
    if (!tipoPrices) throw new Error(`Tipo inválido: ${tipoKey}. Use: grupo10 ou grupo20`);
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
      success_url: `${origin}/rotulos?checkout=success`,
      cancel_url: `${origin}/rotulos?checkout=canceled`,
      allow_promotion_codes: true,
      metadata: {
        produto: "nutri_agro_labels",
        tipo: tipoKey,
        plano: planoKey,
        ...(userId ? { user_id: userId } : {}),
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
