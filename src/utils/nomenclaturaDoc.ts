// ============================================================================
// Padronização de nomenclatura de documentos BPF
// Formato salvo (storage / DB): POP-01_PL-001_08-07-2026
// Formato exibido (UI):         POP 01 · PL 001 · 08/07/2026
// ============================================================================

export const TIPOS_DOC = [
  { value: "PL", label: "PL — Planilha" },
  { value: "IT", label: "IT — Instrução de Trabalho" },
  { value: "RG", label: "RG — Registro" },
  { value: "FR", label: "FR — Formulário" },
  { value: "MN", label: "MN — Manual" },
] as const;

export type TipoDoc = typeof TIPOS_DOC[number]["value"];

/** Extrai o número do POP a partir de "POP-01" → "01" */
export function popShort(popCodigo: string): string {
  const m = /(\d+)/.exec(popCodigo || "");
  return m ? m[1].padStart(2, "0") : "00";
}

/** "001", "002" ... */
export function formatNumero(n: number | string | null | undefined): string {
  const num = typeof n === "number" ? n : parseInt(String(n || "0"), 10) || 0;
  return String(num).padStart(3, "0");
}

/** "2026-07-08" ou Date → "08-07-2026" (para storage) */
export function formatDataStorage(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data + "T00:00:00") : data;
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

/** "2026-07-08" ou Date → "08/07/2026" (para exibição) */
export function formatDataDisplay(data: string | Date): string {
  return formatDataStorage(data).replace(/-/g, "/");
}

/**
 * Nome padronizado seguro para storage / DB:
 *   POP-01_PL-001_08-07-2026
 */
export function nomePadronizado(
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date
): string {
  return `POP-${popShort(popCodigo)}_${tipo}-${formatNumero(numero)}_${formatDataStorage(data)}`;
}

/**
 * Nome bonito para exibição na UI:
 *   POP 01 · PL 001 · 08/07/2026
 */
export function nomeDisplay(
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date
): string {
  return `POP ${popShort(popCodigo)} · ${tipo} ${formatNumero(numero)} · ${formatDataDisplay(data)}`;
}

/**
 * Caminho de storage padronizado:
 *   {scopeId}/POP-01/PL/POP-01_PL-001_08-07-2026.pdf
 */
export function storagePath(
  scopeId: string,
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date,
  originalFileName: string
): string {
  const ext = originalFileName.includes(".")
    ? originalFileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  const base = nomePadronizado(popCodigo, tipo, numero, data);
  return `bpf/${scopeId}/POP-${popShort(popCodigo)}/${tipo}/${base}.${ext}`;
}

/** Extrai a extensão preservando pontos internos do nome original */
export function nomeArquivoFinal(
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date,
  originalFileName: string
): string {
  const ext = originalFileName.includes(".")
    ? originalFileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  return `${nomePadronizado(popCodigo, tipo, numero, data)}.${ext}`;
}
