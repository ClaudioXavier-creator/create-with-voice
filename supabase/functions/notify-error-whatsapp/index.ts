import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RECIPIENTS = [
  '5561996757585', // Seu telefone
  // Adicione mais números aqui no futuro
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { type, message, route, version, appVersion, userAgent, stack } = await req.json()

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio config missing')
      return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 })
    }

    const auth = btoa(`${accountSid}:${authToken}`)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const results = []
    for (const to of RECIPIENTS) {
      const body = new URLSearchParams()
      body.append('To', `whatsapp:${to}`)
      
      let rawFrom = fromNumber.trim()
      if (rawFrom.startsWith('whatsapp:')) rawFrom = rawFrom.substring(9)
      rawFrom = rawFrom.replace(/^[^0-9+]+/, '')
      body.append('From', `whatsapp:${rawFrom}`)
      
      const displayVersion = appVersion || version || 'unknown'
      const stackSnippet = stack ? `\n\n*Stack Trace:* \n\`\`\`\n${stack.split('\n').slice(0, 3).join('\n')}\n\`\`\`` : ''
      
      const msg = `🚨 *ALERTA DE BUG CRÍTICO*\n\n` +
                  `*Tipo:* ${type}\n` +
                  `*Mensagem:* ${message || 'N/A'}\n` +
                  `*Rota:* ${route || '/'}\n` +
                  `*Versão:* ${displayVersion}\n` +
                  `*Navegador:* ${userAgent || 'N/A'}` +
                  stackSnippet +
                  `\n\n👉 Visualize no Portal: https://www.bpfconsult.com.br/superadmin?tab=error-logs`

      body.append('Body', msg)

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })
      
      const data = await res.json()
      results.push({ to, ok: res.ok, sid: data.sid })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Error sending WhatsApp notification:', err)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
