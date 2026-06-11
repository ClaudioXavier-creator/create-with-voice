import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function getRecipients(): string[] {
  const fromEnv = Deno.env.get('ALERT_WHATSAPP_NUMBER')
  if (fromEnv) {
    return fromEnv.split(',').map((n) => n.trim()).filter(Boolean)
  }
  return ['5561996757585']
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { type, message, route, version, appVersion, userAgent, stack } = await req.json()

    const displayVersion = appVersion || version || 'unknown'
    const stackSnippet = stack ? `\n\n*Stack:*\n${String(stack).split('\n').slice(0, 3).join('\n')}` : ''

    const msg =
      `🚨 *ALERTA DE BUG CRÍTICO* (Audits_BPF)\n\n` +
      `*Tipo:* ${type}\n` +
      `*Mensagem:* ${message || 'N/A'}\n` +
      `*Rota:* ${route || '/'}\n` +
      `*Versão:* ${displayVersion}\n` +
      `*Navegador:* ${userAgent || 'N/A'}` +
      stackSnippet +
      `\n\n👉 Portal: https://www.bpfconsult.com.br/superadmin?tab=error-logs`

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const results: any[] = []

    for (const to of getRecipients()) {
      const { data, error } = await supabase.functions.invoke('evolution-send', {
        body: { to, message: msg, modulo: 'audits_bpf', tipo: 'alerta_erro' },
      })
      results.push({ to, ok: !error, data, error: error?.message })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('notify-error-whatsapp error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
