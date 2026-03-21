import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chave } = await req.json();
    if (!chave) {
      return new Response(JSON.stringify({ error: "Chave não informada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Find unused license key
    // Find available license: user_id is null AND status is "disponivel"
    const { data: licenseRow } = await adminClient
      .from("licencas")
      .select("*")
      .eq("chave_licenca", chave)
      .is("user_id", null)
      .eq("status", "disponivel")
      .maybeSingle();

    // Also check if key exists but already assigned
    if (!licenseRow) {
      const { data: existing } = await adminClient
        .from("licencas")
        .select("user_id")
        .eq("chave_licenca", chave)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "Esta chave já foi utilizada" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Chave inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign license to user
    const { error: updateErr } = await adminClient
      .from("licencas")
      .update({
        user_id: user.id,
        status: "ativa",
        data_inicio: new Date().toISOString().split("T")[0],
      })
      .eq("id", licenseRow.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Erro ao ativar licença" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, plano: licenseRow.plano, expira: licenseRow.data_expiracao }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
