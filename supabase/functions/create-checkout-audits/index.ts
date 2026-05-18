import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Audits_BPF — 3 níveis × 3 períodos
// Mensal = subscription | Semestral/Anual = one-time payment
const PLAN_PRICES: Record<string, Record<string, { id: string; mode: "subscription" | "payment" }>> = {
  // 1 empresa, até 10 usuários (R$ 297/mês)
  empresa: {
    mensal:    { id: "price_1TYVcSHDmwi8j6XZxiUOYUUf", mode: "subscription" },
    semestral: { id: "price_1TYVcSHDmwi8j6XZxE9BpoLa", mode: "payment" },
    anual:     { id: "price_1TYVcTHDmwi8j6XZoCK4Bjet", mode: "payment" },
  },
  // Consultor — até 10 empresas (R$ 297/mês)
  consultor10: {
    mensal:    { id: "price_1TYVcTHDmwi8j6XZLUrx1WdR", mode: "subscription" },
    semestral: { id: "price_1TYVcUHDmwi8j6XZS9ttYJfp", mode: "payment" },
    anual:     { id: "price_1TYVcUHDmwi8j6XZAGXYBLS6", mode: "payment" },
  },
  // Consultor — até 20 empresas (R$ 497/mês)
  consultor20: {
    mensal:    { id: "price_1TYVcVHDmwi8j6XZLiuVjkxc", mode: "subscription" },
    semestral: { id: "price_1TYVcVHDmwi8j6XZQdqtaubv", mode: "payment" },
    anual:     { id: "price_1TYVcWHDmwi8j6XZVT1gElpW", mode: "payment" },
  },
};

// Aliases retrocompatíveis
const NIVEL_ALIASES: Record<string, string> = {
  individual: "empresa",
  consultor: "consultor10",
};

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

    let nivelKey = (nivel || "empresa").toLowerCase();
    nivelKey = NIVEL_ALIASES[nivelKey] || nivelKey;
    const planoKey = (plano || "mensal").toLowerCase();

    const nivelPrices = PLAN_PRICES[nivelKey];
    if (!nivelPrices) throw new Error(`Nível inválido: ${nivelKey}. Use: empresa, consultor10 ou consultor20`);

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
      success_url: `${origin}/auditsbpf/planos?checkout=success`,
      cancel_url: `${origin}/auditsbpf/planos?checkout=canceled`,
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
