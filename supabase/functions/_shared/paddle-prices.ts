// =============================================================================
// Mapa central de price IDs do Paddle — SANDBOX/LIVE (BRL)
// Regras:
//   Mensal    = subscription (recurring month)
//   Semestral = payment (one-time, 15% off sobre 6× mensal)
//   Anual     = payment (one-time, 25% off sobre 12× mensal)
// =============================================================================

export type Periodo = "mensal" | "semestral" | "anual";
export type PriceEntry = { id: string; mode: "subscription" | "payment" };
export type ProductMap = Record<string, Record<Periodo, PriceEntry>>;

// Feed_BPF — 3 níveis × 3 períodos
export const FEED_BPF_PRICES: ProductMap = {
  standard: {
    mensal:    { id: "pri_01ks00h1m27q2v25w7s3w6m74z", mode: "subscription" },
    semestral: { id: "pri_01ks00h1f7y3x8g9v4x2r1p8z0", mode: "payment" },
    anual:     { id: "pri_01ks00h18zq3k4f6v2x1p7m8z9", mode: "payment" },
  },
  intermediaria: {
    mensal:    { id: "pri_01ks00h0szq2k4f6v2x1p7m8z9", mode: "subscription" },
    semestral: { id: "pri_01ks00h0m27q2v25w7s3w6m74z", mode: "payment" },
    anual:     { id: "pri_01ks00h0f7y3x8g9v4x2r1p8z0", mode: "payment" },
  },
  premium: {
    mensal:    { id: "pri_01ks00gzm27q2v25w7s3w6m74z", mode: "subscription" },
    semestral: { id: "pri_01ks00gzf7y3x8g9v4x2r1p8z0", mode: "payment" },
    anual:     { id: "pri_01ks00gz8zq3k4f6v2x1p7m8z9", mode: "payment" },
  },
};

// Feed_BPF Custom — plano único (personalizável pelo cliente)
export const FEED_BPF_CUSTOM_PRICES: ProductMap = {
  custom: {
    mensal:    { id: "feedbpf_custom_mensal",    mode: "subscription" },
    semestral: { id: "feedbpf_custom_semestral", mode: "payment" },
    anual:     { id: "feedbpf_custom_anual",     mode: "payment" },
  },
};

// Audits_BPF — 3 níveis × 3 períodos
export const AUDITS_BPF_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "pri_01ks00h20mgy228ahg5dsmx37e", mode: "subscription" },
    semestral: { id: "pri_01ks00h29n4matkmnggfb1yffh", mode: "payment" },
    anual:     { id: "pri_01ks00h2j9kh2df0c6h4nm9wqh", mode: "payment" },
  },
  consultor10: {
    mensal:    { id: "pri_01ks00h312b2kvq0tbq6a9c3qk", mode: "subscription" },
    semestral: { id: "pri_01ks00h3a1x9tbj82q0t2km55k", mode: "payment" },
    anual:     { id: "pri_01ks00h3k1b84pk6hhr7jcadfk", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "pri_01ks00h42fardrce8pct6agtcz", mode: "subscription" },
    semestral: { id: "pri_01ks00h4b1pnvyd9b5a47kv2f4", mode: "payment" },
    anual:     { id: "pri_01ks00h4krdkaj95c4cxpqkc3n", mode: "payment" },
  },
};

// AgroRC CRM — 3 níveis × 3 períodos
export const AGRO_RC_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "pri_01ks00h526c291j6rha0xdez41", mode: "subscription" },
    semestral: { id: "pri_01ks00h5ac94fq7s4kw6n4wjhr", mode: "payment" },
    anual:     { id: "pri_01ks00h5k34c37aggabmy60y12", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "pri_01ks00h617yk77d8gfqy9b86w5", mode: "subscription" },
    semestral: { id: "pri_01ks00h69hwyy873wggkg2hy70", mode: "payment" },
    anual:     { id: "pri_01ks00h6ja75dzs2z5vv65bfxs", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "pri_01ks00h70fqakm42br7b5x4ts4", mode: "subscription" },
    semestral: { id: "pri_01ks00h79q7jmdkb8ndtebqswd", mode: "payment" },
    anual:     { id: "pri_01ks00h7jqdymjj9hxhg9bzw9r", mode: "payment" },
  },
};

// Nutri_Agro Labels (Rótulos BPF) — 3 níveis × 3 períodos
export const NUTRI_AGRO_LABELS_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "pri_01ks00h82dsdrtfp74pv7sx0gx", mode: "subscription" },
    semestral: { id: "pri_01ks00h8bakbj17z7z1wtdd2v9", mode: "payment" },
    anual:     { id: "pri_01ks00h8m4qpbmh1knjassz41z", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "pri_01ks00h94247447cdf84km9r8k", mode: "subscription" },
    semestral: { id: "pri_01ks00h9cjzajndw162q6wfqqk", mode: "payment" },
    anual:     { id: "pri_01ks00h9n3g3zw13ddmqww1y2j", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "pri_01ks00ha3s2nfd9r5dr8p3321s", mode: "subscription" },
    semestral: { id: "pri_01ks00hacnxy0422xxwgpk12mg", mode: "payment" },
    anual:     { id: "pri_01ks00hangj5eat5eqpqwze2pq", mode: "payment" },
  },
};

// AgroGestão CRM
export const AGROGESTAO_PRICES: ProductMap = {
  empresa: {
    mensal:    { id: "pri_01ks00hb3s7hshtc3kwgeg4thg", mode: "subscription" },
    semestral: { id: "pri_01ks00hbct7tp4epppvhytrzm7", mode: "payment" },
    anual:     { id: "pri_01ks00hbpgbr9jy2p3qnpswqqz", mode: "payment" },
  },
  gestor10: {
    mensal:    { id: "pri_01ks00hc5fmeb4sr4fa969q1zs", mode: "subscription" },
    semestral: { id: "pri_01ks00hcdjm3jvsv41pah8xxk7", mode: "payment" },
    anual:     { id: "pri_01ks00hcppr1g8g4nf0xwvne0b", mode: "payment" },
  },
  consultor20: {
    mensal:    { id: "pri_01ks00hd4tx52v60jgf532s6q6", mode: "subscription" },
    semestral: { id: "pri_01ks00hdd8qv66nk3mft3wy2pp", mode: "payment" },
    anual:     { id: "pri_01ks00hdnmnjrynfb4cq7psrtc", mode: "payment" },
  },
};
