import { supabase } from "@/integrations/supabase/client";

export type WhatsAppModulo =
  | "agrorc"
  | "feed_bpf"
  | "audits_bpf"
  | "portal"
  | "agrogestao"
  | "nutricrm";

export interface SendWhatsAppParams {
  to: string;                  // 5561999999999 ou (61) 99999-9999 — normalizado no backend
  message: string;
  modulo?: WhatsAppModulo;
  tipo?: string;               // 'lead' | 'manual' | 'alerta_nc' | 'marketing' | 'visita' ...
  empresa_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Envia mensagem WhatsApp via Evolution API (camada central).
 * Usada por: AgroRC, Feed_BPF, Audits_BPF, Portal de Gestão, AgroGestão CRM, NutriCRM.
 */
export async function sendWhatsApp(params: SendWhatsAppParams) {
  const { data, error } = await supabase.functions.invoke("evolution-send", {
    body: params,
  });
  if (error) throw error;
  return data;
}

/** Abre o WhatsApp Web/App com a mensagem pré-preenchida (envio manual). */
export function whatsappLink(to: string, message: string) {
  const n = (to || "").replace(/\D/g, "");
  const full = n.length <= 11 ? `55${n}` : n;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

/**
 * Normaliza um número BR para o formato E.164 sem '+' usado pelo WhatsApp:
 * 55 + DDD (2) + número (8 ou 9 dígitos). Retorna null se inválido.
 *
 * Regras:
 * - Remove caracteres não numéricos.
 * - Remove prefixo '00' (DDI internacional discado).
 * - Se vier sem DDI, assume 55 (Brasil).
 * - DDD deve estar entre 11 e 99.
 * - Para celular (9 dígitos no assinante), o 1º dígito deve ser 9.
 * - Aceita fixo (8 dígitos no assinante).
 */
export function normalizePhoneBR(raw: string): string | null {
  if (!raw) return null;
  let n = String(raw).replace(/\D/g, "");
  if (!n) return null;
  if (n.startsWith("00")) n = n.slice(2);

  // Sem DDI -> assume Brasil
  if (n.length === 10 || n.length === 11) n = "55" + n;

  // Brasil: 55 + DDD(2) + 8 ou 9 dígitos => total 12 ou 13
  if (!n.startsWith("55")) return null;
  if (n.length !== 12 && n.length !== 13) return null;

  const ddd = parseInt(n.slice(2, 4), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return null;

  const assinante = n.slice(4);
  if (assinante.length === 9 && assinante[0] !== "9") return null;
  if (assinante.length === 8 && /^[2-5]/.test(assinante) === false) {
    // fixos começam em 2-5 normalmente; tolerante: não bloqueia
  }
  return n;
}

export interface ValidatedRecipient<T = unknown> {
  original: string;
  normalized: string;
  source: T;
}

export interface ValidationResult<T = unknown> {
  valid: ValidatedRecipient<T>[];
  invalid: { original: string; source: T; reason: string }[];
  duplicates: { original: string; source: T }[];
}

/** Valida + dedup uma lista de contatos. */
export function validatePhoneList<T extends { telefone: string }>(items: T[]): ValidationResult<T> {
  const valid: ValidatedRecipient<T>[] = [];
  const invalid: ValidationResult<T>["invalid"] = [];
  const duplicates: ValidationResult<T>["duplicates"] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const original = item.telefone || "";
    const normalized = normalizePhoneBR(original);
    if (!normalized) {
      invalid.push({ original, source: item, reason: "Número inválido (DDD/formato)" });
      continue;
    }
    if (seen.has(normalized)) {
      duplicates.push({ original, source: item });
      continue;
    }
    seen.add(normalized);
    valid.push({ original, normalized, source: item });
  }
  return { valid, invalid, duplicates };
}
