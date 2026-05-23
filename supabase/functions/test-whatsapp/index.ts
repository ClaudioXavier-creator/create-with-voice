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
  const { to, message } = body

  if (!to || !message) return bad('To and Message required')

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = btoa(`${accountSid}:${authToken}`)

  const formData = new URLSearchParams()
  formData.append('To', `whatsapp:${to}`)
  formData.append('From', `whatsapp:${fromNumber}`)
  formData.append('Body', message)

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
