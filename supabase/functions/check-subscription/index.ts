import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const adminClient = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) throw new Error("Usuário não autenticado");

    const { empresa_id, produto } = await req.json();
    if (!empresa_id && !produto) throw new Error("empresa_id ou produto é obrigatório");

    // 1. Verificar licença no banco de dados (abrange Admin, Trial e Paddle via Webhook)
    let dbQuery = adminClient
      .from("licencas")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativa");
    
    if (empresa_id) dbQuery = dbQuery.eq("empresa_id", empresa_id);
    if (produto) dbQuery = dbQuery.eq("produto", produto);
    
    const { data: licenca } = await dbQuery.maybeSingle();

    if (licenca) {
      const expDate = new Date(licenca.data_expiracao);
      if (expDate > new Date()) {
        return new Response(JSON.stringify({
          subscribed: true,
          source: licenca.liberado_admin ? "admin" : (licenca.plano === "trial" ? "trial" : "database"),
          plano: licenca.plano,
          nivel: licenca.nivel,
          subscription_end: licenca.data_expiracao,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Fallback para Stripe (legado ou contas específicas)
    if (stripeKey && user.email) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
          });

          // Se tiver empresa_id, tenta encontrar o match no metadata do Stripe
          const matching = empresa_id 
            ? subscriptions.data.find((sub) => sub.metadata?.empresa_id === empresa_id)
            : subscriptions.data[0];

          if (matching) {
            const subscriptionEnd = new Date(matching.current_period_end * 1000).toISOString();
            return new Response(JSON.stringify({
              subscribed: true,
              source: "stripe",
              subscription_end: subscriptionEnd,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (e) {
        console.error("Stripe check error (silent):", e.message);
      }
    }

    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
