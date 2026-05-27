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

    const isSuperAdminEmail = user.email?.toLowerCase() === "claudiolx.nunes@gmail.com";

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData && !isSuperAdminEmail) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { produto: filterProduto } = params;
      let licenseQuery = adminClient
        .from("licencas")
        .select("*, empresas(nome)")
        .order("created_at", { ascending: false });
      
      if (filterProduto) {
        licenseQuery = licenseQuery.eq("produto", filterProduto.toLowerCase());
      }

      const [licensesRes, vinculosRes, authUsersRes] = await Promise.all([
        licenseQuery,
        adminClient
          .from("licenca_empresas")
          .select("id, ativo, excedente, vinculado_em, desvinculado_em, empresa_id, licenca_id, user_id, stripe_invoice_id, empresas(nome), licencas(*)")
          .order("vinculado_em", { ascending: false }),
        adminClient.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      if (licensesRes.error) throw licensesRes.error;
      if (vinculosRes.error) throw vinculosRes.error;
      if (authUsersRes.error) throw authUsersRes.error;

      const authUsers = authUsersRes.data.users || [];

      const diretas = (licensesRes.data || []).map((lic: any) => {
        const authUser = authUsers.find((u: any) => u.id === lic.user_id);
        return {
          ...lic,
          email: authUser?.email || "—",
          empresa_nome: lic.empresas?.nome || "—",
          origem: "direta",
        };
      });

      const consultor = (vinculosRes.data || []).map((vinculo: any) => {
        const lic = vinculo.licencas || {};
        const authUser = authUsers.find((u: any) => u.id === lic.user_id || u.id === vinculo.user_id);

        return {
          id: vinculo.id,
          user_id: lic.user_id || vinculo.user_id,
          empresa_id: vinculo.empresa_id,
          email: authUser?.email || "—",
          empresa_nome: vinculo.empresas?.nome || "—",
          produto: lic.produto,
          plano: lic.plano || "consultor",
          status: vinculo.ativo ? lic.status || "ativa" : "revogada",
          data_inicio: lic.data_inicio || vinculo.vinculado_em,
          data_expiracao: lic.data_expiracao,
          liberado_admin: lic.liberado_admin || false,
          nivel: lic.nivel || null,
          origem: "consultor",
          licenca_id: vinculo.licenca_id,
          excedente: vinculo.excedente || false,
          ativo: vinculo.ativo,
        };
      });

      let result = [...consultor, ...diretas];
      if (filterProduto) {
        result = result.filter(r => r.produto?.toLowerCase() === filterProduto.toLowerCase());
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, produto, empresa_id, dias, nivel } = params;
      if (!email) throw new Error("email é obrigatório");
      if (!produto) throw new Error("produto é obrigatório");
      if (!dias) throw new Error("dias é obrigatório");

      // Find user by email
      const allUsers = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const target = (allUsers.data.users || []).find(
        (u: any) => u.email?.toLowerCase() === String(email).toLowerCase()
      );
      if (!target) throw new Error("Usuário não encontrado para este e-mail");

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

      const normalizedNivel = typeof nivel === "string" && ["entrada", "intermediario", "avancado"].includes(nivel.toLowerCase())
        ? nivel.toLowerCase()
        : "entrada";

      const normalizedProduto = String(produto).toLowerCase();

      // Check duplicate
      let existsQuery = adminClient
        .from("licencas")
        .select("id")
        .eq("user_id", target.id)
        .eq("produto", normalizedProduto);
      existsQuery = empresa_id ? existsQuery.eq("empresa_id", empresa_id) : existsQuery.is("empresa_id", null);
      const { data: existsRow } = await existsQuery.maybeSingle();
      if (existsRow) {
        throw new Error("Já existe uma licença deste produto para o usuário/empresa selecionado");
      }

      const { error } = await adminClient.from("licencas").insert({
        user_id: target.id,
        empresa_id: empresa_id || null,
        produto: normalizedProduto,
        plano: planoMap[Number(dias)] || `${dias}_dias`,
        nivel: normalizedNivel,
        data_inicio: now.toISOString().split("T")[0],
        data_expiracao: expDate.toISOString().split("T")[0],
        status: "ativa",
        chave_licenca: chave,
        liberado_admin: true,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grant") {
      const { empresa_id, dias, licenca_id, user_id: targetUserId, nivel } = params;
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

      const normalizedNivel = typeof nivel === "string" && ["entrada", "intermediario", "avancado"].includes(nivel.toLowerCase())
        ? nivel.toLowerCase()
        : undefined;

      const updatePayload = {
        plano: planoMap[Number(dias)] || `${dias}_dias`,
        ...(normalizedNivel ? { nivel: normalizedNivel } : {}),
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

    if (action === "update_level") {
      const { empresa_id, licenca_id, nivel } = params;
      if (!empresa_id && !licenca_id) throw new Error("empresa_id ou licenca_id é obrigatório");
      if (!nivel) throw new Error("nivel é obrigatório");

      const normalizedNivel = String(nivel).toLowerCase();
      if (!["entrada", "intermediario", "avancado"].includes(normalizedNivel)) {
        throw new Error("Nível inválido. Use entrada, intermediario ou avancado");
      }

      const query = adminClient.from("licencas").update({ nivel: normalizedNivel, updated_at: new Date().toISOString() });
      const { error } = licenca_id
        ? await query.eq("id", licenca_id)
        : await query.eq("empresa_id", empresa_id);

      if (error) throw error;

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
        (licencaAtual?.stripe_subscription_id || licencaAtual?.stripe_customer_id) &&
        licencaAtual?.status === "ativa" &&
        !licencaAtual?.liberado_admin &&
        new Date(licencaAtual.data_expiracao) > new Date();

      if (temStripeAtivo && !force) {
        return new Response(
          JSON.stringify({
            error:
              "Esta licença possui uma assinatura ativa (Stripe/Paddle). Não é possível revogar enquanto o pagamento estiver vigente. Cancele a assinatura no provedor primeiro ou use 'Forçar Revogação'.",
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
