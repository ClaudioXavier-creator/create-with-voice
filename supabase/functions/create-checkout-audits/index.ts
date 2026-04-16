import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Audits BPF — 2 níveis × 3 períodos
// Mensal = subscription | Semestral/Anual = one-time payment
const PLAN_PRICES: Record<string, Record<string, { id: string; mode: "subscription" | "payment" }>> = {
  individual: {
    mensal:    { id: "price_1TMyOdHDmwi8j6XZuoSTvlCL", mode: "subscription" },
    semestral: { id: "price_1TMyPJHDmwi8j6XZPaj3OUbQ", mode: "payment" },
    anual:     { id: "price_1TMyQiHDmwi8j6XZUw9SKDR8", mode: "payment" },
  },
  consultor: {
    mensal:    { id: "price_1TMyR7HDmwi8j6XZHibD5jBj", mode: "subscription" },
    semestral: { id: "price_1TMyRUHDmwi8j6XZkj4kP0BJ", mode: "payment" },
    anual:     { id: "price_1TMyRtHDmwi8j6XZKWDtCMEb", mode: "payment" },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) throw new Error("Usuário não autenticado");

    const { empresa_id, plano, nivel } = await req.json();

    const nivelKey = (nivel || "individual").toLowerCase();
    const planoKey = (plano || "mensal").toLowerCase();

    const nivelPrices = PLAN_PRICES[nivelKey];
    if (!nivelPrices) throw new Error(`Nível inválido: ${nivelKey}. Use: individual ou consultor`);

    const priceConfig = nivelPrices[planoKey];
    if (!priceConfig) throw new Error("Plano inválido. Use: mensal, semestral ou anual");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceConfig.id, quantity: 1 }],
      mode: priceConfig.mode,
      success_url: `${origin}/audits-bpf?checkout=success`,
      cancel_url: `${origin}/audits-bpf/planos?checkout=canceled`,
      metadata: {
        produto: "auditsbpf",
        empresa_id: empresa_id || "",
        user_id: user.id,
        plano: planoKey,
        nivel: nivelKey,
      },
      allow_promotion_codes: true,
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
