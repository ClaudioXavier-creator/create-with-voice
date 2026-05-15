import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiResponse } from "../_shared/ai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const bodyText = await req.text();
    const bodyJson = JSON.parse(bodyText);
    const { action, termo, categoria } = bodyJson;

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "buscar_atualizacoes") {
      systemPrompt = `Você é um especialista em legislação brasileira EXCLUSIVAMENTE da área de ALIMENTAÇÃO ANIMAL... (resumido)`;
      userPrompt = `Gere um relatório atualizado sobre a legislação brasileira de ALIMENTAÇÃO ANIMAL do MAPA... (resumido)`;
      // Mantendo prompts originais para consistência
      systemPrompt = `Você é um especialista em legislação brasileira EXCLUSIVAMENTE da área de ALIMENTAÇÃO ANIMAL (nutrição animal, fabricação de rações, suplementos, premix, núcleos e ingredientes para alimentação animal). Seu foco é SOMENTE nas normas do MAPA. NÃO inclua legislação sobre alimentação humana. IMPORTANTE: Responda SEMPRE em formato JSON válido.`;
      userPrompt = `Gere um relatório atualizado sobre a legislação brasileira de ALIMENTAÇÃO ANIMAL do MAPA. Foque EXCLUSIVAMENTE em normas que impactam fábricas de ração animal. Liste de 4 a 8 alertas. Responda APENAS com o JSON, sem markdown ou texto adicional.`;
    } else if (action === "resumo_sistema") {
      systemPrompt = `Você é um consultor especialista em BPF para fábricas de ração animal... (resumido)`;
      userPrompt = `O sistema FeedBPF implementa os seguintes módulos... (resumido)`;
      systemPrompt = `Você é um consultor especialista em BPF para fábricas de ração animal. Analise o sistema de gestão de BPF implementado e avalie a conformidade. Responda SEMPRE em formato JSON.`;
      userPrompt = `O sistema FeedBPF implementa vários módulos (Cadastro, Qualificação, Documentos, Auditoria, etc.). Avalie cada módulo em relação às exigências do MAPA. Identifique gaps e gere recomendações práticas. Responda APENAS com JSON.`;
    } else if (action === "pesquisar_legislacao") {
      const termoBusca = termo || "alimentação animal";
      const categoriaBusca = categoria || "todas";
      systemPrompt = `Você é um especialista em legislação brasileira de ALIMENTAÇÃO ANIMAL do MAPA. Retorne resultados em formato JSON.`;
      userPrompt = `Pesquise legislação brasileira de ALIMENTAÇÃO ANIMAL no MAPA: Termo "${termoBusca}", Categoria "${categoriaBusca}". Liste de 5 a 15 resultados. Responda APENAS com o JSON.`;
    } else {
      throw new Error("Ação inválida");
    }

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
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });


  } catch (e) {
    console.error("legislacao-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});