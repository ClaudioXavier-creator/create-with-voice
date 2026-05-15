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

interface ToleranciaInfo {
  cv_pct?: number;
  tolerancia_absoluta?: number;
  faixa_min?: number;
  faixa_max?: number;
  unidade?: string;
  referencia?: string;
  formula?: string;
  intervalo_validacao?: [number, number];
  fora_intervalo_validacao?: boolean;
  obs?: string;
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
  pdf_base64?: string;
  rotulo?: RotuloInfo;
  tolerancia?: ToleranciaInfo;
}

function formatarTolerancia(t?: ToleranciaInfo): string {
  if (!t) {
    return "Tolerância analítica: NÃO DISPONÍVEL para este parâmetro/unidade no CBAA 2017. Avaliar conformidade sem desvio.";
  }
  const linhas: string[] = [];
  linhas.push(`Referência: ${t.referencia || "CBAA 2017"}`);
  linhas.push(`Fórmula CV: ${t.formula || "—"}`);
  linhas.push(`CV calculado: ${t.cv_pct?.toFixed(2)}%`);
  linhas.push(`Tolerância (+/-): ${t.tolerancia_absoluta} ${t.unidade || ""}`);
  linhas.push(`Faixa aceitável: ${t.faixa_min} a ${t.faixa_max} ${t.unidade || ""}`);
  if (t.intervalo_validacao) {
    linhas.push(`Intervalo de validação da fórmula: ${t.intervalo_validacao[0]} - ${t.intervalo_validacao[1]} ${t.unidade || ""}`);
  }
  if (t.fora_intervalo_validacao) {
    linhas.push(`⚠ ATENÇÃO: o resultado está FORA do intervalo de validação da fórmula — use a tolerância com cautela.`);
  }
  if (t.obs) linhas.push(`Obs: ${t.obs}`);
  return linhas.join("\n");
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAiResponse } from "../_shared/ai-helper.ts";

Deno.serve(async (req: Request) => {
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

    const body: RequestBody = await req.json();

    const blocoRotulo = formatarNiveisGarantia(body.rotulo);
    const blocoTolerancia = formatarTolerancia(body.tolerancia);

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

TOLERÂNCIA ANALÍTICA APLICÁVEL (CBAA 2017 — Compêndio Brasileiro de Alimentação Animal):
${blocoTolerancia}
`.trim();

    const systemPrompt = `Você é um especialista em qualidade de fábricas de ração animal e legislação MAPA (IN 04/2007, IN 13/2004, IN 15/2009, IN 22/2009, RDC ANVISA, Decreto 12.031/2024) e no Compêndio Brasileiro de Alimentação Animal (CBAA 2017 — Sindirações).
Analise o laudo laboratorial e produza um parecer técnico objetivo, fazendo SEMPRE TRÊS COMPARAÇÕES EM PARALELO:
  1) Resultado vs. limite legal/normativo (legislação MAPA aplicável).
  2) Resultado vs. nível de garantia declarado no RÓTULO do produto (quando disponível).
  3) Resultado vs. TOLERÂNCIA ANALÍTICA do CBAA 2017 (desvio interlaboratorial aceitável).

REGRAS CRÍTICAS DE INTERPRETAÇÃO:
- A tolerância analítica do CBAA 2017 representa a variabilidade NATURAL do método entre laboratórios. Um desvio DENTRO da tolerância NÃO é não conformidade técnica — é variação esperada.
- Para parâmetros "Mín" (PB mín, Ca mín, etc.): só classifique como "nao_conforme" do rótulo se o resultado for MENOR que (valor declarado − tolerância absoluta).
- Para parâmetros "Máx" (umidade máx, FB máx, etc.): só classifique como "nao_conforme" do rótulo se o resultado for MAIOR que (valor declarado + tolerância absoluta).
- Se o resultado está fora do declarado mas DENTRO da faixa de tolerância, classifique "conforme" no rótulo e mencione no parecer que o desvio é aceitável pelo CBAA 2017.
- Para legislação MAPA: aplique o mesmo raciocínio quando o limite for declarado pelo fabricante; para limites máximos absolutos (contaminantes, micotoxinas), NÃO aplique tolerância — o limite é estrito.
- Se a tolerância NÃO estiver disponível (parâmetro fora da tabela CBAA 2017), avalie sem ela e mencione isso.
- Sempre cite a tolerância usada (CV% e faixa absoluta) no parecer técnico.
- Use linguagem técnica brasileira, cite a normativa e seja conciso.
${body.pdf_base64 ? "O PDF do laudo original foi anexado — extraia também os dados relevantes dele e considere-os no parecer." : ""}`;

    // Monta mensagem do usuário
    const userContent: any[] = [{ type: "text", text: contexto }];
    if (body.pdf_base64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${body.pdf_base64}` },
      });
    }

    const aiResp = await getAiResponse({
      messages: [{ role: "user", content: userContent }],
      systemPrompt,
      tools: [
        {
          type: "function",
          function: {
            name: "emitir_parecer_laudo",
            description: "Emite parecer técnico estruturado sobre o laudo laboratorial, comparando contra legislação E rótulo.",
            parameters: {
              type: "object",
              properties: {
                conforme: { type: "boolean" },
                conforme_legislacao: { type: "boolean" },
                conforme_rotulo: { type: "string", enum: ["conforme", "nao_conforme", "nao_avaliado"] },
                dentro_tolerancia_analitica: { type: "string", enum: ["sim", "nao", "nao_aplicavel"] },
                comparacao_rotulo: { type: "string" },
                classificacao_risco: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
                parecer_tecnico: { type: "string" },
                causa_provavel: { type: "string" },
                acoes_corretivas: { type: "array", items: { type: "string" } },
                prazo_recomendado_dias: { type: "integer" },
                setor_responsavel: { type: "string" },
                referencia_legal: { type: "string" },
              },
              required: [
                "conforme", "conforme_legislacao", "conforme_rotulo", "dentro_tolerancia_analitica",
                "comparacao_rotulo", "classificacao_risco", "parecer_tecnico", "causa_provavel",
                "acoes_corretivas", "prazo_recomendado_dias", "setor_responsavel", "referencia_legal"
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "emitir_parecer_laudo" } },
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI service error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha na análise IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
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
