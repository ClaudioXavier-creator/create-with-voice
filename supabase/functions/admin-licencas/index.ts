import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin via user_roles
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    if (action === "list") {
      // List all licenses with empresa info
      const { data: licenses, error } = await adminClient
        .from("licencas")
        .select("*, empresas(nome)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get user emails
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;

      const enriched = (licenses || []).map((lic: any) => {
        const authUser = authUsers?.find((u: any) => u.id === lic.user_id);
        return {
          ...lic,
          email: authUser?.email || "—",
          empresa_nome: lic.empresas?.nome || "—",
        };
      });

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grant") {
      const { empresa_id, dias } = params;
      if (!empresa_id || !dias) throw new Error("empresa_id e dias são obrigatórios");

      const planoMap: Record<number, string> = {
        30: "trial",
        90: "3_meses",
        180: "6_meses",
        365: "1_ano",
      };

      const now = new Date();
      const expDate = new Date(now);
      expDate.setDate(expDate.getDate() + Number(dias));

      const chave = `ADM-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

      // Get empresa owner
      const { data: empresa } = await adminClient
        .from("empresas")
        .select("user_id")
        .eq("id", empresa_id)
        .single();

      if (!empresa) throw new Error("Empresa não encontrada");

      // Check existing license for this empresa
      const { data: existing } = await adminClient
        .from("licencas")
        .select("id")
        .eq("empresa_id", empresa_id)
        .maybeSingle();

      if (existing) {
        const { error } = await adminClient
          .from("licencas")
          .update({
            plano: planoMap[Number(dias)] || `${dias}_dias`,
            data_inicio: now.toISOString().split("T")[0],
            data_expiracao: expDate.toISOString().split("T")[0],
            status: "ativa",
            chave_licenca: chave,
            liberado_admin: true,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await adminClient.from("licencas").insert({
          user_id: empresa.user_id,
          empresa_id,
          chave_licenca: chave,
          plano: planoMap[Number(dias)] || `${dias}_dias`,
          data_inicio: now.toISOString().split("T")[0],
          data_expiracao: expDate.toISOString().split("T")[0],
          status: "ativa",
          liberado_admin: true,
        });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const { empresa_id } = params;
      if (!empresa_id) throw new Error("empresa_id é obrigatório");

      const { error } = await adminClient
        .from("licencas")
        .update({
          status: "revogada",
          data_expiracao: new Date().toISOString().split("T")[0],
          liberado_admin: false,
        })
        .eq("empresa_id", empresa_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
