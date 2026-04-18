/**
 * Gera hash SHA-256 de uma string usando Web Crypto API.
 * Usado para selo antifraude (Decreto 12.031/2024).
 */
export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Gera carimbo padrão para registro chão de fábrica.
 * Inclui dados-chave + timestamp ISO para imutabilidade.
 */
export async function gerarCarimbo(payload: Record<string, unknown>): Promise<{
  hash: string;
  timestamp: string;
  userAgent: string;
}> {
  const timestamp = new Date().toISOString();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const canonical = JSON.stringify({ ...payload, timestamp });
  const hash = await sha256(canonical);
  return { hash, timestamp, userAgent };
}
