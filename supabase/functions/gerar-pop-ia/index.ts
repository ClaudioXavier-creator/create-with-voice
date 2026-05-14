import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: exigir usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { codigo_pop, nome_pop, especies, capacidade, equipamentos, observacoes } = await req.json();

    if (!codigo_pop || !nome_pop) {
      return new Response(JSON.stringify({ error: "Código e nome do POP são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um consultor sênior em BPF para fábricas de ração animal, especialista em IN 04/2007, IN 15/2009, IN 17/2017 e Decreto 12.031/2024.

Gere um rascunho COMPLETO de POP (Procedimento Operacional Padrão) personalizado para a fábrica, seguindo a estrutura padrão do MAPA.

Personalize o conteúdo de acordo com:
- Espécies-alvo (aves, suínos, bovinos, aquicultura, equinos, pets)
- Capacidade da fábrica (pequena <50t/dia, média 50-200t, grande >200t)
- Equipamentos disponíveis
- Observações específicas`;

    const userPrompt = `Gere o POP completo:

**Código:** ${codigo_pop}
**Nome:** ${nome_pop}
**Espécies-alvo:** ${especies || "não especificado"}
**Capacidade:** ${capacidade || "não especificado"}
**Equipamentos:** ${equipamentos || "padrão"}
**Observações:** ${observacoes || "nenhuma"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "gerar_pop",
            description: "Retorna um POP completo estruturado",
            parameters: {
              type: "object",
              properties: {
                objetivo: { type: "string", description: "Objetivo do POP (1-2 parágrafos)" },
                campo_aplicacao: { type: "string", description: "Onde e quando o POP se aplica" },
                documentos_referencia: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de normas, ITs e documentos referenciados",
                },
                definicoes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      termo: { type: "string" },
                      definicao: { type: "string" },
                    },
                    required: ["termo", "definicao"],
                  },
                },
                procedimentos: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista numerada de passos detalhados do procedimento",
                },
                monitoramento: {
                  type: "object",
                  properties: {
                    controle: { type: "string" },
                    frequencia: { type: "string" },
                    registro: { type: "string" },
                    responsavel: { type: "string" },
                  },
                  required: ["controle", "frequencia", "registro", "responsavel"],
                },
                verificacao: {
                  type: "object",
                  properties: {
                    controle: { type: "string" },
                    frequencia: { type: "string" },
                    registro: { type: "string" },
                    responsavel: { type: "string" },
                  },
                  required: ["controle", "frequencia", "registro", "responsavel"],
                },
                acoes_corretivas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nao_conformidade: { type: "string" },
                      acao: { type: "string" },
                    },
                    required: ["nao_conformidade", "acao"],
                  },
                },
                tempo_retencao: { type: "string", description: "Ex: 2 anos conforme Decreto 12.031/2024" },
              },
              required: ["objetivo", "campo_aplicacao", "documentos_referencia", "definicoes", "procedimentos", "monitoramento", "verificacao", "acoes_corretivas", "tempo_retencao"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "gerar_pop" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-pop-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
