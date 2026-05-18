// =============================================================================
// Mapa central de price IDs do Stripe — produção (BRL)
// Regras:
//   Mensal    = subscription (recurring month)
//   Semestral = payment (one-time, 15% off sobre 6× mensal)
//   Anual     = payment (one-time, 25% off sobre 12× mensal)
// =============================================================================

export type Periodo = "mensal" | "semestral" | "anual";
export type PriceEntry = { id: string; mode: "subscription" | "payment" };
export type ProductMap = Record<string, Record<Periodo, PriceEntry>>;

// Feed_BPF — 3 níveis × 3 períodos
export const FEED_BPF_PRICES: ProductMap = {
  standard: {
    mensal:    { id: "price_1TYVRyHDmwi8j6XZcw83NOgn", mode: "subscription" },
    semestral: { id: "price_1TYVSUHDmwi8j6XZynGI0DWm", mode: "payment" },
    anual:     { id: "price_1TYVZDHDmwi8j6XZmpHmAXkX", mode: "payment" },
  },
  intermediaria: {
    mensal:    { id: "price_1TYVZjHDmwi8j6XZDHIcRikw", mode: "subscription" },
    semestral: { id: "price_1TYVbUHDmwi8j6XZm0UDOWYp", mode: "payment" },
    anual:     { id: "price_1TYVcQHDmwi8j6XZIUi8XKBN", mode: "payment" },
  },
  premium: {
    mensal:    { id: "price_1TYVcQHDmwi8j6XZigGCLDNe", mode: "subscription" },
    semestral: { id: "price_1TYVcRHDmwi8j6XZaOCz6PxR", mode: "payment" },
    anual:     { id: "price_1TYVcRHDmwi8j6XZ0veChm4B", mode: "payment" },
  },
};

// Audits_BPF — 3 níveis × 3 períodos
export const AUDITS_BPF_PRICES: ProductMap = {
  // 1 empresa, até 10 usuários
  empresa: {
    mensal:    { id: "price_1TYVcSHDmwi8j6XZxiUOYUUf", mode: "subscription" },
    semestral: { id: "price_1TYVcSHDmwi8j6XZxE9BpoLa", mode: "payment" },
    anual:     { id: "price_1TYVcTHDmwi8j6XZoCK4Bjet", mode: "payment" },
  },
  // Consultor — até 10 empresas
  consultor10: {
    mensal:    { id: "price_1TYVcTHDmwi8j6XZLUrx1WdR", mode: "subscription" },
    semestral: { id: "price_1TYVcUHDmwi8j6XZS9ttYJfp", mode: "payment" },
    anual:     { id: "price_1TYVcUHDmwi8j6XZAGXYBLS6", mode: "payment" },
  },
  // Consultor — até 20 empresas
  consultor20: {
    mensal:    { id: "price_1TYVcVHDmwi8j6XZLiuVjkxc", mode: "subscription" },
    semestral: { id: "price_1TYVcVHDmwi8j6XZQdqtaubv", mode: "payment" },
    anual:     { id: "price_1TYVcWHDmwi8j6XZVT1gElpW", mode: "payment" },
  },
  // Aliases para compatibilidade
  individual: {
    mensal:    { id: "price_1TYVcSHDmwi8j6XZxiUOYUUf", mode: "subscription" },
    semestral: { id: "price_1TYVcSHDmwi8j6XZxE9BpoLa", mode: "payment" },
    anual:     { id: "price_1TYVcTHDmwi8j6XZoCK4Bjet", mode: "payment" },
  },
  consultor: {
    mensal:    { id: "price_1TYVcTHDmwi8j6XZLUrx1WdR", mode: "subscription" },
    semestral: { id: "price_1TYVcUHDmwi8j6XZS9ttYJfp", mode: "payment" },
    anual:     { id: "price_1TYVcUHDmwi8j6XZAGXYBLS6", mode: "payment" },
  },
};

