import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { senha } = await req.json();
    if (!senha || typeof senha !== "string" || senha.length > 200) {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: senhas } = await supabaseAdmin
      .from("modelos_acesso")
      .select("id, senha_hash")
      .eq("ativa", true);

    if (!senhas || senhas.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma senha configurada" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let match = false;
    for (const row of senhas as any[]) {
      const stored: string = row.senha_hash || "";
      // Senhas bcrypt começam com $2a$, $2b$ ou $2y$
      if (/^\$2[aby]\$/.test(stored)) {
        try {
          if (await bcrypt.compare(senha, stored)) { match = true; break; }
        } catch { /* ignore */ }
      } else {
        // Compatibilidade legada (texto plano): valida em tempo constante
        // e migra automaticamente para bcrypt em caso de sucesso.
        if (timingSafeEqualStr(stored, senha)) {
          match = true;
          try {
            const newHash = await bcrypt.hash(senha);
            await supabaseAdmin
              .from("modelos_acesso")
              .update({ senha_hash: newHash })
              .eq("id", row.id);
          } catch { /* não bloqueia o login se o upgrade falhar */ }
          break;
        }
      }
    }

    if (!match) {
      return new Response(JSON.stringify({ error: "Senha incorreta" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
