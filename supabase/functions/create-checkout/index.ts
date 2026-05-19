import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { FEED_BPF_PRICES as PLAN_PRICES } from "../_shared/paddle-prices.ts";

// Aliases retrocompatíveis
const NIVEL_ALIASES: Record<string, string> = {
  entrada: "standard",
  intermediario: "intermediaria",
  avancado: "premium",
};

const PADDLE_API_URL = Deno.env.get("PADDLE_SANDBOX_API_KEY") 
  ? "https://sandbox-api.paddle.com" 
  : "https://api.paddle.com";

const PADDLE_API_KEY = Deno.env.get("PADDLE_SANDBOX_API_KEY") || Deno.env.get("PADDLE_LIVE_API_KEY");

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
    if (!nivelPrices) throw new Error(`Nível inválido: ${nivelKey}`);

    const priceConfig = nivelPrices[planoKey];
    if (!priceConfig) throw new Error(`Plano inválido: ${planoKey}`);

    // Criar transação no Paddle
    const response = await fetch(`${PADDLE_API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceConfig.id, quantity: 1 }],
        customer_email: user.email,
        custom_data: {
          produto: "feedbpf",
          empresa_id,
          user_id: user.id,
          plano: planoKey,
          nivel: nivelKey,
        },
        checkout: {
          confirm_url: `${req.headers.get("origin")}/dashboard?checkout=success&empresa_id=${empresa_id}`,
          cancel_url: `${req.headers.get("origin")}/dashboard?checkout=canceled&empresa_id=${empresa_id}`,
        }
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.detail);

    return new Response(JSON.stringify({ url: data.data.checkout.url }), {
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
