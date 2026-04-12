import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs per product and plan
const PRODUCT_PRICES: Record<string, Record<string, string>> = {
  feedbpf: {
    mensal: "price_1TLVzdHDmwi8j6XZGmQXXtCz",   // R$495
    semestral: "price_1TLW00HDmwi8j6XZJJprabSE", // R$2.475
    anual: "price_1TLW0THDmwi8j6XZz51tgZyf",     // R$4.455
  },
  nutricrm: {
    mensal: "price_1TH7N9HDmwi8j6XZxrNYaLy2",    // R$97
    semestral: "price_1TH7NlHDmwi8j6XZ3KABj9ne", // R$497
    anual: "price_1TH7OAHDmwi8j6XZtbxAcu35",     // R$897
  },
  agrogestao: {
    mensal: "price_1TLVzdHDmwi8j6XZGmQXXtCz",    // TODO: criar preços próprios
    semestral: "price_1TLW00HDmwi8j6XZJJprabSE",
    anual: "price_1TLW0THDmwi8j6XZz51tgZyf",
  },
  auditsbpf: {
    mensal: "price_1TLVzdHDmwi8j6XZGmQXXtCz",    // TODO: criar preços próprios
    semestral: "price_1TLW00HDmwi8j6XZJJprabSE",
    anual: "price_1TLW0THDmwi8j6XZz51tgZyf",
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

    const { empresa_id, plano, produto } = await req.json();
    if (!empresa_id) throw new Error("empresa_id é obrigatório");

    const productKey = (produto || "feedbpf").toLowerCase();
    const productPrices = PRODUCT_PRICES[productKey];
    if (!productPrices) throw new Error(`Produto inválido: ${productKey}`);

    const priceId = productPrices[plano as string];
    if (!priceId) throw new Error("Plano inválido. Use: mensal, semestral ou anual");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success&empresa_id=${empresa_id}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?checkout=canceled`,
      metadata: {
        empresa_id,
        user_id: user.id,
        plano,
        produto: productKey,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
