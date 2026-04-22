import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.24.2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  sourceUrl: z.string().url().optional(),
});

const IMPORT_ALIASES = {
  fonte_linha_id: ["id", "codigo", "código", "linha", "sequencia", "sequência"],
  cnpj: ["cnpj", "cnpj cpf", "cpf cnpj"],
  registro_estabelecimento: ["registro", "registro estabelecimento", "registro sipeagro", "registro mapa", "numero registro", "n registro", "nr registro"],
  razao_social: ["razao social", "razão social", "nome empresarial", "empresa", "estabelecimento"],
  nome_fantasia: ["nome fantasia", "fantasia"],
  situacao: ["situacao", "situação", "status", "situacao cadastral", "situação cadastral"],
  categoria: ["categoria", "tipo estabelecimento", "tipo"],
  atividade: ["atividade", "atividade principal", "segmento", "classificacao", "classificação"],
  municipio: ["municipio", "município", "cidade"],
  uf: ["uf", "estado"],
  endereco: ["endereco", "endereço", "logradouro"],
  cep: ["cep"],
  data_registro: ["data registro", "data de registro", "registro em"],
  data_atualizacao_fonte: ["data atualizacao", "data atualização", "atualizado em", "ultima atualizacao", "última atualização"],
} as const;

const SHEET_HINTS = ["estabelecimentos"];

const normalizeText = (value: string) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const onlyDigits = (value: string) => (value || "").replace(/\D/g, "");

