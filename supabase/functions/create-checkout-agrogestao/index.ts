import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { AGROGESTAO_PRICES as PLAN_PRICES } from "../_shared/paddle-prices.ts";

const TIPO_ALIASES: Record<string, string> = {
  individual: "empresa",
  grupo10: "gestor10",
  grupo20: "consultor20",
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
    
    if (!userId) throw new Error("Usuário não autenticado");

    const body = await req.json().catch(() => ({}));
    let tipoKey = (body.tipo || "empresa").toLowerCase();
    tipoKey = TIPO_ALIASES[tipoKey] || tipoKey;
    const planoKey = (body.plano || "mensal").toLowerCase();

    const tipoPrices = PLAN_PRICES[tipoKey];
    if (!tipoPrices) throw new Error(`Tipo inválido: ${tipoKey}. Use: individual, grupo10 ou grupo20`);
    const priceConfig = tipoPrices[planoKey];
    if (!priceConfig) throw new Error(`Plano inválido: ${planoKey}. Use: mensal, semestral ou anual`);

    const origin = req.headers.get("origin") || "https://bpfconsult.com.br";

    // Criar transação no Paddle
    const response = await fetch(`${PADDLE_API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceConfig.id, quantity: 1 }],
        customer_email: userEmail,
        custom_data: {
          produto: "agrogestao",
          tipo: tipoKey,
          plano: planoKey,
          user_id: userId,
        },
        checkout: {
          confirm_url: `${origin}/agrogestao?checkout=success&tipo=${tipoKey}&plano=${planoKey}`,
          cancel_url: `${origin}/agrogestao?checkout=canceled&tipo=${tipoKey}&plano=${planoKey}`,
        }
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.detail || "Erro ao criar transação no Paddle");

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
