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
