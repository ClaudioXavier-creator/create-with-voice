import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Extrai o texto de qualquer um dos formatos de mensagem do Baileys/Evolution
function extractText(msg: any): string {
  if (!msg) return '';
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.title ||
    ''
  );
}

function digitsOnly(jid?: string): string {
  if (!jid) return '';
  return jid.split('@')[0]?.replace(/\D/g, '') || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const event: string = payload?.event || '';
    console.log('[evolution-webhook] event:', event, 'instance:', payload?.instance);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Mensagem recebida
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const data = payload.data || {};
      const key = data.key || {};
      const fromMe = !!key.fromMe;
      const remoteJid: string = key.remoteJid || '';
      const messageId: string = key.id || '';
      const text = extractText(data.message);
      const from = digitsOnly(remoteJid);

      if (!fromMe && from) {
        await supabase.from('whatsapp_mensagens').insert({
          message_sid: messageId,
          from_number: from,
          body: text,
          direction: 'inbound',
          status: 'received',
          raw: payload,
        });
        console.log('[evolution-webhook] mensagem salva de', from);
      }
    }

    // Atualização de status de envio (entregue, lida, etc.)
    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      const data = payload.data || {};
      const messageId = data.key?.id || data.keyId;
      const newStatus = data.status || data.update?.status;
      if (messageId && newStatus) {
        await supabase
          .from('whatsapp_mensagens')
          .update({ status: String(newStatus).toLowerCase() })
          .eq('message_sid', messageId);
      }
    }

    // Conexão (QR atualizou, conectou, desconectou) - apenas log
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      console.log('[evolution-webhook] connection:', JSON.stringify(payload.data));
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[evolution-webhook] error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, // 200 para a Evolution não ficar reenviando indefinidamente
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
