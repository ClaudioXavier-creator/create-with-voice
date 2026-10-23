import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { createStripeClient } from "../_shared/stripe.ts";
import { resolveOrCreateCustomer } from "../_shared/stripe-customer.ts";
import { assertCheckoutEnvironment, resolveCatalogPrice } from "../_shared/stripe-catalog.ts";

const inputSchema = z.object({
  empresa_id: z.string().uuid(),
  priceId: z.string().regex(/^[a-z0-9_]+$/).max(100),
  environment: z.enum(["sandbox", "live"]),
});
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Método não permitido" }, 405);
  try {
    const input = inputSchema.safeParse(await req.json());
    if (!input.success) return respond({ error: "Empresa, plano ou ambiente inválido" }, 400);
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return respond({ error: "Não autenticado" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) throw new Error("Autenticação indisponível");
    const caller = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await caller.auth.getUser(token);
    if (authError || !user) return respond({ error: "Sessão inválida" }, 401);
    const { empresa_id, priceId, environment } = input.data;
    const [company, role] = await Promise.all([
      caller.from("empresas").select("user_id").eq("id", empresa_id).maybeSingle(),
      caller.rpc("get_papel_empresa", { _empresa_id: empresa_id, _user_id: user.id }),
    ]);
    if (company.error || role.error) throw new Error("Não foi possível verificar autorização da empresa");
    if (!company.data || (company.data.user_id !== user.id && role.data !== "admin")) {
      return respond({ error: "Somente o dono ou admin da empresa pode contratar" }, 403);
    }
    assertCheckoutEnvironment(environment);
    const plan = resolveCatalogPrice(priceId);
    const stripe = createStripeClient(environment);
    const { data: prices } = await stripe.prices.list({ lookup_keys: [priceId], active: true, limit: 1 });
    const price = prices[0];
    if (!price || price.currency !== "brl" || price.unit_amount !== plan.amount ||
      price.recurring?.interval !== plan.interval || price.recurring.interval_count !== plan.intervalCount) {
      throw new Error("O catálogo Stripe não corresponde ao valor ou período aprovado");
    }
    const customer = await resolveOrCreateCustomer(stripe, { userId: user.id, email: user.email });
    const subscriptions = await stripe.subscriptions.list({ customer, status: "all", limit: 100 });
    if (subscriptions.has_more) throw new Error("Verificação adicional de assinaturas necessária");
    if (subscriptions.data.some((subscription) => subscription.metadata.empresa_id === empresa_id &&
      subscription.metadata.produto === plan.product && !["canceled", "incomplete_expired"].includes(subscription.status))) {
      return respond({ error: "Já existe uma assinatura deste produto para a empresa" }, 409);
    }
    // Inclusive taxation preserves advertised totals. Stripe still requires tax setup.
    let effectivePrice = price;
    if (price.tax_behavior !== "inclusive") {
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const product = await stripe.products.retrieve(productId);
      effectivePrice = await stripe.prices.create({
        product: productId, currency: "brl", unit_amount: plan.amount,
        recurring: { interval: plan.interval, interval_count: plan.intervalCount },
        tax_behavior: "inclusive", nickname: product.name,
        lookup_key: priceId, transfer_lookup_key: true, metadata: price.metadata,
      });
    }
    const metadata = {
      userId: user.id, empresa_id, produto: plan.product, nivel: plan.tier,
      plano: plan.period, environment, preparation_only: "true", managed_payments: "false",
    };
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription", ui_mode: "embedded_page",
      line_items: [{ price: effectivePrice.id, quantity: 1 }], customer,
      automatic_tax: { enabled: true }, customer_update: { address: "auto" },
      redirect_on_completion: "if_required",
      return_url: "https://www.bpfconsult.com.br/feedbpf?session_id={CHECKOUT_SESSION_ID}",
      metadata, subscription_data: { metadata },
    }, { idempotencyKey: `prepare-${user.id}-${empresa_id}-${priceId}-${Math.floor(Date.now() / 300000)}` });
    if (!checkout.client_secret) throw new Error("Stripe não retornou formulário de pagamento");
    return respond({ clientSecret: checkout.client_secret, sessionId: checkout.id, preparationOnly: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao preparar pagamento";
    return respond({ error: message }, 400);
  }
});