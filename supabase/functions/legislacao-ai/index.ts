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

    const { action } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "buscar_atualizacoes") {
      systemPrompt = `Você é um especialista em legislação brasileira de nutrição animal, BPF (Boas Práticas de Fabricação) e regulamentação do MAPA (Ministério da Agricultura e Pecuária).
Seu papel é informar sobre atualizações legislativas relevantes para fábricas de ração animal.

IMPORTANTE: Responda SEMPRE em formato JSON válido com a seguinte estrutura:
{
  "alertas": [
    {
      "titulo": "Título da atualização ou normativa",
      "resumo": "Resumo claro e objetivo da mudança ou novidade",
      "fonte": "Referência legal (ex: IN 04/2007, Decreto 12.031/2024)",
      "tipo": "atualizacao | nova_norma | revogacao | alerta",
      "relevancia": "alta | media | baixa",
      "data_aproximada": "YYYY-MM-DD"
    }
  ],
  "resumo_geral": "Um parágrafo resumindo o panorama regulatório atual"
}`;

      userPrompt = `Gere informações atualizadas sobre a legislação brasileira de nutrição animal e BPF para fábricas de ração. Considere:

1. Decreto 12.031/2024 e suas implicações
2. IN 04/2007 (POPs obrigatórios)
3. IN 15/2009 (Regulamento técnico)
4. IN 17/2017 (Estabelecimentos fabricantes)
5. Quaisquer outras normas relevantes do MAPA para nutrição animal

Liste de 3 a 6 alertas relevantes com atualizações, mudanças ou pontos de atenção que fábricas de ração devem observar. Inclua tanto normas vigentes importantes quanto tendências regulatórias.

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

    } else if (action === "resumo_sistema") {
      systemPrompt = `Você é um consultor de BPF para fábricas de ração animal. Analise o que foi implementado em um sistema de gestão de BPF e gere um resumo executivo.
Responda SEMPRE em formato JSON:
{
  "modulos_implementados": [
    { "modulo": "Nome", "descricao": "O que faz", "status": "completo | parcial" }
  ],
  "resumo_executivo": "Parágrafo resumindo o estado do sistema",
  "recomendacoes": ["Recomendação 1", "Recomendação 2"]
}`;

      userPrompt = `O sistema FeedBPF implementa os seguintes módulos para gestão de BPF em fábricas de ração animal:

1. **Cadastro de Empresa** - Dados da fábrica, CNPJ, RT, CRMV, capacidade
2. **Documentos/POPs** - Controle de documentos com versionamento (9 POPs obrigatórios da IN 04/2007)
3. **Execução de ITs/POPs** - Registro de execuções com alertas de periodicidade
4. **Auditoria BPF** - Checklist baseado no Decreto 12.031/2024 com 8 áreas
5. **Não Conformidades** - Registro, causa raiz, ação corretiva, prazos
6. **Recebimento de MP** - Controle de qualidade (odor, umidade, insetos), aprovação
7. **PCP / Ordens de Produção** - Ordens com fórmulas, ingredientes com lotes de MP, batidas com tempo de mistura
8. **Rastreabilidade** - Vínculo automático MP→PA→Cliente, sistema de Recall
9. **Controle de Pragas** - Registro de ocorrências e ações
10. **Treinamentos** - Registro com validade
11. **Indicadores** - Dashboard com gráficos
12. **Relatórios** - Geração de relatórios por módulo

Gere o resumo executivo. Responda APENAS com JSON.`;
    } else {
      throw new Error("Ação inválida");
    }

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed;
    try {
      // Remove markdown code fences if present
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
