// Forced redeploy - v4 - Ultra robust number parsing
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return bad('Method not allowed', 405)

  // Auth: require an authenticated user with admin/comercial role
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return bad('Unauthorized', 401)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: { user }, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userErr || !user) return bad('Unauthorized', 401)
  const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => r.role)
  if (!roles.includes('admin') && !roles.includes('comercial')) return bad('Forbidden', 403)

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  console.log('Using Account SID:', accountSid?.substring(0, 5) + '...')
  console.log('Using Auth Token length:', authToken?.length)
  console.log('From Number:', fromNumber)

  if (!accountSid || !authToken || !fromNumber) {
    return bad('Twilio configuration missing', 500)
  }

  let body: any
  try { body = await req.json() } catch { return bad('Invalid JSON') }
  const { to, message, contentSid, contentVariables } = body

  if (!to || (!message && !contentSid)) return bad('To and (Message or ContentSid) required')

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = btoa(`${accountSid}:${authToken}`)

  const formData = new URLSearchParams()
  
  // Trata o número de destino
  const cleanTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  formData.append('To', cleanTo)
  
  // Trata o número de origem (limpa qualquer prefixo e garante o formato correto)
  let rawFrom = fromNumber.trim()
  // Remove 'whatsapp:' se existir
  if (rawFrom.startsWith('whatsapp:')) rawFrom = rawFrom.substring(9)
  // Remove qualquer caractere que não seja número ou '+' no início (como dois pontos ':')
  rawFrom = rawFrom.replace(/^[^0-9+]+/, '')
  
  const cleanFrom = `whatsapp:${rawFrom}`
  formData.append('From', cleanFrom)

  if (contentSid) {
    formData.append('ContentSid', contentSid)
    if (contentVariables) {
      formData.append('ContentVariables', typeof contentVariables === 'string' ? contentVariables : JSON.stringify(contentVariables))
    }
  } else {
    formData.append('Body', message)
  }

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const resData = await response.json()
    console.log('Twilio response:', resData)
    return new Response(JSON.stringify({ ok: response.ok, data: resData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Fetch error:', err)
    return bad(err.message, 500)
  }
})
