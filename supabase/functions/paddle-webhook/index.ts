import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // TODO: Verify Paddle signature here in production
    // For now, we trust the payload if the PADDLE_WEBHOOK_SECRET is set or similar
    // Actually, Paddle sends a POST with a JSON body

    const body = await req.json();
    console.log("Paddle Webhook received:", JSON.stringify(body));

    const eventType = body.event_type;
    const data = body.data;

    if (eventType === "transaction.completed" || eventType === "subscription.created" || eventType === "subscription.updated") {
      const customData = data.custom_data || {};
      const userId = customData.user_id;
      const empresaId = customData.empresa_id;
      const produto = customData.produto;
      const plano = customData.plano;
      const nivel = customData.nivel || customData.tipo; // Suporta ambos os nomes de campo

      if (!userId || !produto) {
        console.error("Webhook missing custom_data fields:", { userId, produto, empresaId });
        return new Response(JSON.stringify({ error: "Missing metadata" }), { status: 200 });
      }

      // Calcular data de expiração
      const now = new Date();
      const expDate = new Date(now);
      if (plano === "mensal") expDate.setMonth(expDate.getMonth() + 1);
      else if (plano === "semestral") expDate.setMonth(expDate.getMonth() + 6);
      else if (plano === "anual") expDate.setFullYear(expDate.getFullYear() + 1);
      else expDate.setMonth(expDate.setMonth() + 1); // Default 1 mês

      // Update or insert license
      const { data: existing } = await adminClient
        .from("licencas")
        .select("id")
        .eq("user_id", userId)
        .eq("produto", produto)
        .eq("empresa_id", empresaId || null)
        .maybeSingle();

      const licenseData = {
        user_id: userId,
        empresa_id: empresaId || null,
        produto: produto,
        plano: plano,
        nivel: nivel,
        status: "ativa",
        data_inicio: now.toISOString().split("T")[0],
        data_expiracao: expDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
        // Guardar IDs do Paddle para referência futura
        stripe_subscription_id: data.subscription_id || null, // Reutilizando coluna por enquanto
        stripe_customer_id: data.customer_id || null,
      };

      if (existing) {
        await adminClient.from("licencas").update(licenseData).eq("id", existing.id);
      } else {
        await adminClient.from("licencas").insert({
          ...licenseData,
          chave_licenca: `PAD-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`,
        });
      }

      console.log(`License updated/created for user ${userId}, product ${produto}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
