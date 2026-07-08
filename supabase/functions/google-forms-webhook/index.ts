// Webhook público para receber respostas do Google Forms (via Apps Script)
// e criar registros digitais no Feed_BPF Custom automaticamente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  token?: string;
  responsavel?: string;
  data_execucao?: string;
  titulo?: string;
  respostas?: Record<string, unknown>;
  form_title?: string;
  submitted_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: Payload = await req.json().catch(() => ({}));
    const token =
      body.token ||
      req.headers.get("x-webhook-token") ||
      new URL(req.url).searchParams.get("token") ||
      "";

    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      return new Response(JSON.stringify({ error: "Token inválido ou ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: modelo, error: mErr } = await supabase
      .from("modelos_empresa")
      .select("id, user_id, empresa_id, nome, pop_codigo, campos, ativo")
      .eq("webhook_token", token)
      .maybeSingle();

    if (mErr || !modelo) {
      return new Response(JSON.stringify({ error: "Modelo não encontrado para este token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (modelo.ativo === false) {
      return new Response(JSON.stringify({ error: "Modelo inativo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const respostas = body.respostas ?? {};
    const dataExec =
      body.data_execucao ||
      (body.submitted_at ? String(body.submitted_at).slice(0, 10) : new Date().toISOString().slice(0, 10));
    const responsavel =
      body.responsavel ||
      (respostas as Record<string, unknown>)["Responsável"] as string ||
      (respostas as Record<string, unknown>)["responsavel"] as string ||
      "Google Forms";
    const titulo =
      body.titulo ||
      body.form_title ||
      `${modelo.nome} — ${dataExec}`;

    // Hash de integridade (SHA-256)
    const payloadStr = JSON.stringify({ modelo_id: modelo.id, respostas, dataExec, responsavel });
    const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payloadStr));
    const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: registro, error: rErr } = await supabase
      .from("registros_customizados")
      .insert({
        user_id: modelo.user_id,
        empresa_id: modelo.empresa_id,
        modelo_id: modelo.id,
        pop_codigo: modelo.pop_codigo,
        titulo,
        responsavel,
        data_execucao: dataExec,
        dados: respostas,
        status: "concluido",
        hash_integridade: hash,
      })
      .select("id")
      .single();

    if (rErr) {
      console.error("Erro ao inserir registro:", rErr);
      return new Response(JSON.stringify({ error: "Falha ao gravar registro", details: rErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, registro_id: registro.id, hash }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("google-forms-webhook error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
