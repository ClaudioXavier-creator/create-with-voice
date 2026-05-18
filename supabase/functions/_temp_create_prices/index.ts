import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Item = { name: string; desc: string; amount: number; recurring?: boolean };

const ITEMS: Item[] = [
  // ===== Feed_BPF — Intermediária Anual / Premium 3 =====
  { name: "Feed_BPF — Intermediária Anual",   desc: "1 licença, até 20 usuários. Pagamento único — 25% desconto.", amount: 627300 },
  { name: "Feed_BPF — Premium Mensal",        desc: "1 licença, usuários ilimitados. Cobrança mensal.",            amount: 129700, recurring: true },
  { name: "Feed_BPF — Premium Semestral",     desc: "1 licença, usuários ilimitados. Pagamento único — 15% desc.", amount: 661470 },
  { name: "Feed_BPF — Premium Anual",         desc: "1 licença, usuários ilimitados. Pagamento único — 25% desc.", amount: 1167300 },

  // ===== Audits_BPF — 9 =====
  { name: "Audits_BPF — Empresa Standard Mensal",    desc: "1 empresa, até 10 usuários. Cobrança mensal.",           amount: 29700, recurring: true },
  { name: "Audits_BPF — Empresa Standard Semestral", desc: "1 empresa, até 10 usuários. Pag. único — 15% desc.",     amount: 151470 },
  { name: "Audits_BPF — Empresa Standard Anual",     desc: "1 empresa, até 10 usuários. Pag. único — 25% desc.",     amount: 267300 },
  { name: "Audits_BPF — Consultor 10 Mensal",        desc: "Consultor — até 10 empresas. Cobrança mensal.",          amount: 29700, recurring: true },
  { name: "Audits_BPF — Consultor 10 Semestral",     desc: "Consultor — até 10 empresas. Pag. único — 15% desc.",    amount: 151470 },
  { name: "Audits_BPF — Consultor 10 Anual",         desc: "Consultor — até 10 empresas. Pag. único — 25% desc.",    amount: 267300 },
  { name: "Audits_BPF — Consultor 20 Mensal",        desc: "Consultor — até 20 empresas. Cobrança mensal.",          amount: 49700, recurring: true },
  { name: "Audits_BPF — Consultor 20 Semestral",     desc: "Consultor — até 20 empresas. Pag. único — 15% desc.",    amount: 253470 },
  { name: "Audits_BPF — Consultor 20 Anual",         desc: "Consultor — até 20 empresas. Pag. único — 25% desc.",    amount: 447300 },

  // ===== Agro RC CRM — 9 =====
  { name: "Agro RC CRM — Empresa Mensal",                desc: "1 licença. Cobrança mensal.",                       amount: 9700,  recurring: true },
  { name: "Agro RC CRM — Empresa Semestral",             desc: "1 licença. Pag. único — 15% desc.",                 amount: 49470 },
  { name: "Agro RC CRM — Empresa Anual",                 desc: "1 licença. Pag. único — 25% desc.",                 amount: 87300 },
  { name: "Agro RC CRM — Gestor Comercial Mensal",       desc: "Até 10 representantes. Cobrança mensal.",           amount: 29700, recurring: true },
  { name: "Agro RC CRM — Gestor Comercial Semestral",    desc: "Até 10 representantes. Pag. único — 15% desc.",     amount: 151470 },
  { name: "Agro RC CRM — Gestor Comercial Anual",        desc: "Até 10 representantes. Pag. único — 25% desc.",     amount: 267300 },
  { name: "Agro RC CRM — Consultor Comercial Mensal",    desc: "Até 20 representantes. Cobrança mensal.",           amount: 49700, recurring: true },
  { name: "Agro RC CRM — Consultor Comercial Semestral", desc: "Até 20 representantes. Pag. único — 15% desc.",     amount: 253470 },
  { name: "Agro RC CRM — Consultor Comercial Anual",     desc: "Até 20 representantes. Pag. único — 25% desc.",     amount: 447300 },

  // ===== Nutri_Agro Labels — 9 =====
  { name: "Nutri_Agro Labels — Empresa Mensal",                desc: "1 licença. Cobrança mensal.",                       amount: 9700,  recurring: true },
  { name: "Nutri_Agro Labels — Empresa Semestral",             desc: "1 licença. Pag. único — 15% desc.",                 amount: 49470 },
  { name: "Nutri_Agro Labels — Empresa Anual",                 desc: "1 licença. Pag. único — 25% desc.",                 amount: 87300 },
  { name: "Nutri_Agro Labels — Gestor Comercial Mensal",       desc: "Até 10 representantes. Cobrança mensal.",           amount: 29700, recurring: true },
  { name: "Nutri_Agro Labels — Gestor Comercial Semestral",    desc: "Até 10 representantes. Pag. único — 15% desc.",     amount: 151470 },
  { name: "Nutri_Agro Labels — Gestor Comercial Anual",        desc: "Até 10 representantes. Pag. único — 25% desc.",     amount: 267300 },
  { name: "Nutri_Agro Labels — Consultor Comercial Mensal",    desc: "Até 20 representantes. Cobrança mensal.",           amount: 49700, recurring: true },
  { name: "Nutri_Agro Labels — Consultor Comercial Semestral", desc: "Até 20 representantes. Pag. único — 15% desc.",     amount: 253470 },
  { name: "Nutri_Agro Labels — Consultor Comercial Anual",     desc: "Até 20 representantes. Pag. único — 25% desc.",     amount: 447300 },

  // ===== AgroGestão CRM — 9 =====
  { name: "AgroGestão CRM — Empresa Mensal",                desc: "1 licença. Cobrança mensal.",                       amount: 9700,  recurring: true },
  { name: "AgroGestão CRM — Empresa Semestral",             desc: "1 licença. Pag. único — 15% desc.",                 amount: 49470 },
  { name: "AgroGestão CRM — Empresa Anual",                 desc: "1 licença. Pag. único — 25% desc.",                 amount: 87300 },
  { name: "AgroGestão CRM — Gestor Comercial Mensal",       desc: "Até 10 representantes. Cobrança mensal.",           amount: 29700, recurring: true },
  { name: "AgroGestão CRM — Gestor Comercial Semestral",    desc: "Até 10 representantes. Pag. único — 15% desc.",     amount: 151470 },
  { name: "AgroGestão CRM — Gestor Comercial Anual",        desc: "Até 10 representantes. Pag. único — 25% desc.",     amount: 267300 },
  { name: "AgroGestão CRM — Consultor Comercial Mensal",    desc: "Até 20 representantes. Cobrança mensal.",           amount: 49700, recurring: true },
  { name: "AgroGestão CRM — Consultor Comercial Semestral", desc: "Até 20 representantes. Pag. único — 15% desc.",     amount: 253470 },
  { name: "AgroGestão CRM — Consultor Comercial Anual",     desc: "Até 20 representantes. Pag. único — 25% desc.",     amount: 447300 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const results: any[] = [];
    for (const it of ITEMS) {
      const product = await stripe.products.create({ name: it.name, description: it.desc });
      const price = await stripe.prices.create({
        product: product.id,
        currency: "brl",
        unit_amount: it.amount,
        ...(it.recurring ? { recurring: { interval: "month" } } : {}),
      });
      results.push({ name: it.name, product_id: product.id, price_id: price.id, amount: it.amount, recurring: !!it.recurring });
    }
    return new Response(JSON.stringify({ ok: true, count: results.length, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
