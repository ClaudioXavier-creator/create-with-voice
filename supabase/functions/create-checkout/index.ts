import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Feed_BPF — 3 níveis × 3 períodos
// Mensal = subscription | Semestral/Anual = one-time payment (15% / 25% desconto)
const PLAN_PRICES: Record<string, Record<string, { id: string; mode: "subscription" | "payment" }>> = {
  // Standard — 1 licença, até 10 usuários (R$ 397/mês)
  standard: {
    mensal:    { id: "price_1TYVRyHDmwi8j6XZcw83NOgn", mode: "subscription" },
    semestral: { id: "price_1TYVSUHDmwi8j6XZynGI0DWm", mode: "payment" },
    anual:     { id: "price_1TYVZDHDmwi8j6XZmpHmAXkX", mode: "payment" },
  },
  // Intermediária — 1 licença, até 20 usuários (R$ 697/mês)
  intermediaria: {
    mensal:    { id: "price_1TYVZjHDmwi8j6XZDHIcRikw", mode: "subscription" },
    semestral: { id: "price_1TYVbUHDmwi8j6XZm0UDOWYp", mode: "payment" },
    anual:     { id: "price_1TYVcQHDmwi8j6XZIUi8XKBN", mode: "payment" },
  },
  // Premium — 1 licença, usuários ilimitados (R$ 1.297/mês)
  premium: {
    mensal:    { id: "price_1TYVcQHDmwi8j6XZigGCLDNe", mode: "subscription" },
    semestral: { id: "price_1TYVcRHDmwi8j6XZaOCz6PxR", mode: "payment" },
    anual:     { id: "price_1TYVcRHDmwi8j6XZ0veChm4B", mode: "payment" },
  },
};

// Aliases retrocompatíveis com nomenclatura antiga
const NIVEL_ALIASES: Record<string, string> = {
  entrada: "standard",
  intermediario: "intermediaria",
  avancado: "premium",
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

    const authHeader = req.headers.get("Authorization");
    let user: { id: string; email: string } | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user?.email) user = { id: data.user.id, email: data.user.email };
    }
    if (!user) throw new Error("Usuário não autenticado");

    const { empresa_id, plano, nivel } = await req.json();
    if (!empresa_id) throw new Error("empresa_id é obrigatório");

    let nivelKey = (nivel || "standard").toLowerCase();
    nivelKey = NIVEL_ALIASES[nivelKey] || nivelKey;
    const planoKey = (plano || "mensal").toLowerCase();

    const nivelPrices = PLAN_PRICES[nivelKey];
    if (!nivelPrices) throw new Error(`Nível inválido: ${nivelKey}. Use: standard, intermediaria ou premium`);

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

    const now = new Date();
    const applyLaunchDiscount = now <= LAUNCH_END_DATE;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceConfig.id, quantity: 1 }],
      mode: priceConfig.mode,
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success&empresa_id=${empresa_id}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?checkout=canceled&empresa_id=${empresa_id}`,
      metadata: {
        produto: "feedbpf",
        empresa_id,
        user_id: user.id,
        plano: planoKey,
        nivel: nivelKey,
      },
      allow_promotion_codes: true,
    };

    if (applyLaunchDiscount) {
      sessionParams.discounts = [{ coupon: LAUNCH_COUPON_ID }];
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
