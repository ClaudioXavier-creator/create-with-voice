import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) throw new Error("Não autenticado");

    const admin = createClient(supabaseUrl, service);

    // Bloqueia se já existe Trial Consultor Audits ativo deste user
    const { data: existing } = await admin
      .from("licencas")
      .select("id")
      .eq("user_id", user.id)
      .eq("produto", "audits_bpf")
      .eq("nivel", "consultor")
      .eq("plano", "trial")
      .gte("data_expiracao", new Date().toISOString().slice(0, 10))
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ ok: false, error: "Você já possui um trial Consultor ativo." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const inicio = new Date();
    const expira = new Date(); expira.setDate(expira.getDate() + 7);
    const chave = "TRIAL-CONSULTOR-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();

    const { data: lic, error: lerr } = await admin
      .from("licencas")
      .insert({
        user_id: user.id,
        chave_licenca: chave,
        plano: "trial",
        produto: "audits_bpf",
        nivel: "consultor",
        slots_max: 10,
        slots_usados: 0,
        data_inicio: inicio.toISOString().slice(0, 10),
        data_expiracao: expira.toISOString().slice(0, 10),
        status: "ativa",
      })
      .select()
      .single();

    if (lerr) throw lerr;

    return new Response(JSON.stringify({ ok: true, licenca: lic }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
