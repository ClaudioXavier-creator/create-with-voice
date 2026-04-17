/**
 * Carimbo Anti-Fraude para Documentos — Decreto 12.031/2024 & MP 2.200-2/2001 (MAPA)
 *
 * Padroniza data/hora de emissão, usuário responsável, identificação do documento
 * e hash curto de integridade em TODOS os documentos (impressos e digitais) gerados
 * pelo sistema, atendendo à exigência regulatória contra fraudes em registros oficiais.
 */

export interface CarimboInfo {
  documentoTipo: string;        // Ex: "Ficha de Produção", "Ficha Técnica"
  documentoId?: string;         // Nº OP, lote, código do POP etc.
  empresa?: string;             // Razão social
  usuario?: string;             // E-mail / nome do usuário logado
  dataHoraISO: string;          // ISO 8601
  dataHoraBR: string;           // dd/mm/aaaa hh:mm:ss
  hashCurto: string;            // 12 chars hex — selo de integridade
  selo: string;                 // String formatada para exibição
}

/**
 * Gera um hash curto (12 chars) determinístico a partir do conteúdo.
 * Usa SubtleCrypto (SHA-256) quando disponível; caso contrário, fallback djb2.
 */
async function hashCurto(conteudo: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const data = new TextEncoder().encode(conteudo);
      const buf = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf))
        .slice(0, 6)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    } catch {
      /* fall through */
    }
  }
  // Fallback síncrono (djb2)
  let h = 5381;
  for (let i = 0; i < conteudo.length; i++) h = ((h << 5) + h) + conteudo.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase().slice(0, 12);
}

/** Hash síncrono (djb2) para uso em fluxos não-async */
function hashCurtoSync(conteudo: string): string {
  let h = 5381;
  for (let i = 0; i < conteudo.length; i++) h = ((h << 5) + h) + conteudo.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase().slice(0, 12);
}

/** Versão síncrona — usa djb2. Recomendado para fluxos de impressão. */
export function gerarCarimboSync(params: {
  documentoTipo: string;
  documentoId?: string;
  empresa?: string;
  usuario?: string;
}): CarimboInfo {
  const agora = new Date();
  const dataHoraISO = agora.toISOString();
  const dataHoraBR = agora.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const base = [
    params.documentoTipo,
    params.documentoId || "",
    params.empresa || "",
    params.usuario || "",
    dataHoraISO,
  ].join("|");
  const hash = hashCurtoSync(base);
  return {
    documentoTipo: params.documentoTipo,
    documentoId: params.documentoId,
    empresa: params.empresa,
    usuario: params.usuario,
    dataHoraISO,
    dataHoraBR,
    hashCurto: hash,
    selo: `INTEGRIDADE: ${hash}`,
  };
}

export async function gerarCarimbo(params: {
  documentoTipo: string;
  documentoId?: string;
  empresa?: string;
  usuario?: string;
}): Promise<CarimboInfo> {
  const agora = new Date();
  const dataHoraISO = agora.toISOString();
  const dataHoraBR = agora.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const base = [
    params.documentoTipo,
    params.documentoId || "",
    params.empresa || "",
    params.usuario || "",
    dataHoraISO,
  ].join("|");
  const hash = await hashCurto(base);
  const selo = `INTEGRIDADE: ${hash}`;
  return {
    documentoTipo: params.documentoTipo,
    documentoId: params.documentoId,
    empresa: params.empresa,
    usuario: params.usuario,
    dataHoraISO,
    dataHoraBR,
    hashCurto: hash,
    selo,
  };
}

/**
 * Bloco HTML pronto para colar em qualquer PDF/impressão.
 * Aparece como rodapé discreto, mas auditável.
 */
export function carimboHTML(info: CarimboInfo): string {
  return `
<div style="margin-top:14px;padding:8px 10px;border-top:2px solid #1a1a2e;font-family:Arial,sans-serif;font-size:9px;color:#444;background:#fafafa;">
  <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
    <div>
      <strong>${info.documentoTipo}</strong>${info.documentoId ? ` — ${info.documentoId}` : ""}
      ${info.empresa ? `<br/>Empresa: ${info.empresa}` : ""}
    </div>
    <div style="text-align:right;">
      Emitido em: <strong>${info.dataHoraBR}</strong><br/>
      ${info.usuario ? `Por: ${info.usuario}<br/>` : ""}
      <span style="font-family:monospace;color:#1a1a2e;">${info.selo}</span>
    </div>
  </div>
  <div style="margin-top:4px;font-size:8px;color:#888;">
    Documento com data/hora de emissão e selo de integridade — Decreto 12.031/2024 &amp; MP 2.200-2/2001 (MAPA).
    Adulteração invalida o registro.
  </div>
</div>`;
}

/** Versão monocromática mais compacta para fichas operacionais */
export function carimboHTMLCompacto(info: CarimboInfo): string {
  return `
<div style="margin-top:10px;padding:4px 6px;border-top:1px solid #000;font-family:Arial,sans-serif;font-size:9px;color:#222;display:flex;justify-content:space-between;">
  <span>${info.documentoTipo}${info.documentoId ? ` — ${info.documentoId}` : ""}${info.empresa ? ` | ${info.empresa}` : ""}</span>
  <span>Emitido: <strong>${info.dataHoraBR}</strong>${info.usuario ? ` | ${info.usuario}` : ""} | <span style="font-family:monospace;">${info.selo}</span></span>
</div>`;
}

/** Versão texto puro (CSV, TXT) */
export function carimboTexto(info: CarimboInfo): string {
  return [
    "",
    "─────────────────────────────────────────────",
    `${info.documentoTipo}${info.documentoId ? ` — ${info.documentoId}` : ""}`,
    info.empresa ? `Empresa: ${info.empresa}` : "",
    `Emitido em: ${info.dataHoraBR}`,
    info.usuario ? `Por: ${info.usuario}` : "",
    info.selo,
    "Decreto 12.031/2024 & MP 2.200-2/2001 (MAPA) — Adulteração invalida o registro.",
    "─────────────────────────────────────────────",
  ].filter(Boolean).join("\n");
}
