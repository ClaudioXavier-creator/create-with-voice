// =============================================================================
// Mapa central de price IDs do Stripe — PRODUÇÃO LIVE (BRL)
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
    mensal:    { id: "price_1TYWzMHk9UvMXJyGvLfQWY1k", mode: "subscription" },
    semestral: { id: "price_1TYWzxHk9UvMXJyGFf7Vr9xR", mode: "payment" },
    anual:     { id: "price_1TYX0wHk9UvMXJyGPscA8mrr", mode: "payment" },
  },
  intermediaria: {
    mensal:    { id: "price_1TYXAHHk9UvMXJyGlFbVoO0s", mode: "subscription" },
    semestral: { id: "price_1TYXAwHk9UvMXJyG63j9ezNK", mode: "payment" },
    anual:     { id: "price_1TYXCXHk9UvMXJyG7lN854n8", mode: "payment" },
  },
  premium: {
    mensal:    { id: "price_1TYXD7Hk9UvMXJyGm0dEUDiS", mode: "subscription" },
    semestral: { id: "price_1TYXDtHk9UvMXJyGI054bYJY", mode: "payment" },
    anual:     { id: "price_1TYXI0Hk9UvMXJyGLrIOSIJH", mode: "payment" },
  },
};

// Audits_BPF — 3 níveis × 3 períodos
export const AUDITS_BPF_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "price_1TYXIUHk9UvMXJyGKXa4zLgY", mode: "subscription" },
    semestral: { id: "price_1TYXIVHk9UvMXJyGGonlBSWe", mode: "payment" },
    anual:     { id: "price_1TYXIVHk9UvMXJyGeOoWNxBF", mode: "payment" },
  },
  consultor10: {
    mensal:    { id: "price_1TYXIWHk9UvMXJyGUudO0Ccb", mode: "subscription" },
    semestral: { id: "price_1TYXIWHk9UvMXJyG9LAlTZm6", mode: "payment" },
    anual:     { id: "price_1TYXIXHk9UvMXJyGHXFi7un8", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "price_1TYXIXHk9UvMXJyGKlae7T3U", mode: "subscription" },
    semestral: { id: "price_1TYXIYHk9UvMXJyGYtzoMarF", mode: "payment" },
    anual:     { id: "price_1TYXIYHk9UvMXJyGTywzVZwW", mode: "payment" },
  },
  // Aliases para compatibilidade
  individual: {
    mensal:    { id: "price_1TYXIUHk9UvMXJyGKXa4zLgY", mode: "subscription" },
    semestral: { id: "price_1TYXIVHk9UvMXJyGGonlBSWe", mode: "payment" },
    anual:     { id: "price_1TYXIVHk9UvMXJyGeOoWNxBF", mode: "payment" },
  },
  consultor: {
    mensal:    { id: "price_1TYXIWHk9UvMXJyGUudO0Ccb", mode: "subscription" },
    semestral: { id: "price_1TYXIWHk9UvMXJyG9LAlTZm6", mode: "payment" },
    anual:     { id: "price_1TYXIXHk9UvMXJyGHXFi7un8", mode: "payment" },
  },
};

// AgroRC CRM — 3 níveis × 3 períodos (compartilhado com NutriCRM e AgroGestão)
export const AGRO_RC_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "price_1TYXIZHk9UvMXJyGTXqrtkFm", mode: "subscription" },
    semestral: { id: "price_1TYXIZHk9UvMXJyGnJ74gDBK", mode: "payment" },
    anual:     { id: "price_1TYXIaHk9UvMXJyGT8r8x9PP", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "price_1TYXIaHk9UvMXJyGywyul5aQ", mode: "subscription" },
    semestral: { id: "price_1TYXIbHk9UvMXJyGqXTgbHCO", mode: "payment" },
    anual:     { id: "price_1TYXIbHk9UvMXJyGUpCeFv74", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "price_1TYXIcHk9UvMXJyGUJwOP26r", mode: "subscription" },
    semestral: { id: "price_1TYXIcHk9UvMXJyGB21DEKhk", mode: "payment" },
    anual:     { id: "price_1TYXIdHk9UvMXJyGxMf3dYkr", mode: "payment" },
  },
  // Aliases
  individual: {
    mensal:    { id: "price_1TYXIZHk9UvMXJyGTXqrtkFm", mode: "subscription" },
    semestral: { id: "price_1TYXIZHk9UvMXJyGnJ74gDBK", mode: "payment" },
    anual:     { id: "price_1TYXIaHk9UvMXJyGT8r8x9PP", mode: "payment" },
  },
  grupo10: {
    mensal:    { id: "price_1TYXIaHk9UvMXJyGywyul5aQ", mode: "subscription" },
    semestral: { id: "price_1TYXIbHk9UvMXJyGqXTgbHCO", mode: "payment" },
    anual:     { id: "price_1TYXIbHk9UvMXJyGUpCeFv74", mode: "payment" },
  },
  grupo20: {
    mensal:    { id: "price_1TYXIcHk9UvMXJyGUJwOP26r", mode: "subscription" },
    semestral: { id: "price_1TYXIcHk9UvMXJyGB21DEKhk", mode: "payment" },
    anual:     { id: "price_1TYXIdHk9UvMXJyGxMf3dYkr", mode: "payment" },
  },
};

// Nutri_Agro Labels (Rótulos BPF) — 3 níveis × 3 períodos
export const NUTRI_AGRO_LABELS_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "price_1TYXIdHk9UvMXJyGxLx42WPd", mode: "subscription" },
    semestral: { id: "price_1TYXIeHk9UvMXJyGF0NcJ0g6", mode: "payment" },
    anual:     { id: "price_1TYXIeHk9UvMXJyGmqrtESbB", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "price_1TYXIfHk9UvMXJyGD4nkiUgd", mode: "subscription" },
    semestral: { id: "price_1TYXIfHk9UvMXJyGF1jZEUyi", mode: "payment" },
    anual:     { id: "price_1TYXIfHk9UvMXJyGVZ2NpUJb", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "price_1TYXIgHk9UvMXJyG608EXQgD", mode: "subscription" },
    semestral: { id: "price_1TYXIgHk9UvMXJyGejTbltiL", mode: "payment" },
    anual:     { id: "price_1TYXIhHk9UvMXJyG7ebonJmE", mode: "payment" },
  },
  // Aliases
  individual: {
    mensal:    { id: "price_1TYXIdHk9UvMXJyGxLx42WPd", mode: "subscription" },
    semestral: { id: "price_1TYXIeHk9UvMXJyGF0NcJ0g6", mode: "payment" },
    anual:     { id: "price_1TYXIeHk9UvMXJyGmqrtESbB", mode: "payment" },
  },
  grupo10: {
    mensal:    { id: "price_1TYXIfHk9UvMXJyGD4nkiUgd", mode: "subscription" },
    semestral: { id: "price_1TYXIfHk9UvMXJyGF1jZEUyi", mode: "payment" },
    anual:     { id: "price_1TYXIfHk9UvMXJyGVZ2NpUJb", mode: "payment" },
  },
  grupo20: {
    mensal:    { id: "price_1TYXIgHk9UvMXJyG608EXQgD", mode: "subscription" },
    semestral: { id: "price_1TYXIgHk9UvMXJyGejTbltiL", mode: "payment" },
    anual:     { id: "price_1TYXIhHk9UvMXJyG7ebonJmE", mode: "payment" },
  },
};

// AgroGestão CRM — compartilha catálogo com AgroRC
export const AGROGESTAO_PRICES: ProductMap = AGRO_RC_PRICES;
