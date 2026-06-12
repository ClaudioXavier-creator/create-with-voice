// Utilitário compartilhado para chamadas Paddle via Lovable Connector Gateway.
// Razão: os secrets PADDLE_SANDBOX_API_KEY / PADDLE_LIVE_API_KEY são chaves de
// conexão do gateway Lovable — NÃO podem ser usadas como Bearer direto na
// api.paddle.com. As chamadas precisam ir para connector-gateway.lovable.dev/paddle
// com os headers X-Connection-Api-Key + Lovable-API-Key.

export type PaddleEnv = "sandbox" | "live";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev/paddle";

function getEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`${key} não configurado`);
  return v;
}

export function getPaddleEnv(): PaddleEnv {
  return Deno.env.get("PADDLE_SANDBOX_API_KEY") ? "sandbox" : "live";
}

export function getConnectionApiKey(env: PaddleEnv): string {
  return env === "sandbox"
    ? getEnv("PADDLE_SANDBOX_API_KEY")
    : getEnv("PADDLE_LIVE_API_KEY");
}

export async function paddleGatewayFetch(
  env: PaddleEnv,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const connectionApiKey = getConnectionApiKey(env);
  const lovableApiKey = getEnv("LOVABLE_API_KEY");
  return fetch(`${GATEWAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Connection-Api-Key": connectionApiKey,
      "Lovable-API-Key": lovableApiKey,
      ...(init?.headers || {}),
    },
  });
}

/**
 * Cria uma transação no Paddle e retorna a URL do checkout hospedado.
 */
export async function createPaddleCheckout(params: {
  env?: PaddleEnv;
  priceId: string;
  customerEmail: string;
  customData: Record<string, unknown>;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const env = params.env ?? getPaddleEnv();
  const res = await paddleGatewayFetch(env, "/transactions", {
    method: "POST",
    body: JSON.stringify({
      items: [{ price_id: params.priceId, quantity: 1 }],
      customer_email: params.customerEmail,
      custom_data: params.customData,
      checkout: {
        confirm_url: params.successUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const detail = data?.error?.detail || data?.error?.code || res.statusText;
    throw new Error(`Paddle gateway: ${detail}`);
  }
  const url = data?.data?.checkout?.url;
  if (!url) throw new Error("Paddle não retornou checkout.url");
  return url;
}
