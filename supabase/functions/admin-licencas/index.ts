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
      const { empresa_id, dias, licenca_id, user_id: targetUserId } = params;
      if (!dias) throw new Error("dias é obrigatório");
      if (!empresa_id && !licenca_id && !targetUserId) throw new Error("empresa_id, licenca_id ou user_id é obrigatório");

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

      let ownerUserId: string | null = targetUserId || null;
      if (empresa_id && !ownerUserId) {
        const { data: empresa } = await adminClient
          .from("empresas")
          .select("user_id")
          .eq("id", empresa_id)
          .single();
        if (!empresa) throw new Error("Empresa não encontrada");
        ownerUserId = empresa.user_id;
      }

      // Find existing license: by id, by empresa_id, or by user_id with null empresa
      let existing: { id: string } | null = null;
      if (licenca_id) {
        existing = { id: licenca_id };
      } else if (empresa_id) {
        const { data } = await adminClient.from("licencas").select("id").eq("empresa_id", empresa_id).maybeSingle();
        existing = data;
      } else if (ownerUserId) {
        const { data } = await adminClient
          .from("licencas")
          .select("id")
          .eq("user_id", ownerUserId)
          .is("empresa_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        existing = data;
      }

      const updatePayload = {
        plano: planoMap[Number(dias)] || `${dias}_dias`,
        data_inicio: now.toISOString().split("T")[0],
        data_expiracao: expDate.toISOString().split("T")[0],
        status: "ativa",
        chave_licenca: chave,
        liberado_admin: true,
      };

      if (existing) {
        const { error } = await adminClient.from("licencas").update(updatePayload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await adminClient.from("licencas").insert({
          user_id: ownerUserId,
          empresa_id: empresa_id || null,
          ...updatePayload,
        });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const { empresa_id, licenca_id, force } = params;
      if (!empresa_id && !licenca_id) throw new Error("empresa_id ou licenca_id é obrigatório");

      // Buscar licença para verificar assinatura Stripe ativa paga
      const { data: licencaAtual } = licenca_id
        ? await adminClient.from("licencas").select("*").eq("id", licenca_id).maybeSingle()
        : await adminClient.from("licencas").select("*").eq("empresa_id", empresa_id).maybeSingle();

      // Bloquear revogação se houver assinatura Stripe ativa e paga (não liberada manualmente)
      const temStripeAtivo =
        licencaAtual?.stripe_subscription_id &&
        licencaAtual?.status === "ativa" &&
        !licencaAtual?.liberado_admin &&
        new Date(licencaAtual.data_expiracao) > new Date();

      if (temStripeAtivo && !force) {
        return new Response(
          JSON.stringify({
            error:
              "Esta licença possui assinatura Stripe ativa e paga. Não é possível revogar enquanto o pagamento estiver vigente. Cancele a assinatura no Stripe primeiro.",
            stripe_protected: true,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData = {
        status: "revogada",
        data_expiracao: new Date().toISOString().split("T")[0],
        liberado_admin: false,
      };

      const query = adminClient.from("licencas").update(updateData);
      const { error } = licenca_id
        ? await query.eq("id", licenca_id)
        : await query.eq("empresa_id", empresa_id);

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
