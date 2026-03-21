import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_DAYS: Record<string, number> = {
  "3_meses": 90,
  "6_meses": 180,
  "1_ano": 365,
  trial: 30,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple admin auth via secret header
    const adminSecret = req.headers.get("x-admin-secret");
    const expectedSecret = Deno.env.get("ADMIN_LICENSE_SECRET");
    
    if (!expectedSecret || adminSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plano, quantidade = 1 } = await req.json();

    if (!plano || !PLAN_DAYS[plano]) {
      return new Response(
        JSON.stringify({ error: "Plano inválido. Use: 3_meses, 6_meses, 1_ano, trial" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const days = PLAN_DAYS[plano];
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const keys: string[] = [];
    for (let i = 0; i < Math.min(quantidade, 50); i++) {
      const prefix = plano === "trial" ? "TRIAL" : "LIC";
      const randomPart = crypto.randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase();
      const key = `${prefix}-${randomPart}`;

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);

      const { error } = await adminClient.from("licencas").insert({
        chave_licenca: key,
        plano,
        data_expiracao: expDate.toISOString().split("T")[0],
        status: "disponivel",
        user_id: null,
      } as any);

      if (!error) keys.push(key);
    }

    return new Response(
      JSON.stringify({ success: true, plano, chaves: keys }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
