export const PRODUCT_LABELS: Record<string, string> = {
  feedbpf: "Feed_BPF",
  feed_bpf: "Feed_BPF",
  auditsbpf: "Audits_BPF",
  audits_bpf: "Audits_BPF",
  nutricrm: "NutriCRM",
  agrogestao: "AgroGestão CRM",
  agrogestao_crm: "AgroGestão CRM",
  agrorc: "Agro RC CRM",
  agro_rc: "Agro RC CRM",
  agro_rc_crm: "Agro RC CRM",
  rotulos: "Nutri_Agro Labels",
  plataforma: "Plataforma BPF",
};

export type ProductKey = keyof typeof PRODUCT_LABELS;

export function getProductLabel(key: string | null | undefined): string {
  if (!key) return "Não definido";
  const normalizedKey = key.toLowerCase().replace(/-/g, "_");
  return PRODUCT_LABELS[normalizedKey as ProductKey] || PRODUCT_LABELS[key as ProductKey] || key;
}
