import { describe, expect, it } from "vitest";
import { assertCheckoutEnvironment, BILLING_PERIODS, planChangeTiming, resolveCatalogPrice, subscriptionHasAccess } from "../../supabase/functions/_shared/stripe-catalog";
import { getFeedBpfPlans } from "./feedBpfPricing";

describe("Regras aprovadas de assinatura Stripe", () => {
  it("os nove preços Feed_BPF coincidem com a oferta aprovada", () => {
    for (const tier of ["entrada", "intermediario", "avancado"] as const) {
      for (const price of getFeedBpfPlans(tier)) {
        expect(resolveCatalogPrice(`feedbpf_${tier}_${price.key}`).amount).toBe(Math.round(price.priceTotal * 100));
      }
    }
  });
  it("renova a cada um, seis ou doze meses", () => {
    expect(BILLING_PERIODS).toEqual({ mensal: { interval: "month", intervalCount: 1 }, semestral: { interval: "month", intervalCount: 6 }, anual: { interval: "year", intervalCount: 1 } });
  });
  it("cancelamento preserva acesso até o fim do período pago", () => {
    expect(subscriptionHasAccess("canceled", 200, 199)).toBe(true);
    expect(subscriptionHasAccess("canceled", 200, 200)).toBe(false);
  });
  it("upgrade somente depois do pagamento proporcional", () => {
    expect(planChangeTiming(1, 2)).toEqual({ timing: "after_prorated_payment", proration: true });
  });
  it("downgrade apenas na próxima renovação", () => {
    expect(planChangeTiming(3, 1)).toEqual({ timing: "period_end", proration: false });
  });
  it("bloqueia cobranças reais enquanto falta habilitação fiscal", () => {
    expect(() => assertCheckoutEnvironment("live")).toThrow("Cobranças reais bloqueadas");
    expect(() => assertCheckoutEnvironment("sandbox")).not.toThrow();
  });
  it("não permite comprar o NutriCRM descontinuado", () => {
    expect(() => resolveCatalogPrice("nutricrm_empresa_mensal")).toThrow();
  });
});