// Teste rápido do gateway Paddle. Remover após validação.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { paddleGatewayFetch, getPaddleEnv } from "../_shared/paddle.ts";

serve(async (_req) => {
  try {
    const env = getPaddleEnv();
    const res = await paddleGatewayFetch(env, "/products?per_page=1");
    const body = await res.text();
    return new Response(
      JSON.stringify({ env, status: res.status, body: body.slice(0, 500) }, null, 2),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
