import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Verificação do Webhook pela Meta (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Recebimento de Mensagens (POST)
  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      console.log('WhatsApp Meta payload:', JSON.stringify(payload, null, 2));

      // Extrai a mensagem básica
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from;
        const body = message.text?.body || '';
        const messageId = message.id;

        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
        await supabase.from('whatsapp_mensagens').insert({
          message_sid: messageId,
          from_number: from,
          body: body,
          direction: 'inbound',
          raw: payload,
        });
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response('Error', { status: 500 });
    }
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  return new Response('Not Found', { status: 404 });
});
