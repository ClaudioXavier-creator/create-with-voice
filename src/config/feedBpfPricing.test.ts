import { describe, expect, it } from "vitest";
import { getFeedBpfPlans } from "./feedBpfPricing";

describe("Feed_BPF — preços aprovados", () => {
  it("mensais são 297, 497 e 897", () => {
    expect([getFeedBpfPlans("entrada")[0].priceTotal, getFeedBpfPlans("intermediario")[0].priceTotal, getFeedBpfPlans("avancado")[0].priceTotal]).toEqual([297, 497, 897]);
  });
  it("semestrais têm 15% de desconto", () => {
    expect([getFeedBpfPlans("entrada")[1].priceTotal, getFeedBpfPlans("intermediario")[1].priceTotal, getFeedBpfPlans("avancado")[1].priceTotal]).toEqual([1514.7, 2534.7, 4574.7]);
  });
  it("anuais custam dez mensalidades", () => {
    expect([getFeedBpfPlans("entrada")[2].priceTotal, getFeedBpfPlans("intermediario")[2].priceTotal, getFeedBpfPlans("avancado")[2].priceTotal]).toEqual([2970, 4970, 8970]);
  });
});