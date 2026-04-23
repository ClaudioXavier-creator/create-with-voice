import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { etapa_processo, perigo_identificado, tipo_perigo } = await req.json();

    if (!etapa_processo || !perigo_identificado) {
      return new Response(JSON.stringify({ error: "Etapa e perigo são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um especialista em APPCC/HACCP para fábricas de ração animal, com base nas normas IN 04/2007, IN 15/2009, Codex Alimentarius e Decreto 12.031/2024.

Dado um perigo identificado em uma etapa do processo, classifique:
- Probabilidade: "Baixa", "Média" ou "Alta"
- Severidade: "Baixa", "Média" ou "Alta"
- Nível de risco resultante (matriz 3x3): "Baixo", "Médio", "Alto" ou "Crítico"
- Medidas de controle preventivas e corretivas

Considere:
- Perigos químicos (ractopamina, micotoxinas, contaminação cruzada): geralmente alta severidade
- Perigos físicos (metais, vidros): severidade média a alta
- Perigos biológicos (Salmonella, E.coli): alta severidade em produtos para aves/suínos
- Etapas críticas (mistura, peletização): maior probabilidade de contaminação`;

    const userPrompt = `Classifique este perigo APPCC:

**Etapa do processo:** ${etapa_processo}
**Perigo identificado:** ${perigo_identificado}
**Tipo de perigo:** ${tipo_perigo || "Não especificado"}`;

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
            name: "classificar_risco",
            description: "Retorna a classificação de risco APPCC",
            parameters: {
              type: "object",
              properties: {
                probabilidade: { type: "string", enum: ["Baixa", "Média", "Alta"] },
                severidade: { type: "string", enum: ["Baixa", "Média", "Alta"] },
                nivel_risco: { type: "string", enum: ["Baixo", "Médio", "Alto", "Crítico"] },
                medidas_controle: { type: "string", description: "Medidas preventivas e corretivas detalhadas" },
                justificativa: { type: "string", description: "Breve justificativa técnica da classificação" },
              },
              required: ["probabilidade", "severidade", "nivel_risco", "medidas_controle", "justificativa"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classificar_risco" } },
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
    console.error("classificar-risco error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
