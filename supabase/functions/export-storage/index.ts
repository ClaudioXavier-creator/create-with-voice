// Edge Function: export-storage
// Lista todos os buckets e gera URLs assinadas para download em massa.
// Protegida por token compartilhado (STORAGE_EXPORT_TOKEN).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-export-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SIGNED_URL_TTL = 60 * 60; // 1 hora
const LIST_PAGE_SIZE = 1000;

async function listBucketRecursive(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix = "",
): Promise<string[]> {
  const files: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      // Folder = item sem metadata (id null)
      if (item.id === null) {
        const sub = prefix ? `${prefix}/${item.name}` : item.name;
        const nested = await listBucketRecursive(supabase, bucket, sub);
        files.push(...nested);
      } else {
        files.push(prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }
  return files;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const expected = Deno.env.get("STORAGE_EXPORT_TOKEN");
  const expectedAlt = Deno.env.get("STORAGE_EXPORT_TOKEN_ALT");
  const provided =
    req.headers.get("x-export-token") ??
    new URL(req.url).searchParams.get("token");
  const ok =
    (!!expected && provided === expected) ||
    (!!expectedAlt && provided === expectedAlt);
  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const onlyBucket = url.searchParams.get("bucket");

    const { data: buckets, error: bErr } =
      await supabase.storage.listBuckets();
    if (bErr) throw bErr;

    const result: Record<
      string,
      { count: number; files: { path: string; url: string }[] }
    > = {};

    const targets = onlyBucket
      ? buckets.filter((b) => b.name === onlyBucket)
      : buckets;

    for (const b of targets) {
      const paths = await listBucketRecursive(supabase, b.name);
      const signed: { path: string; url: string }[] = [];

      // createSignedUrls aceita até 100 por chamada
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { data, error } = await supabase.storage
          .from(b.name)
          .createSignedUrls(chunk, SIGNED_URL_TTL);
        if (error) throw error;
        for (const s of data ?? []) {
          if (s.signedUrl && s.path) {
            signed.push({ path: s.path, url: s.signedUrl });
          }
        }
      }

      result[b.name] = { count: signed.length, files: signed };
    }

    return new Response(
      JSON.stringify({ ok: true, generated_at: new Date().toISOString(), buckets: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("export-storage error", e);
    return new Response(
      JSON.stringify({ error: String((e as Error).message ?? e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
