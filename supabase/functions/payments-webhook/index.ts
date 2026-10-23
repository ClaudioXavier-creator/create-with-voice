// Receptor de eventos do Stripe (?env=sandbox|live).
// Regras aprovadas: pagamento confirmado ativa a empresa/Plano; renovação automática
// em 1/6/12 meses; cancelamento mantém acesso até o fim do período pago; eventos de
// TESTE nunca ativam licença (apenas registros de preparação).
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function isoDate(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

// Preferir lookup_key (estável entre teste e live); fallback ao id interno.
function resolvePriceId(subscription: any): string {
  const item = subscription.items?.data?.[0];
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id
    || "";
}

function periodOf(subscription: any): { start: number | null; end: number | null } {
  const item = subscription.items?.data?.[0];
  // Basil (2025-03-31) coloca os períodos no item; endpoints antigos, na assinatura.
  return {
    start: item?.current_period_start ?? subscription.current_period_start ?? null,
    end: item?.current_period_end ?? subscription.current_period_end ?? null,
  };
}

async function upsertSubscriptionRow(subscription: any, env: StripeEnv) {
  const { start, end } = periodOf(subscription);
  const row = {
    user_id: subscription.metadata?.userId ?? null,
    empresa_id: subscription.metadata?.empresa_id || null,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer ?? "",
    product_id: subscription.items?.data?.[0]?.price?.product ?? "",
    price_id: resolvePriceId(subscription),
    produto: subscription.metadata?.produto ?? null,
    nivel: subscription.metadata?.nivel ?? null,
    plano: subscription.metadata?.plano ?? null,
    status: subscription.status,
    current_period_start: start ? new Date(start * 1000).toISOString() : null,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  };
  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) throw new Error(`Falha ao registrar assinatura: ${error.message}`);
}

// Espelha o estado pago em `licencas` — SOMENTE em ambiente live. Sandbox nunca ativa.
async function syncLicense(subscription: any, env: StripeEnv) {
  if (env !== "live") {
    console.log("Evento de teste: licenças não são alteradas (preparação).");
    return;
  }
  const meta = subscription.metadata ?? {};
  if (!meta.userId || !meta.produto) {
    console.error("Assinatura sem metadata.userId/produto:", subscription.id);
    return;
  }
  const { end } = periodOf(subscription);
  const status: string = subscription.status;
  const nowSec = Math.floor(Date.now() / 1000);
  const accessUntilEnd = ["active", "trialing"].includes(status)
    || (status === "canceled" && !!end && end > nowSec);

  const match = getSupabase()
    .from("licencas")
    .select("id")
    .eq("user_id", meta.userId)
    .eq("produto", meta.produto)
    .eq("empresa_id", meta.empresa_id || null);

  if (!accessUntilEnd) {
    // past_due/unpaid/paused: Stripe tenta de novo — preserva a licença atual.
    if (["canceled", "unpaid", "incomplete_expired"].includes(status) && (!end || end <= nowSec)) {
      const { data: expired } = await match.maybeSingle();
      if (expired) {
        await getSupabase()
          .from("licencas")
          .update({ status: "expirada", updated_at: new Date().toISOString() })
          .eq("id", expired.id);
      }
    }
    return;
  }
  if (!end) {
    console.error("Assinatura ativa sem período final:", subscription.id);
    return;
  }
  const licenseData = {
    user_id: meta.userId,
    empresa_id: meta.empresa_id || null,
    produto: meta.produto,
    plano: meta.plano ?? "mensal",
    nivel: meta.nivel ?? "individual",
    status: "ativa",
    data_inicio: isoDate(periodOf(subscription).start) ?? new Date().toISOString().slice(0, 10),
    data_expiracao: isoDate(end)!,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await match.maybeSingle();
  if (existing) {
    await getSupabase().from("licencas").update(licenseData).eq("id", existing.id);
  } else {
    await getSupabase().from("licencas").insert({
      ...licenseData,
      chave_licenca: `STR-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`,
    });
  }
  console.log(`Licença sincronizada (live) para empresa ${meta.empresa_id}, produto ${meta.produto}`);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  // Idempotência: reentrega do mesmo evento é ignorada.
  const eventId = event.id ?? crypto.randomUUID();
  const { data: claimed } = await getSupabase()
    .from("stripe_webhook_events")
    .insert({ event_id: eventId, event_type: event.type, environment: env, payload: event as any })
    .select("id");
  if (!claimed || claimed.length === 0) {
    console.log("Evento duplicado ignorado:", eventId);
    return;
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      await upsertSubscriptionRow(subscription, env);
      await syncLicense(subscription, env);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await upsertSubscriptionRow(subscription, env);
      await syncLicense(subscription, env);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object;
      // Métodos com liquidação diferida (SEPA etc.): cumprir só quando pago.
      if (session.payment_status === "unpaid") break;
      console.log("checkout.session.completed (pago):", session.id, env);
      break;
    }
    default:
      console.log("Evento não tratado:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Método não permitido" }, 405);
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook sem parâmetro env válido:", rawEnv);
    return respond({ received: true, ignored: "invalid env" });
  }
  const env: StripeEnv = rawEnv;
  try {
    await handleWebhook(req, env);
    return respond({ received: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return respond({ error: e instanceof Error ? e.message : "Webhook error" }, 400);
  }
});
