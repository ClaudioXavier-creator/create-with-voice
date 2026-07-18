import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-export-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < ae.length; i++) diff |= ae[i] ^ be[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const expected = Deno.env.get("STORAGE_EXPORT_TOKEN");
    if (!expected) {
      return new Response(JSON.stringify({ error: "Token não configurado no servidor" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provided =
      req.headers.get("x-export-token") ??
      (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");

    if (!provided || !timingSafeEqual(provided, expected)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "export";

    // Lista todos os usuários paginando
    const users: any[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < perPage) break;
      page++;
    }

    // identities já vêm em user.identities (contém provider, provider_id, identity_data)
    // Mas listUsers NÃO retorna encrypted_password. Precisamos ler a tabela auth.users.
    // Usamos SQL via PostgREST não é possível no schema auth; então usamos rpc?
    // Alternativa: usar admin.auth.admin.getUserById que também não retorna hash.
    // Solução: expor via função SQL security definer temporária OU usar o endpoint /auth/v1/admin
    // que também NÃO retorna hash.
    //
    // Truque suportado: pg_dump não disponível; então usamos direct fetch ao endpoint interno
    // do PostgREST no schema `auth` via service_role — mas por padrão PostgREST só expõe `public`.
    //
    // Última opção: chamar via Postgres através do supabase-js usando .rpc numa função
    // security definer. Vamos criar/usar rpc `_export_auth_users` que retorna JSON.

    const { data: dbRows, error: dbErr } = await admin.rpc("_export_auth_users_full");
    if (dbErr) {
      // Se a função não existe, retorna apenas dados públicos + aviso
      return new Response(JSON.stringify({
        warning: "Função _export_auth_users_full não encontrada. Rode a migração primeiro.",
        rpc_error: dbErr.message,
        users_without_hash: users.map((u) => ({
          id: u.id,
          email: u.email,
          email_confirmed_at: u.email_confirmed_at,
          created_at: u.created_at,
          raw_user_meta_data: u.user_metadata,
          raw_app_meta_data: u.app_metadata,
          identities: u.identities ?? [],
        })),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "summary") {
      const providers: Record<string, number> = {};
      let googleCount = 0, emailCount = 0;
      for (const u of dbRows as any[]) {
        for (const id of (u.identities ?? [])) {
          providers[id.provider] = (providers[id.provider] ?? 0) + 1;
          if (id.provider === "google") googleCount++;
          if (id.provider === "email") emailCount++;
        }
      }
      return new Response(JSON.stringify({
        total_users: (dbRows as any[]).length,
        providers,
        google_users: googleCount,
        email_users: emailCount,
      }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(dbRows, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="auth-users.json"',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
