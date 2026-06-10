import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Twilio envia application/x-www-form-urlencoded
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((v, k) => (payload[k] = String(v)));

    console.log('WhatsApp inbound:', payload);

    const from = payload.From?.replace('whatsapp:', '') ?? '';
    const body = payload.Body ?? '';
    const messageSid = payload.MessageSid ?? '';

    // Grava (best-effort) em tabela de mensagens se existir
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
      await supabase.from('whatsapp_mensagens').insert({
        message_sid: messageSid,
        from_number: from,
        body,
        raw: payload,
      });
    } catch (e) {
      console.warn('Tabela whatsapp_mensagens ausente ou insert falhou:', (e as Error).message);
    }

    // Resposta TwiML opcional (auto-reply)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Olá! Recebemos sua mensagem. Em breve um atendente da BPF_Consult retornará.</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('whatsapp-webhook error', err);
    return new Response('error', { status: 500 });
  }
});
