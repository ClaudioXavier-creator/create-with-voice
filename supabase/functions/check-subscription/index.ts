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
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const adminClient = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) throw new Error("Usuário não autenticado");

    const { empresa_id } = await req.json();
    if (!empresa_id) throw new Error("empresa_id é obrigatório");

    // Check if admin has manually granted access
    const { data: licenca } = await adminClient
      .from("licencas")
      .select("*")
      .eq("empresa_id", empresa_id)
      .maybeSingle();

    if (licenca?.liberado_admin && licenca?.status === "ativa") {
      return new Response(JSON.stringify({
        subscribed: true,
        source: "admin",
        plano: licenca.plano,
        subscription_end: licenca.data_expiracao,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    // Find subscription with matching empresa_id in metadata
    const matching = subscriptions.data.find(
      (sub) => sub.metadata?.empresa_id === empresa_id
    );

    if (matching) {
      const subscriptionEnd = new Date(matching.current_period_end * 1000).toISOString();

      // Update local license
      if (licenca) {
        await adminClient
          .from("licencas")
          .update({
            status: "ativa",
            data_expiracao: subscriptionEnd.split("T")[0],
            stripe_customer_id: customerId,
          })
          .eq("id", licenca.id);
      }

      return new Response(JSON.stringify({
        subscribed: true,
        source: "stripe",
        subscription_end: subscriptionEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if local license is still valid (trial)
    if (licenca && licenca.status === "ativa" && new Date(licenca.data_expiracao) > new Date()) {
      return new Response(JSON.stringify({
        subscribed: true,
        source: "trial",
        plano: licenca.plano,
        subscription_end: licenca.data_expiracao,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
