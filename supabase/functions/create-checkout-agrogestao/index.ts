import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { AGROGESTAO_PRICES as PLAN_PRICES } from "../_shared/paddle-prices.ts";
import { createPaddleCheckout } from "../_shared/paddle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIPO_ALIASES: Record<string, string> = {
  individual: "empresa",
  grupo10: "gestor10",
  grupo20: "consultor20",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    if (!userId || !userEmail) throw new Error("Usuário não autenticado");

    const body = await req.json().catch(() => ({}));
    let tipoKey = (body.tipo || "empresa").toLowerCase();
    tipoKey = TIPO_ALIASES[tipoKey] || tipoKey;
    const planoKey = (body.plano || "mensal").toLowerCase();

    const tipoPrices = PLAN_PRICES[tipoKey];
    if (!tipoPrices) throw new Error(`Tipo inválido: ${tipoKey}`);
    const priceConfig = tipoPrices[planoKey as keyof typeof tipoPrices];
    if (!priceConfig) throw new Error(`Plano inválido: ${planoKey}`);

    const origin = req.headers.get("origin") || "https://bpfconsult.com.br";

    const url = await createPaddleCheckout({
      priceId: priceConfig.id,
      customerEmail: userEmail,
      customData: { produto: "agrogestao", tipo: tipoKey, plano: planoKey, user_id: userId },
      successUrl: `${origin}/agrogestao?checkout=success&tipo=${tipoKey}&plano=${planoKey}`,
      cancelUrl: `${origin}/agrogestao?checkout=canceled&tipo=${tipoKey}&plano=${planoKey}`,
    });

    return new Response(JSON.stringify({ url }), {
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
