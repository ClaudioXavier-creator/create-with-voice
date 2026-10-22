import type { Tier } from "./tiers";

export type FeedBpfPeriod = "mensal" | "semestral" | "anual";

export interface FeedBpfPrice {
  key: FeedBpfPeriod;
  label: string;
  priceFull: number;
  priceTotal: number;
  desc: string;
}

// Valores em centavos evitam arredondamento intermediário no semestral.
const MONTHLY_CENTS: Record<Tier, number> = {
  entrada: 29700,
  intermediario: 49700,
  avancado: 89700,
};

export function getFeedBpfPlans(tier: Tier): FeedBpfPrice[] {
  const monthly = MONTHLY_CENTS[tier] / 100;
  const halfYear = Math.round(MONTHLY_CENTS[tier] * 6 * 85 / 100) / 100;
  const year = monthly * 10;
  return [
    { key: "mensal", label: "Mensal", priceFull: monthly, priceTotal: monthly, desc: "Pagamento mensal" },
    { key: "semestral", label: "Semestral", priceFull: halfYear / 6, priceTotal: halfYear, desc: "15% de desconto — 6 meses pagos antecipadamente" },
    { key: "anual", label: "Anual", priceFull: year / 12, priceTotal: year, desc: "12 meses pelo valor de 10 — pagamento antecipado" },
  ];
}

export const formatFeedBpfBRL = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });