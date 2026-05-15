import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiResponse } from "../_shared/ai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ncs, reclamacoes } = await req.json();

    const systemPrompt = `Você é um especialista em qualidade e BPF (Boas Práticas de Fabricação) para alimentação animal, com profundo conhecimento do Decreto 12.031/2024 e normas do MAPA.

Analise os dados de não conformidades e reclamações de qualidade fornecidos e retorne uma análise estruturada.`;

    const userPrompt = `Analise estes dados e forneça insights acionáveis:

NÃO CONFORMIDADES (${ncs?.length || 0} registros):
${JSON.stringify(ncs?.slice(0, 50) || [], null, 2)}

RECLAMAÇÕES DE QUALIDADE (${reclamacoes?.length || 0} registros):
${JSON.stringify(reclamacoes?.slice(0, 50) || [], null, 2)}

Retorne a análise com as seguintes seções usando tool calling.`;

    const response = await getAiResponse({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      tools: [
        {
          type: "function",
          function: {
            name: "analise_tendencias",
            description: "Retorna análise de tendências de NCs e reclamações",
            parameters: {
              type: "object",
              properties: {
                resumo_geral: { type: "string" },
                padroes_recorrentes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      padrao: { type: "string" },
                      frequencia: { type: "string" },
                      gravidade: { type: "string", enum: ["alta", "media", "baixa"] },
                      setores_afetados: { type: "string" },
                    },
                    required: ["padrao", "frequencia", "gravidade", "setores_afetados"],
                  },
                },
                acoes_preventivas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      acao: { type: "string" },
                      prioridade: { type: "string", enum: ["critica", "alta", "media"] },
                      prazo_sugerido: { type: "string" },
                      pop_relacionado: { type: "string" },
                    },
                    required: ["acao", "prioridade", "prazo_sugerido"],
                  },
                },
                indicadores_risco: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      indicador: { type: "string" },
                      status: { type: "string", enum: ["critico", "atencao", "ok"] },
                      recomendacao: { type: "string" },
                    },
                    required: ["indicador", "status", "recomendacao"],
                  },
                },
              },
              required: ["resumo_geral", "padroes_recorrentes", "acoes_preventivas", "indicadores_risco"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "analise_tendencias" } },
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI service error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const analise = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analise), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analise-tendencias error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
