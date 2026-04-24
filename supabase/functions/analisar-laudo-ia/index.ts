// Edge function: analisa laudo laboratorial e retorna parecer técnico + ações corretivas
// Usa Lovable AI Gateway (gemini-2.5-flash) com tool calling para output estruturado.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  tipo_analise?: string;
  produto?: string;
  lote?: string;
  parametro?: string;
  resultado?: string;
  unidade?: string;
  limite_referencia?: string;
  laboratorio?: string;
  metodo?: string;
  observacoes?: string;
  pdf_base64?: string; // PDF inteiro em base64 (opcional)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const body: RequestBody = await req.json();

    const contexto = `
DADOS DO LAUDO INFORMADOS PELO USUÁRIO:
- Tipo de análise: ${body.tipo_analise || "não informado"}
- Produto: ${body.produto || "não informado"}
- Lote: ${body.lote || "não informado"}
- Parâmetro: ${body.parametro || "não informado"}
- Resultado: ${body.resultado || "não informado"} ${body.unidade || ""}
- Limite de referência: ${body.limite_referencia || "não informado"}
- Laboratório: ${body.laboratorio || "não informado"}
- Método: ${body.metodo || "não informado"}
- Observações: ${body.observacoes || "—"}
`.trim();

    const systemPrompt = `Você é um especialista em qualidade de fábricas de ração animal e legislação MAPA (IN 04/2007, IN 13/2004, IN 15/2009, RDC ANVISA, Decreto 12.031/2024).
Analise o laudo laboratorial e produza um parecer técnico objetivo, classificando a conformidade e sugerindo ações corretivas concretas conforme APPCC/HACCP.
Use linguagem técnica brasileira, cite a normativa quando aplicável, e seja conciso.
${body.pdf_base64 ? "O PDF do laudo original foi anexado — extraia também os dados relevantes dele (parâmetros, métodos, valores, datas) e considere-os no parecer." : ""}`;

    // Monta mensagem do usuário (texto + opcionalmente PDF como image_url base64 para multimodal)
    const userContent: any[] = [{ type: "text", text: contexto }];
    if (body.pdf_base64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${body.pdf_base64}` },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emitir_parecer_laudo",
              description: "Emite parecer técnico estruturado sobre o laudo laboratorial.",
              parameters: {
                type: "object",
                properties: {
                  conforme: {
                    type: "boolean",
                    description: "true se o resultado está conforme o limite legal/referência; false caso contrário.",
                  },
                  classificacao_risco: {
                    type: "string",
                    enum: ["baixo", "medio", "alto", "critico"],
                    description: "Risco sanitário do desvio (baixo se conforme).",
                  },
                  parecer_tecnico: {
                    type: "string",
                    description: "Parecer técnico em 2-4 parágrafos: interpretação do resultado, comparação com limite legal, citação da normativa MAPA aplicável e impacto sanitário.",
                  },
                  causa_provavel: {
                    type: "string",
                    description: "Causa raiz mais provável do desvio (vazio se conforme).",
                  },
                  acoes_corretivas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de ações corretivas concretas e objetivas (3-6 itens). Vazia se conforme.",
                  },
                  prazo_recomendado_dias: {
                    type: "integer",
                    description: "Prazo recomendado em dias para correção (0 se conforme).",
                  },
                  setor_responsavel: {
                    type: "string",
                    description: "Setor sugerido como responsável (ex: Recebimento, Produção, Controle de Qualidade, Manutenção, Limpeza).",
                  },
                  referencia_legal: {
                    type: "string",
                    description: "Normativa principal aplicável (ex: 'IN 15/2009 MAPA - Anexo II').",
                  },
                },
                required: [
                  "conforme",
                  "classificacao_risco",
                  "parecer_tecnico",
                  "causa_provavel",
                  "acoes_corretivas",
                  "prazo_recomendado_dias",
                  "setor_responsavel",
                  "referencia_legal",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emitir_parecer_laudo" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha na análise IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não retornou parecer estruturado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parecer = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ ok: true, parecer }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analisar-laudo-ia error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
