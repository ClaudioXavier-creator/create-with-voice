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

    const bodyText = await req.text();
    const bodyJson = JSON.parse(bodyText);
    const { action, termo, categoria } = bodyJson;

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "buscar_atualizacoes") {
      systemPrompt = `Você é um especialista em legislação brasileira EXCLUSIVAMENTE da área de ALIMENTAÇÃO ANIMAL (nutrição animal, fabricação de rações, suplementos, premix, núcleos e ingredientes para alimentação animal).

Seu foco é SOMENTE nas normas do MAPA (Ministério da Agricultura e Pecuária) que regulamentam:
- Fabricação de rações e alimentos para animais
- Boas Práticas de Fabricação (BPF) em fábricas de ração
- Registro e controle de produtos destinados à alimentação animal
- Fiscalização de estabelecimentos fabricantes de ração
- Ingredientes, aditivos e matérias-primas para alimentação animal
- Rotulagem de produtos para alimentação animal
- Programas de controle de qualidade em fábricas de ração

NÃO inclua legislação sobre: alimentação humana, ANVISA, vigilância sanitária de alimentos para consumo humano, agricultura, agrotóxicos ou temas fora de alimentação animal.

IMPORTANTE: Responda SEMPRE em formato JSON válido com a seguinte estrutura:
{
  "alertas": [
    {
      "titulo": "Título da atualização ou normativa",
      "resumo": "Resumo claro e objetivo da mudança, impacto prático para fábricas de ração e o que deve ser feito",
      "fonte": "Referência legal completa (ex: IN 04/2007, Decreto 12.031/2024, IN 15/2009)",
      "tipo": "atualizacao | nova_norma | revogacao | alerta",
      "relevancia": "alta | media | baixa",
      "data_aproximada": "YYYY-MM-DD"
    }
  ],
  "resumo_geral": "Um parágrafo resumindo o panorama regulatório atual da alimentação animal no Brasil, focando em mudanças recentes e tendências"
}`;

      userPrompt = `Gere um relatório atualizado sobre a legislação brasileira de ALIMENTAÇÃO ANIMAL do MAPA. Foque EXCLUSIVAMENTE em normas que impactam fábricas de ração animal.

Considere estas normas principais e suas atualizações:

1. **Decreto 12.031/2024** — Novo regulamento de fiscalização de produtos destinados à alimentação animal, substituindo o Decreto 6.296/2007. Impactos no registro, rotulagem e BPF.
   - ATENÇÃO ESPECIAL: Verifique se houve publicação de novos critérios de **categorização de risco** de estabelecimentos (Art. 79-86).
   - A classificação de risco (baixo, médio, alto) impacta diretamente a frequência de fiscalização e as exigências documentais.
   - Qualquer mudança nos critérios de categorização deve gerar alerta com relevância "alta".
2. **IN 04/2007** — Define os 9 POPs obrigatórios para BPF em fábricas de ração:
   - POP 01: Qualificação de fornecedores e controle de matérias-primas
   - POP 02: Limpeza e higienização das instalações e equipamentos  
   - POP 03: Higiene e saúde do pessoal
   - POP 04: Potabilidade da água
   - POP 05: Prevenção de contaminação cruzada
   - POP 06: Manutenção e calibração de equipamentos
   - POP 07: Controle integrado de pragas
   - POP 08: Programa de rastreabilidade e recolhimento (Recall)
   - POP 09: Programa de treinamento
3. **IN 15/2009** — Regulamento técnico sobre as condições higiênico-sanitárias e de BPF para estabelecimentos fabricantes de ração
4. **IN 17/2017** — Estabelece o regulamento técnico para estabelecimentos fabricantes de produtos destinados à alimentação animal
5. **IN 13/2004** — Regulamento técnico sobre aditivos para alimentação animal
6. **Decreto 6.296/2007** (revogado pelo 12.031/2024) — Regulamento anterior de inspeção e fiscalização
7. **Lei 6.198/1974** — Lei base de inspeção e fiscalização de alimentação animal
8. Quaisquer Instruções Normativas recentes do MAPA sobre alimentação animal

ATENÇÃO ESPECIAL — IN 17/2017:
- Verifique se existem novos Anexos publicados ou Instruções Complementares à IN 17/2017.
- Qualquer alteração nos Anexos da IN 17/2017 pode impactar diretamente as Boas Práticas de Fabricação, exigindo revisão imediata dos POPs e procedimentos do estabelecimento.
- Caso haja Instrução Complementar ou Anexo novo/alterado, gere um alerta com relevância "alta" e tipo "alerta" explicando o que deve ser revisado no programa de BPF da fábrica.

ATENÇÃO ESPECIAL — Decreto 12.031/2024 — CATEGORIZAÇÃO DE RISCO:
- Verifique se há novos critérios publicados para classificação de risco de estabelecimentos fabricantes.
- Os critérios podem incluir: volume de produção, tipos de produtos (medicados/não medicados), histórico de conformidade, uso de ingredientes de origem animal.
- Qualquer regulamentação complementar ao Decreto que detalhe a categorização deve gerar alerta de relevância "alta".
- Inclua impacto prático: como a nova categorização afeta a frequência de auditorias, exigências de autocontrole e prazo de adequação.

ATENÇÃO ESPECIAL — SIPEAGRO — RENOVAÇÃO DE REGISTROS (IN 17/2017):
- Verifique alertas sobre prazos de renovação de registros de PRODUTOS e do ESTABELECIMENTO junto ao SIPEAGRO (Sistema Integrado de Produtos e Estabelecimentos Agropecuários).
- Registros de produtos destinados à alimentação animal devem ser renovados periodicamente conforme IN 17/2017.
- O registro do estabelecimento fabricante no SIPEAGRO é obrigatório e deve ser mantido atualizado.
- Qualquer mudança nas regras de renovação, novos prazos ou procedimentos do SIPEAGRO devem gerar alerta com relevância "alta".
- Inclua: prazos de validade dos registros, documentação necessária para renovação e consequências do vencimento.

Para cada norma, explique:
- O que mudou ou está vigente
- Impacto prático para fábricas de ração
- Prazos de adequação se houver
- Pontos de atenção para auditorias

Liste de 4 a 8 alertas. Responda APENAS com o JSON, sem markdown ou texto adicional.`;

    } else if (action === "resumo_sistema") {
      systemPrompt = `Você é um consultor especialista em BPF para fábricas de ração animal, com profundo conhecimento da legislação do MAPA sobre alimentação animal.

Analise o sistema de gestão de BPF implementado e avalie a conformidade com:
- IN 04/2007 (9 POPs obrigatórios)
- IN 15/2009 (Condições higiênico-sanitárias)
- Decreto 12.031/2024 (Fiscalização)
- IN 17/2017 (Estabelecimentos fabricantes)

Responda SEMPRE em formato JSON:
{
  "modulos_implementados": [
    { "modulo": "Nome do módulo", "descricao": "O que faz e qual POP/norma atende", "status": "completo | parcial" }
  ],
  "resumo_executivo": "Parágrafo resumindo o estado do sistema em relação às exigências do MAPA para alimentação animal",
  "recomendacoes": ["Recomendação 1 com referência à norma específica", "Recomendação 2"]
}`;

      userPrompt = `O sistema FeedBPF implementa os seguintes módulos para gestão de BPF em fábricas de ração animal:

1. **Cadastro de Empresa** — Dados da fábrica, CNPJ, RT, CRMV, capacidade produtiva, tipos de produção
2. **Qualificação de Fornecedores** — Cadastro, avaliação com nota 1-5, taxa de aprovação de MP, status de qualificação (atende POP 01 da IN 04/2007)
3. **Documentos/POPs** — Controle de documentos com versionamento, referência aos 9 POPs obrigatórios da IN 04/2007
4. **Execução de ITs/POPs** — Registro de execuções vinculadas aos documentos, com alertas de periodicidade
5. **Auditoria BPF** — Checklist baseado no Decreto 12.031/2024 com 8 áreas de avaliação
6. **Não Conformidades** — Registro com causa raiz (5 porquês), ação corretiva, plano de ação, responsável e prazos
7. **Recebimento de MP** — Controle de qualidade (odor, umidade, insetos), aprovação/rejeição, integrado com qualificação de fornecedores
8. **PCP / Ordens de Produção** — Ordens com fórmulas, ingredientes vinculados a lotes de MP, batidas com tempo de mistura e temperatura
9. **Rastreabilidade** — Vínculo MP→PA→Cliente com NF, sistema de Recall simulado com cronômetro (atende POP 08)
10. **Controle de Pragas** — Registro de ocorrências, tipo de praga, ações e responsáveis (atende POP 07)
11. **Treinamentos** — Registro com validade e controle de vencimentos (atende POP 09)
12. **Calibração de Equipamentos** — Gestão de balanças, termômetros e outros instrumentos com certificados (atende POP 06)
13. **Indicadores** — Dashboard com gráficos de desempenho
14. **Relatórios** — Exportação de dados por módulo em CSV, relatórios digitais e digitalizados
15. **Legislação & IA** — Monitoramento de atualizações legislativas do MAPA com inteligência artificial

Avalie cada módulo em relação às exigências da IN 04/2007, IN 15/2009, Decreto 12.031/2024 e IN 17/2017.
Identifique gaps e gere recomendações práticas para melhorar a conformidade.
Responda APENAS com JSON.`;
    } else if (action === "pesquisar_legislacao") {
      const { termo, categoria } = await req.json().catch(() => ({}));
      const body = JSON.parse(await new Request(req.url, { headers: req.headers }).text().catch(() => "{}"));
      // Re-parse since we already consumed body above — use closure vars
      const termoBusca = termo || body?.termo || "alimentação animal";
      const categoriaBusca = categoria || body?.categoria || "todas";

      systemPrompt = `Você é um especialista em legislação brasileira de ALIMENTAÇÃO ANIMAL do MAPA. Sua função é pesquisar e retornar normas, instruções normativas, decretos, portarias, consultas públicas e alterações legislativas relacionadas ao setor de alimentação animal.

Considere o sistema SISLEGIS do MAPA (https://sistemasweb.agricultura.gov.br/sislegis/) como referência principal.

Categorias de busca:
- "novas": Normas publicadas recentemente (últimos 2 anos)
- "alteracoes": Alterações e atualizações de normas existentes
- "consultas_publicas": Consultas públicas abertas ou recentes do MAPA sobre alimentação animal
- "todas": Todas as categorias acima

Responda SEMPRE em formato JSON válido:
{
  "resultados": [
    {
      "titulo": "Título completo da norma/consulta",
      "codigo": "Ex: IN 04/2007, Decreto 12.031/2024",
      "tipo": "instrucao_normativa | decreto | lei | portaria | resolucao | consulta_publica | nota_tecnica",
      "categoria": "nova | alteracao | consulta_publica",
      "orgao": "MAPA",
      "data_publicacao": "YYYY-MM-DD ou data aproximada",
      "resumo": "Resumo claro do conteúdo e impacto prático para fábricas de ração",
      "status": "vigente | revogada | em_consulta | aprovada",
      "link_referencia": "URL do SISLEGIS ou DOU quando disponível",
      "impacto_bpf": "Como impacta as Boas Práticas de Fabricação"
    }
  ],
  "total_encontrados": 0,
  "resumo_pesquisa": "Resumo geral dos resultados encontrados"
}`;

      userPrompt = `Pesquise legislação brasileira de ALIMENTAÇÃO ANIMAL no MAPA com os seguintes critérios:

Termo de busca: "${termoBusca}"
Categoria: "${categoriaBusca}"

Considere as seguintes fontes e normas base:
- SISLEGIS/MAPA — Sistema de Consulta à Legislação
- Diário Oficial da União (DOU)
- IN 04/2007 (POPs de BPF)
- IN 15/2009 (Condições higiênico-sanitárias)
- IN 17/2017 (Estabelecimentos fabricantes)
- IN 13/2004 (Aditivos)
- Decreto 12.031/2024 (Fiscalização)
- Lei 6.198/1974 (Lei base)
- RDC/MAPA sobre ingredientes e matérias-primas
- Consultas públicas do MAPA sobre alimentação animal

${categoriaBusca === "novas" ? "Foque em normas publicadas nos últimos 2 anos (2024-2026)." : ""}
${categoriaBusca === "alteracoes" ? "Foque em alterações, retificações e atualizações de normas existentes." : ""}
${categoriaBusca === "consultas_publicas" ? "Foque em consultas públicas abertas ou recentemente encerradas do MAPA sobre alimentação animal." : ""}

Liste de 5 a 15 resultados relevantes. Responda APENAS com o JSON, sem markdown.`;

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