import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BPF Consult — 3 planos × 3 períodos
// Mensal = subscription | Semestral/Anual = one-time payment
const PLAN_PRICES: Record<string, Record<string, { id: string; mode: "subscription" | "payment" }>> = {
  entrada: {
    mensal:    { id: "price_1TMwhPHDmwi8j6XZegZsr8J2", mode: "subscription" },
    semestral: { id: "price_1TMxllHDmwi8j6XZp3XJ7rh9", mode: "payment" },
    anual:     { id: "price_1TMxmmHDmwi8j6XZulS5aOYg", mode: "payment" },
  },
  intermediario: {
    mensal:    { id: "price_1TMxn9HDmwi8j6XZjUvuls2t", mode: "subscription" },
    semestral: { id: "price_1TMxnTHDmwi8j6XZzPkgpRqU", mode: "payment" },
    anual:     { id: "price_1TMxpOHDmwi8j6XZBptFMtay", mode: "payment" },
  },
  avancado: {
    mensal:    { id: "price_1TMxqOHDmwi8j6XZaODkJK8s", mode: "subscription" },
    semestral: { id: "price_1TMxqhHDmwi8j6XZwZyoH4UL", mode: "payment" },
    anual:     { id: "price_1TMxrEHDmwi8j6XZFB9XK2kl", mode: "payment" },
  },
};

// Cupom 50% off — válido durante 2026
const LAUNCH_COUPON_ID = "7QiChQQ1";
const LAUNCH_END_DATE = new Date("2026-12-31T23:59:59Z");

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
    if (!empresa_id) throw new Error("empresa_id é obrigatório");

    const nivelKey = (nivel || "entrada").toLowerCase();
    const planoKey = (plano || "mensal").toLowerCase();

    const nivelPrices = PLAN_PRICES[nivelKey];
    if (!nivelPrices) throw new Error(`Nível inválido: ${nivelKey}. Use: entrada, intermediario ou avancado`);

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

    // Aplicar cupom de lançamento automaticamente até 31/12/2026
    const now = new Date();
    const applyLaunchDiscount = now <= LAUNCH_END_DATE;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceConfig.id, quantity: 1 }],
      mode: priceConfig.mode,
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success&empresa_id=${empresa_id}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?checkout=canceled`,
      metadata: {
        empresa_id,
        user_id: user.id,
        plano: planoKey,
        nivel: nivelKey,
      },
      allow_promotion_codes: true,
    };

    if (applyLaunchDiscount) {
      sessionParams.discounts = [{ coupon: LAUNCH_COUPON_ID }];
      // discounts e allow_promotion_codes são mutuamente exclusivos
      delete sessionParams.allow_promotion_codes;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
