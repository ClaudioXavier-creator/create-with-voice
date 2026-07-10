import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { FEED_BPF_PRICES as PLAN_PRICES } from "../_shared/paddle-prices.ts";
import { createPaddleCheckout } from "../_shared/paddle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NIVEL_ALIASES: Record<string, string> = {
  entrada: "standard",
  intermediario: "intermediaria",
  avancado: "premium",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let user: { id: string; email: string } | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user?.email) user = { id: data.user.id, email: data.user.email };
    }
    if (!user) throw new Error("Usuário não autenticado");

    const { empresa_id, plano, nivel, produto } = await req.json();
    if (!empresa_id) throw new Error("empresa_id é obrigatório");

    let nivelKey = (nivel || "standard").toLowerCase();
    nivelKey = NIVEL_ALIASES[nivelKey] || nivelKey;
    const planoKey = (plano || "mensal").toLowerCase();
    const produtoKey = (produto || "feedbpf").toLowerCase() === "feedbpfcustom"
      ? "feedbpfcustom"
      : "feedbpf";

    const nivelPrices = PLAN_PRICES[nivelKey];
    if (!nivelPrices) throw new Error(`Nível inválido: ${nivelKey}`);
    const priceConfig = nivelPrices[planoKey as keyof typeof nivelPrices];
    if (!priceConfig) throw new Error(`Plano inválido: ${planoKey}`);

    const origin = req.headers.get("origin") || "https://bpfconsult.com.br";
    const successBase = produtoKey === "feedbpfcustom" ? "/feedbpf-custom/acervo" : "/dashboard";

    const url = await createPaddleCheckout({
      priceId: priceConfig.id,
      customerEmail: user.email,
      customData: {
        produto: produtoKey,
        empresa_id,
        user_id: user.id,
        plano: planoKey,
        nivel: nivelKey,
      },
      successUrl: `${origin}${successBase}?checkout=success&empresa_id=${empresa_id}`,
      cancelUrl: `${origin}${successBase}?checkout=canceled&empresa_id=${empresa_id}`,
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
