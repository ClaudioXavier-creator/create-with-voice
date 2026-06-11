// Central WhatsApp gateway via Evolution API (self-hosted)
// Used by all modules: AgroRC, Feed_BPF, Audits_BPF, Portal de Gestão, AgroGestão
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
const EVOLUTION_INSTANCE_NAME = Deno.env.get('EVOLUTION_INSTANCE_NAME');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SendPayload {
  to: string;                  // ex: 5561996757585 ou 61996757585
  message: string;
  modulo?: string;             // ex: 'agrorc' | 'feed_bpf' | 'audits_bpf' | 'portal' | 'agrogestao'
  tipo?: string;               // ex: 'alerta_nc', 'marketing', 'lead', 'manual'
  empresa_id?: string | null;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
}

function normalizeNumber(raw: string): string {
  let n = (raw || '').replace(/\D/g, '');
  if (!n) return '';
  // Se não vier com DDI brasileiro, adiciona 55
  if (n.length <= 11) n = '55' + n;
  return n;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada (URL/KEY/INSTANCE ausentes)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SendPayload;
    const { to, message, modulo, tipo, empresa_id, user_id, metadata } = body;

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const number = normalizeNumber(to);
    if (!number) {
      return new Response(
        JSON.stringify({ error: 'Número inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
    const url = `${baseUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    });

    const data = await res.json().catch(() => ({}));
    const ok = res.ok;

    // Log persistente em whatsapp_mensagens (best-effort, não bloqueia a resposta)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('whatsapp_mensagens').insert({
        telefone: number,
        mensagem: message,
        status: ok ? 'enviada' : 'erro',
        provedor: 'evolution',
        modulo: modulo ?? null,
        tipo: tipo ?? null,
        empresa_id: empresa_id ?? null,
        user_id: user_id ?? null,
        resposta_api: data,
        metadata: metadata ?? null,
      });
    } catch (logErr) {
      console.error('whatsapp log error', logErr);
    }

    if (!ok) {
      console.error('Evolution API error', res.status, data);
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar via Evolution', details: data }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider: 'evolution', data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('evolution-send error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
