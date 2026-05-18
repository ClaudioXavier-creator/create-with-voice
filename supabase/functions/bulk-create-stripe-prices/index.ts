import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

type Item = { name: string; amount: number; recurring?: boolean };

const ITEMS: Item[] = [
  // Audits
  { name: "Audits_BPF Empresa", amount: 24900, recurring: true },
  { name: "Audits_BPF Empresa — Semestral", amount: 126990 },
  { name: "Audits_BPF Empresa — Anual", amount: 224100 },
  { name: "Audits_BPF Consultor 10", amount: 49900, recurring: true },
  { name: "Audits_BPF Consultor 10 — Semestral", amount: 254490 },
  { name: "Audits_BPF Consultor 10 — Anual", amount: 449100 },
  { name: "Audits_BPF Consultor 20", amount: 89900, recurring: true },
  { name: "Audits_BPF Consultor 20 — Semestral", amount: 458590 },
  { name: "Audits_BPF Consultor 20 — Anual", amount: 809100 },
  // AgroRC (compartilhado com NutriCRM e AgroGestão)
  { name: "AgroRC CRM Empresa", amount: 9700, recurring: true },
  { name: "AgroRC CRM Empresa — Semestral", amount: 49470 },
  { name: "AgroRC CRM Empresa — Anual", amount: 87300 },
  { name: "AgroRC CRM Gestor 10", amount: 29700, recurring: true },
  { name: "AgroRC CRM Gestor 10 — Semestral", amount: 151470 },
  { name: "AgroRC CRM Gestor 10 — Anual", amount: 267300 },
  { name: "AgroRC CRM Consultor 20", amount: 49700, recurring: true },
  { name: "AgroRC CRM Consultor 20 — Semestral", amount: 253470 },
  { name: "AgroRC CRM Consultor 20 — Anual", amount: 447300 },
  // Rótulos
  { name: "Rótulos BPF Individual", amount: 9700, recurring: true },
  { name: "Rótulos BPF Individual — Semestral", amount: 49700 },
  { name: "Rótulos BPF Individual — Anual", amount: 89700 },
  { name: "Rótulos BPF Grupo 10", amount: 45700, recurring: true },
  { name: "Rótulos BPF Grupo 10 — Semestral", amount: 233070 },
  { name: "Rótulos BPF Grupo 10 — Anual", amount: 411300 },
  { name: "Rótulos BPF Grupo 20", amount: 85700, recurring: true },
  { name: "Rótulos BPF Grupo 20 — Semestral", amount: 437070 },
  { name: "Rótulos BPF Grupo 20 — Anual", amount: 771300 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const results: any[] = [];
  for (const it of ITEMS) {
    try {
      const product = await stripe.products.create({ name: it.name });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: it.amount,
        currency: "brl",
        ...(it.recurring ? { recurring: { interval: "month" } } : {}),
      });
      results.push({ name: it.name, amount: it.amount, recurring: !!it.recurring, product: product.id, price: price.id });
    } catch (e: any) {
      results.push({ name: it.name, error: e.message });
    }
  }
  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