function parseDateFromText(value: string): string | null {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function parseSpreadsheetDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}` : null;
  }
  const text = String(value).trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

function normalizeDocumentNumber(value: unknown, length: number) {
  const digits = onlyDigits(String(value || ""));
  if (!digits) return null;
  return digits.length >= length ? digits : digits.padStart(length, "0");
}

function getCellValue(row: Record<string, unknown>, aliases: readonly string[]) {
  for (const [key, rawValue] of Object.entries(row)) {
    const normalizedKey = normalizeText(key);
    if (aliases.some((alias) => normalizedKey.includes(normalizeText(alias)))) {
      return rawValue;
    }
  }
  return null;
}

function resolveHeaderRowIndex(rows: unknown[][]) {
  const requiredGroups = [
    IMPORT_ALIASES.razao_social,
    IMPORT_ALIASES.cnpj,
    IMPORT_ALIASES.registro_estabelecimento,
    IMPORT_ALIASES.municipio,
    IMPORT_ALIASES.uf,
  ];

  let bestIndex = 0;
  let bestScore = -1;

  for (let index = 0; index < Math.min(rows.length, 12); index += 1) {
    const normalizedCells = (rows[index] || []).map((cell) => normalizeText(String(cell || "")));
    const score = requiredGroups.reduce((total, aliases) => {
      const hasMatch = aliases.some((alias) => normalizedCells.some((cell) => cell.includes(normalizeText(alias))));
      return total + (hasMatch ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function resolveImportSheet(workbook: XLSX.WorkBook) {
  return workbook.SheetNames.find((name) => SHEET_HINTS.some((hint) => normalizeText(name).includes(hint))) || workbook.SheetNames[0];
}

function extractImportRows(workbook: XLSX.WorkBook) {
  const sheetName = resolveImportSheet(workbook);
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerRowIndex = resolveHeaderRowIndex(matrix);
  const titleDate = parseDateFromText(String(matrix[0]?.[0] || ""));
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: headerRowIndex, defval: "", raw: false });
  return { rows, titleDate, sheetName };
}

function pickSpreadsheetLink(html: string, baseUrl: string) {
  const matches = [...html.matchAll(/href=["']([^"']+\.(?:xlsx|xls)(?:\?[^"']*)?)["']/gi)]
    .map((match) => match[1])
    .map((href) => new URL(href, baseUrl).toString());

  return matches.find((url) => /sipeagro|estabelecimentos|alimentacao|alimenta%C3%A7%C3%A3o/i.test(url)) || matches[0] || null;
}

async function fetchSpreadsheet(sourceUrl: string) {
  const response = await fetch(sourceUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Não foi possível acessar a URL informada [${response.status}].`);
  }

  const contentType = response.headers.get("content-type") || "";
  const finalUrl = response.url || sourceUrl;
  if (/spreadsheet|excel|sheet|officedocument/i.test(contentType) || /\.(xlsx|xls)(\?|$)/i.test(finalUrl)) {
    return { buffer: await response.arrayBuffer(), finalUrl };
  }

  const html = await response.text();
  const spreadsheetUrl = pickSpreadsheetLink(html, finalUrl);
  if (!spreadsheetUrl) {
    throw new Error("Nenhum arquivo Excel foi encontrado nessa página oficial.");
  }

  const fileResponse = await fetch(spreadsheetUrl, { redirect: "follow" });
  if (!fileResponse.ok) {
    throw new Error(`O arquivo Excel encontrado não pôde ser baixado [${fileResponse.status}].`);
  }

  return { buffer: await fileResponse.arrayBuffer(), finalUrl: fileResponse.url || spreadsheetUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL não configurada");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY não configurada");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Somente admin pode atualizar a base." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceUrl = parsed.data.sourceUrl!;
    const { buffer, finalUrl } = await fetchSpreadsheet(sourceUrl);
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
    const { rows, titleDate, sheetName } = extractImportRows(workbook);

    if (!rows.length) {
      throw new Error("A planilha oficial foi encontrada, mas não possui linhas utilizáveis.");
    }

    const fileName = decodeURIComponent(finalUrl.split("/").pop() || "mapa-estabelecimentos.xlsx");
    const { data: importacao, error: importacaoError } = await adminClient
      .from("mapa_importacoes")
      .insert({
        arquivo_nome: fileName,
        status: "processando",
        total_linhas: rows.length,
        imported_by: user.id,
        observacoes: `Origem: ${finalUrl}`,
      })
      .select("id")
      .single();

    if (importacaoError || !importacao?.id) {
      throw importacaoError || new Error("Não foi possível registrar a importação.");
    }

    const importacaoId = importacao.id;

    try {
      const registros = rows
        .map((row, index) => {
          const razaoSocial = String(getCellValue(row, IMPORT_ALIASES.razao_social) || "").trim();
          const registro = String(getCellValue(row, IMPORT_ALIASES.registro_estabelecimento) || "").trim();
          const cnpj = normalizeDocumentNumber(getCellValue(row, IMPORT_ALIASES.cnpj), 14);

          if (!razaoSocial && !registro && !cnpj) return null;
          if ([razaoSocial, registro, cnpj].every((value) => !value || String(value).trim() === "-")) return null;

          return {
            fonte_linha_id: String(getCellValue(row, IMPORT_ALIASES.fonte_linha_id) || index + 1),
            cnpj: cnpj || null,
            registro_estabelecimento: registro || null,
            razao_social: razaoSocial || registro || `Linha ${index + 1}`,
            nome_fantasia: String(getCellValue(row, IMPORT_ALIASES.nome_fantasia) || "").trim() || null,
            situacao: String(getCellValue(row, IMPORT_ALIASES.situacao) || "").trim() || null,
            categoria: String(getCellValue(row, IMPORT_ALIASES.categoria) || "").trim() || null,
            atividade: String(getCellValue(row, IMPORT_ALIASES.atividade) || "").trim() || null,
            municipio: String(getCellValue(row, IMPORT_ALIASES.municipio) || "").trim() || null,
            uf: String(getCellValue(row, IMPORT_ALIASES.uf) || "").trim().toUpperCase() || null,
            endereco: String(getCellValue(row, IMPORT_ALIASES.endereco) || "").trim() || null,
            cep: onlyDigits(String(getCellValue(row, IMPORT_ALIASES.cep) || "")) || null,
            data_registro: parseSpreadsheetDate(getCellValue(row, IMPORT_ALIASES.data_registro)),
            data_atualizacao_fonte: parseSpreadsheetDate(getCellValue(row, IMPORT_ALIASES.data_atualizacao_fonte)) || titleDate,
            importacao_id: importacaoId,
            dados_brutos: row,
          };
        })
        .filter(Boolean);

      const totalImportadas = registros.length;
      const totalRejeitadas = rows.length - totalImportadas;

      await adminClient.from("mapa_estabelecimentos").delete().not("id", "is", null);

      for (let index = 0; index < registros.length; index += 500) {
        const chunk = registros.slice(index, index + 500);
        const { error } = await adminClient.from("mapa_estabelecimentos").insert(chunk as never);
        if (error) throw error;
      }

      const status = totalRejeitadas > 0 ? "concluida_parcial" : "concluida";
      await adminClient
        .from("mapa_importacoes")
        .update({
          status,
          total_importadas: totalImportadas,
          total_rejeitadas: totalRejeitadas,
          observacoes: `${totalRejeitadas > 0 ? `Importação da aba ${sheetName} com ${totalRejeitadas} linha(s) ignoradas.` : `Importação da aba ${sheetName} concluída.`} Origem: ${finalUrl}`,
          concluido_em: new Date().toISOString(),
        })
        .eq("id", importacaoId);

      return new Response(JSON.stringify({ success: true, totalImportadas, totalRejeitadas, arquivo: fileName, origem: finalUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      await adminClient
        .from("mapa_importacoes")
        .update({
          status: "falhou",
          observacoes: error instanceof Error ? error.message : "Falha inesperada na importação.",
          concluido_em: new Date().toISOString(),
        })
        .eq("id", importacaoId);
      throw error;
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});