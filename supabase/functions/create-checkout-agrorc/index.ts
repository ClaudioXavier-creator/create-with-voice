import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  AGRO_RC_PRICES,
  AGROGESTAO_PRICES,
  ProductMap,
} from "../_shared/paddle-prices.ts";
import { createPaddleCheckout } from "../_shared/paddle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_MAPS: Record<string, ProductMap> = {
  agrorc: AGRO_RC_PRICES,
  agrogestao: AGROGESTAO_PRICES,
  // NutriCRM compartilha o catálogo do AgroGestão no Paddle
  nutricrm: AGROGESTAO_PRICES,
};

const TIPO_ALIASES: Record<string, string> = {
  individual: "empresa",
  grupo10: "gestor10",
  grupo20: "consultor20",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  console.log("[create-checkout-agrorc] invoked", req.method, req.url);

  // TEMP probe: validar gateway Paddle sem precisar de auth de usuário
  const url = new URL(req.url);
  if (url.searchParams.get("probe") === "1") {
    try {
      const { paddleGatewayFetch, getPaddleEnv } = await import("../_shared/paddle.ts");
      const env = getPaddleEnv();
      const res = await paddleGatewayFetch(env, "/products?per_page=1");
      const body = await res.text();
      return new Response(JSON.stringify({ env, status: res.status, body: body.slice(0, 600) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ probeError: (e as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    let user: { id: string; email: string } | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data?.user?.email) user = { id: data.user.id, email: data.user.email };
    }
    if (!user) throw new Error("Usuário não autenticado");

    const body = await req.json().catch(() => ({}));
    const product = (body.produto || "agrorc").toLowerCase();
    let tipoKey = (body.tipo || "empresa").toLowerCase();
    tipoKey = TIPO_ALIASES[tipoKey] || tipoKey;
    const planoKey = (body.plano || "mensal").toLowerCase();

    const pricesMap = PRODUCT_MAPS[product] || AGRO_RC_PRICES;
    const tipoPrices = pricesMap[tipoKey];
    if (!tipoPrices) throw new Error(`Tipo inválido: ${tipoKey}`);
    const priceConfig = tipoPrices[planoKey as keyof typeof tipoPrices];
    if (!priceConfig) throw new Error(`Plano inválido: ${planoKey}`);

    const origin = req.headers.get("origin") || "https://bpfconsult.com.br";

    const url = await createPaddleCheckout({
      priceId: priceConfig.id,
      customerEmail: user.email,
      customData: { produto: product, tipo: tipoKey, plano: planoKey, user_id: user.id },
      successUrl: `${origin}/${product}?checkout=success`,
      cancelUrl: `${origin}/${product}?checkout=canceled`,
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
