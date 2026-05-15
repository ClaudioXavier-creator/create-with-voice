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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return bad('Missing authorization', 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // 1. Validate User
  const { data: { user }, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userErr || !user) return bad('Unauthorized', 401)

  // 2. Check Roles
  const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => r.role)
  if (!roles.includes('admin') && !roles.includes('comercial')) return bad('Forbidden', 403)

  let body: any
  try { body = await req.json() } catch { return bad('Invalid JSON') }

  const { recipients, emailSubject, emailBodyHtml, senderName, channel } = body

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return bad('Recipients required')
  
  if (channel === 'email') {
    if (!emailSubject || !emailBodyHtml) return bad('Subject and Body required for email')
    
    const results = []
    for (const rec of recipients) {
      if (!rec.email) continue
      
      const messageId = `marketing-${crypto.randomUUID()}`
      
      // We'll call the send-transactional-email function or use the RPC directly
      // Using the RPC is faster for bulk
      const { error: enqueueError } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'crm-message',
          recipientEmail: rec.email,
          templateData: {
            assunto: emailSubject.replace('{{nome}}', rec.nome || 'Cliente'),
            corpo_html: emailBodyHtml.replace('{{nome}}', rec.nome || 'Cliente'),
            remetente_nome: senderName
          }
        }
      })

      results.push({ email: rec.email, success: !enqueueError, error: enqueueError })
      
      // Optional: Add to CRM interaction history if it's a pipeline lead
      if (rec.pipeline_id && !enqueueError) {
        await admin.from('crm_interacoes').insert({
          pipeline_id: rec.pipeline_id,
          tipo: 'email',
          descricao: `[Marketing] E-mail enviado: ${emailSubject}`,
          autor_id: user.id,
          autor_nome: user.email
        })
      }
    }
    
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return bad('Invalid channel')
})
