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

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const adminClient = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) throw new Error("Usuário não autenticado");

    const { empresa_id, produto } = await req.json();
    if (!empresa_id && !produto) throw new Error("empresa_id ou produto é obrigatório");

    // Verifica licença no banco (cobre Admin, Trial e Paddle via webhook)
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

    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