// Agro RC CRM — 3 níveis × 3 períodos
export const AGRO_RC_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "price_1TYVcWHDmwi8j6XZUn1f5z2A", mode: "subscription" },
    semestral: { id: "price_1TYVcXHDmwi8j6XZMCwTU4vg", mode: "payment" },
    anual:     { id: "price_1TYVcXHDmwi8j6XZbSg3CFQG", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "price_1TYVcYHDmwi8j6XZtmjp3UiS", mode: "subscription" },
    semestral: { id: "price_1TYVcYHDmwi8j6XZlRjzCAWt", mode: "payment" },
    anual:     { id: "price_1TYVcZHDmwi8j6XZYcJS6YC8", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "price_1TYVcZHDmwi8j6XZkAaK2FVV", mode: "subscription" },
    semestral: { id: "price_1TYVcaHDmwi8j6XZqGcizVoq", mode: "payment" },
    anual:     { id: "price_1TYVcaHDmwi8j6XZkeMXz3Qj", mode: "payment" },
  },
  // Aliases
  individual: {
    mensal:    { id: "price_1TYVcWHDmwi8j6XZUn1f5z2A", mode: "subscription" },
    semestral: { id: "price_1TYVcXHDmwi8j6XZMCwTU4vg", mode: "payment" },
    anual:     { id: "price_1TYVcXHDmwi8j6XZbSg3CFQG", mode: "payment" },
  },
  grupo10: {
    mensal:    { id: "price_1TYVcYHDmwi8j6XZtmjp3UiS", mode: "subscription" },
    semestral: { id: "price_1TYVcYHDmwi8j6XZlRjzCAWt", mode: "payment" },
    anual:     { id: "price_1TYVcZHDmwi8j6XZYcJS6YC8", mode: "payment" },
  },
  grupo20: {
    mensal:    { id: "price_1TYVcZHDmwi8j6XZkAaK2FVV", mode: "subscription" },
    semestral: { id: "price_1TYVcaHDmwi8j6XZqGcizVoq", mode: "payment" },
    anual:     { id: "price_1TYVcaHDmwi8j6XZkeMXz3Qj", mode: "payment" },
  },
};

// Nutri_Agro Labels — 3 níveis × 3 períodos
export const NUTRI_AGRO_LABELS_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "price_1TYVcbHDmwi8j6XZDkYGH3MC", mode: "subscription" },
    semestral: { id: "price_1TYVcbHDmwi8j6XZJHVI3xP7", mode: "payment" },
    anual:     { id: "price_1TYVccHDmwi8j6XZD3lKuXYw", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "price_1TYVccHDmwi8j6XZovdlBfka", mode: "subscription" },
    semestral: { id: "price_1TYVcdHDmwi8j6XZlUXe6yBE", mode: "payment" },
    anual:     { id: "price_1TYVcdHDmwi8j6XZuNXGNnHC", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "price_1TYVceHDmwi8j6XZ2hKn8MEb", mode: "subscription" },
    semestral: { id: "price_1TYVceHDmwi8j6XZ9UTzOrDP", mode: "payment" },
    anual:     { id: "price_1TYVcfHDmwi8j6XZXsByZFom", mode: "payment" },
  },
  // Aliases
  individual: {
    mensal:    { id: "price_1TYVcbHDmwi8j6XZDkYGH3MC", mode: "subscription" },
    semestral: { id: "price_1TYVcbHDmwi8j6XZJHVI3xP7", mode: "payment" },
    anual:     { id: "price_1TYVccHDmwi8j6XZD3lKuXYw", mode: "payment" },
  },
  grupo10: {
    mensal:    { id: "price_1TYVccHDmwi8j6XZovdlBfka", mode: "subscription" },
    semestral: { id: "price_1TYVcdHDmwi8j6XZlUXe6yBE", mode: "payment" },
    anual:     { id: "price_1TYVcdHDmwi8j6XZuNXGNnHC", mode: "payment" },
  },
  grupo20: {
    mensal:    { id: "price_1TYVceHDmwi8j6XZ2hKn8MEb", mode: "subscription" },
    semestral: { id: "price_1TYVceHDmwi8j6XZ9UTzOrDP", mode: "payment" },
    anual:     { id: "price_1TYVcfHDmwi8j6XZXsByZFom", mode: "payment" },
  },
};

// AgroGestão CRM — 3 níveis × 3 períodos
export const AGROGESTAO_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "price_1TYVcfHDmwi8j6XZWBoYNOHk", mode: "subscription" },
    semestral: { id: "price_1TYVcgHDmwi8j6XZeqFB7X9j", mode: "payment" },
    anual:     { id: "price_1TYVcgHDmwi8j6XZJkGv8LOV", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "price_1TYVchHDmwi8j6XZK7sTuJjA", mode: "subscription" },
    semestral: { id: "price_1TYVchHDmwi8j6XZU88eUO8q", mode: "payment" },
    anual:     { id: "price_1TYVciHDmwi8j6XZAM599LPg", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "price_1TYVciHDmwi8j6XZzwtrwUVX", mode: "subscription" },
    semestral: { id: "price_1TYVcjHDmwi8j6XZdOqfupLY", mode: "payment" },
    anual:     { id: "price_1TYVcjHDmwi8j6XZaKgG21EL", mode: "payment" },
  },
};
