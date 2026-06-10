import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER'); // ex: +14155238886 (sandbox)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: 'Twilio secrets não configurados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { to, message, mediaUrl } = body as { to?: string; message?: string; mediaUrl?: string };

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: to (E.164, ex: +5511999999999) e message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromFormatted = TWILIO_PHONE_NUMBER.startsWith('whatsapp:')
      ? TWILIO_PHONE_NUMBER
      : `whatsapp:${TWILIO_PHONE_NUMBER}`;

    const params = new URLSearchParams({
      To: toFormatted,
      From: fromFormatted,
      Body: message,
    });
    if (mediaUrl) params.append('MediaUrl', mediaUrl);

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Twilio error', resp.status, data);
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar', details: data }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: data.sid, status: data.status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('send-whatsapp error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
