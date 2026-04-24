// Edge function: analisa laudo laboratorial e retorna parecer técnico + ações corretivas
// Compara o resultado tanto com a legislação MAPA quanto com os níveis de garantia declarados no rótulo do produto.
// Usa Lovable AI Gateway (gemini-2.5-pro) com tool calling para output estruturado.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NivelGarantia {
  parametro?: string;
  nome?: string;
  valor?: string | number;
  unidade?: string;
  tipo?: string; // "min" | "max"
  min_max?: string;
}

interface RotuloInfo {
  nome?: string;
  marca?: string;
  classificacao?: string;
  especie_alvo?: string;
  categoria_animal?: string;
  registro_mapa?: string;
  niveis_garantia?: NivelGarantia[] | Record<string, unknown> | string | null;
}

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
  rotulo?: RotuloInfo; // dados do rótulo do produto analisado (opcional)
}

function formatarNiveisGarantia(rotulo?: RotuloInfo): string {
  if (!rotulo) return "Não disponível (produto não encontrado no cadastro).";
  const linhas: string[] = [];
  linhas.push(`Produto cadastrado: ${rotulo.nome || "—"}${rotulo.marca ? ` (${rotulo.marca})` : ""}`);
  if (rotulo.classificacao) linhas.push(`Classificação: ${rotulo.classificacao}`);
  if (rotulo.especie_alvo) linhas.push(`Espécie-alvo: ${rotulo.especie_alvo}`);
  if (rotulo.categoria_animal) linhas.push(`Categoria animal: ${rotulo.categoria_animal}`);
  if (rotulo.registro_mapa) linhas.push(`Registro MAPA: ${rotulo.registro_mapa}`);

  const ng = rotulo.niveis_garantia;
  if (!ng) {
    linhas.push("Níveis de garantia declarados no rótulo: NÃO INFORMADOS.");
    return linhas.join("\n");
  }
  if (typeof ng === "string") {
    linhas.push(`Níveis de garantia (texto livre):\n${ng}`);
    return linhas.join("\n");
  }
  if (Array.isArray(ng)) {
    linhas.push("Níveis de garantia declarados no rótulo:");
    ng.forEach((n: any) => {
      const nome = n.parametro || n.nome || "—";
      const valor = n.valor ?? "";
      const unid = n.unidade || "";
      const tipo = n.tipo || n.min_max || "";
      linhas.push(`  • ${nome}: ${valor} ${unid} ${tipo ? `(${tipo})` : ""}`.trim());
    });
    return linhas.join("\n");
  }
  // objeto genérico
  linhas.push("Níveis de garantia (rótulo):");
  Object.entries(ng).forEach(([k, v]) => linhas.push(`  • ${k}: ${JSON.stringify(v)}`));
  return linhas.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const body: RequestBody = await req.json();

    const blocoRotulo = formatarNiveisGarantia(body.rotulo);

    const contexto = `
DADOS DO LAUDO INFORMADOS PELO USUÁRIO:
- Tipo de análise: ${body.tipo_analise || "não informado"}
- Produto: ${body.produto || "não informado"}
- Lote: ${body.lote || "não informado"}
- Parâmetro: ${body.parametro || "não informado"}
- Resultado: ${body.resultado || "não informado"} ${body.unidade || ""}
- Limite de referência (legislação): ${body.limite_referencia || "não informado"}
- Laboratório: ${body.laboratorio || "não informado"}
- Método: ${body.metodo || "não informado"}
- Observações: ${body.observacoes || "—"}

DADOS DO RÓTULO DO PRODUTO (paralelo obrigatório):
${blocoRotulo}
`.trim();

    const systemPrompt = `Você é um especialista em qualidade de fábricas de ração animal e legislação MAPA (IN 04/2007, IN 13/2004, IN 15/2009, IN 22/2009, RDC ANVISA, Decreto 12.031/2024).
Analise o laudo laboratorial e produza um parecer técnico objetivo, fazendo SEMPRE DUAS COMPARAÇÕES EM PARALELO:
  1) Resultado vs. limite legal/normativo (legislação MAPA aplicável).
  2) Resultado vs. nível de garantia declarado no RÓTULO do produto (quando disponível).

Regras importantes:
- Um produto pode estar dentro do limite legal mas FORA do declarado no rótulo — isso configura NÃO CONFORMIDADE de rotulagem (IN 22/2009 / IN 30/2009), com risco regulatório e comercial.
- Se o nível de garantia do rótulo não estiver disponível, indique isso explicitamente em "comparacao_rotulo" e classifique como "nao_avaliado".
- Para parâmetros "Mín" (ex.: PB mín), o resultado deve ser ≥ valor garantido. Para "Máx" (ex.: umidade máx, FB máx), deve ser ≤ valor garantido. Aplique tolerâncias usuais do MAPA quando pertinente, mas sempre cite.
- Use linguagem técnica brasileira, cite a normativa, seja conciso.
${body.pdf_base64 ? "O PDF do laudo original foi anexado — extraia também os dados relevantes dele e considere-os no parecer." : ""}`;

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
              description: "Emite parecer técnico estruturado sobre o laudo laboratorial, comparando contra legislação E rótulo.",
              parameters: {
                type: "object",
                properties: {
                  conforme: {
                    type: "boolean",
                    description: "true se o resultado está conforme tanto o limite legal quanto o rótulo (ou se o rótulo não foi avaliado, considera apenas o legal).",
                  },
                  conforme_legislacao: {
                    type: "boolean",
                    description: "true se o resultado atende ao limite da legislação MAPA aplicável.",
                  },
                  conforme_rotulo: {
                    type: "string",
                    enum: ["conforme", "nao_conforme", "nao_avaliado"],
                    description: "'conforme' se atende ao nível de garantia do rótulo; 'nao_conforme' se está fora; 'nao_avaliado' se o rótulo não estava disponível ou não tinha esse parâmetro.",
                  },
                  comparacao_rotulo: {
                    type: "string",
                    description: "Frase curta explicando como o resultado se compara ao nível de garantia declarado no rótulo (ex.: 'PB declarada 18% mín; resultado 16,4% — abaixo do garantido em 1,6 p.p.'). Se 'nao_avaliado', explique o motivo.",
                  },
                  classificacao_risco: {
                    type: "string",
                    enum: ["baixo", "medio", "alto", "critico"],
                    description: "Risco sanitário/regulatório do desvio (considera ambos os eixos).",
                  },
                  parecer_tecnico: {
                    type: "string",
                    description: "Parecer técnico em 2-4 parágrafos: interpretação do resultado, comparação com limite legal, comparação com rótulo, citação da normativa MAPA aplicável e impacto sanitário/regulatório.",
                  },
                  causa_provavel: {
                    type: "string",
                    description: "Causa raiz mais provável do desvio (vazio se totalmente conforme).",
                  },
                  acoes_corretivas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de ações corretivas concretas (3-6 itens). Vazia se conforme.",
                  },
                  prazo_recomendado_dias: {
                    type: "integer",
                    description: "Prazo recomendado em dias para correção (0 se conforme).",
                  },
                  setor_responsavel: {
                    type: "string",
                    description: "Setor sugerido como responsável (ex: Recebimento, Produção, Controle de Qualidade, Manutenção, Limpeza, Formulação).",
                  },
                  referencia_legal: {
                    type: "string",
                    description: "Normativa principal aplicável (ex: 'IN 15/2009 MAPA - Anexo II' ou 'IN 22/2009 - Rotulagem').",
                  },
                },
                required: [
                  "conforme",
                  "conforme_legislacao",
                  "conforme_rotulo",
                  "comparacao_rotulo",
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
