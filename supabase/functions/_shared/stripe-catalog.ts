export const BILLING_PERIODS = {
  mensal: { interval: "month", intervalCount: 1 },
  semestral: { interval: "month", intervalCount: 6 },
  anual: { interval: "year", intervalCount: 1 },
} as const;
export type BillingPeriod = keyof typeof BILLING_PERIODS;
export interface CatalogPlan {
  product: string;
  tier: string;
  monthlyCents: number;
  annualCents: number;
  rank: number;
}
// BRL in cents. The approved Feed_BPF annual offer differs from other products.
export const STRIPE_PLANS: readonly CatalogPlan[] = [
  { product: "feedbpf", tier: "entrada", monthlyCents: 29700, annualCents: 297000, rank: 1 },
  { product: "feedbpf", tier: "intermediario", monthlyCents: 49700, annualCents: 497000, rank: 2 },
  { product: "feedbpf", tier: "avancado", monthlyCents: 89700, annualCents: 897000, rank: 3 },
  { product: "feedbpfcustom", tier: "custom", monthlyCents: 29700, annualCents: 267300, rank: 1 },
  ...["auditsbpf", "agrorc", "rotulos", "agrogestao"].flatMap((product) => [
    { product, tier: "empresa", monthlyCents: product === "auditsbpf" ? 29700 : 9700, annualCents: product === "auditsbpf" ? 267300 : 87300, rank: 1 },
    { product, tier: product === "auditsbpf" ? "consultor10" : "gestor10", monthlyCents: 29700, annualCents: 267300, rank: 2 },
    { product, tier: "consultor20", monthlyCents: 49700, annualCents: 447300, rank: 3 },
  ]),
];

export function resolveCatalogPrice(priceId: string) {
  for (const plan of STRIPE_PLANS) {
    for (const period of Object.keys(BILLING_PERIODS) as BillingPeriod[]) {
      if (priceId !== `${plan.product}_${plan.tier}_${period}`) continue;
      const amount = period === "mensal" ? plan.monthlyCents
        : period === "anual" ? plan.annualCents : Math.round(plan.monthlyCents * 6 * 0.85);
      return { ...plan, period, amount, ...BILLING_PERIODS[period] };
    }
  }
  throw new Error("Plano não disponível no catálogo Stripe.");
}

// This is deliberately closed until fiscal issuance and live onboarding are verified.
export function assertCheckoutEnvironment(environment: string): asserts environment is "sandbox" {
  if (environment !== "sandbox") {
    throw new Error("Cobranças reais bloqueadas até concluir a emissão fiscal e autorizar a ativação.");
  }
}

export function planChangeTiming(currentRank: number, nextRank: number) {
  if (nextRank > currentRank) return { timing: "after_prorated_payment", proration: true } as const;
  if (nextRank < currentRank) return { timing: "period_end", proration: false } as const;
  return { timing: "unchanged", proration: false } as const;
}

export function subscriptionHasAccess(status: string, periodEnd: number, now: number) {
  return ["active", "trialing", "past_due", "canceled"].includes(status) && periodEnd > now;
}