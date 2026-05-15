import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valor unitário por empresa excedente (mensal individual + 25%)
const EXCEDENTE_MENSAL_VALOR_CENTAVOS = 31125; // R$ 311,25 (R$ 249 × 1,25)

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { licenca_id, empresa_id } = await req.json();
    if (!licenca_id || !empresa_id) throw new Error("licenca_id e empresa_id são obrigatórios");

    const admin = createClient(supabaseUrl, service);

    // Chama RPC que vincula e detecta excedente
    const { data: result, error: rpcErr } = await admin.rpc("vincular_empresa_licenca_consultor", {
      _licenca_id: licenca_id,
      _empresa_id: empresa_id,
    });
    if (rpcErr) throw rpcErr;
    if (!result?.ok) throw new Error(result?.error || "Falha ao vincular");

    // Se não é excedente, retorna sucesso direto
    if (!result.excedente) {
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // EXCEDENTE — cobrar via Stripe
    const { data: lic } = await admin.from("licencas").select("*").eq("id", licenca_id).single();
    if (!lic) throw new Error("Licença não encontrada");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Identifica/Cria customer
    let customerId = lic.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      customerId = customers.data[0]?.id;
      if (!customerId) {
        const c = await stripe.customers.create({ email: user.email! });
        customerId = c.id;
      }
    }

    let invoiceUrl: string | null = null;
    let invoiceId: string | null = null;

    if (lic.plano === "mensal") {
      // Invoice avulsa one-time
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: EXCEDENTE_MENSAL_VALOR_CENTAVOS,
        currency: "brl",
        description: `Empresa adicional — Audits BPF Consultor (excedente)`,
      });
      const inv = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: 7,
        metadata: { user_id: user.id, empresa_id, licenca_id, tipo: "excedente_mensal" },
      });
      const finalized = await stripe.invoices.finalizeInvoice(inv.id!);
      invoiceUrl = finalized.hosted_invoice_url ?? null;
      invoiceId = finalized.id ?? null;
    } else {
      // Semestral/Anual — Invoice cheia +25% baseada no plano
      // Semestral/Anual — Cobrança exata informada pelo usuário (≈ +25% do plano base)
      const VALORES_EXCEDENTE: Record<string, number> = {
        semestral: 318112, // R$ 3.181,12 (R$ 2.544,90 × 1,25 ≈)
        anual:     561375, // R$ 5.613,75 (R$ 4.491,00 × 1,25)
      };

      const valorFinal = VALORES_EXCEDENTE[lic.plano] ?? 0;
      if (valorFinal === 0) throw new Error("Configuração de valor excedente não encontrada para este plano");

      await stripe.invoiceItems.create({
        customer: customerId,
        amount: valorFinal,
        currency: "brl",
        description: `Empresa adicional — Audits BPF Consultor ${lic.plano} (excedente)`,
      });
      const inv = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: 7,
        metadata: { user_id: user.id, empresa_id, licenca_id, tipo: `excedente_${lic.plano}` },
      });
      const finalized = await stripe.invoices.finalizeInvoice(inv.id!);
      invoiceUrl = finalized.hosted_invoice_url ?? null;
      invoiceId = finalized.id ?? null;
    }

    // Salva o invoice_id no vínculo
    if (invoiceId) {
      await admin
        .from("licenca_empresas")
        .update({ stripe_invoice_id: invoiceId })
        .eq("id", result.vinculo_id);
    }

    return new Response(JSON.stringify({ ...result, invoice_url: invoiceUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
