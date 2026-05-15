import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiResponse } from "../_shared/ai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { descricao, setor } = await req.json();

    if (!descricao || !setor) {
      return new Response(JSON.stringify({ error: "Descrição e setor são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um especialista em BPF (Boas Práticas de Fabricação) para fábricas de ração animal, com profundo conhecimento da IN 04/2007, IN 15/2009 e Decreto 12.031/2024.

Dado uma não conformidade detectada em uma fábrica de ração, gere automaticamente um plano de ação corretiva completo.

Responda SEMPRE em JSON válido com esta estrutura:
{
  "causa": "Análise de causa raiz detalhada usando os 5 Porquês ou Ishikawa.",
  "acao_corretiva": "Ação corretiva detalhada.",
  "responsavel_sugerido": "Cargo/função sugerida",
  "prazo_dias": 7
}`;

    const userPrompt = `Gere um plano de ação corretiva para esta não conformidade:

**Setor:** ${setor}
**Descrição da NC:** ${descricao}

Responda APENAS com o JSON, sem markdown.`;

    const response = await getAiResponse({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI service error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { causa: "Análise pendente", acao_corretiva: content, responsavel_sugerido: "Responsável Técnico", prazo_dias: 7 };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });


  } catch (e) {
    console.error("nc-plano-acao error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});