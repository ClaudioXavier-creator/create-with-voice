import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type ConnectPayload = {
  empresa_id?: string;
  instance_name?: string;
  phone_number?: string;
  action?: 'connect' | 'create' | 'status';
};

type EvolutionConfig = {
  api_url: string;
  api_key: string;
  instance_name: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function ensureCompanyAccess(admin: ReturnType<typeof createClient>, empresaId: string, userId: string) {
  const [{ data: owner }, { data: member }] = await Promise.all([
    admin.from('empresas').select('id').eq('id', empresaId).eq('user_id', userId).maybeSingle(),
    admin.from('empresa_membros').select('id').eq('empresa_id', empresaId).eq('user_id', userId).eq('ativo', true).maybeSingle(),
  ]);

  return Boolean(owner || member);
}

async function loadConfig(admin: ReturnType<typeof createClient>, empresaId: string): Promise<EvolutionConfig | null> {
  const { data, error } = await admin
    .from('whatsapp_config')
    .select('api_url, api_key, instance_name')
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar configuração WhatsApp: ${error.message}`);
  if (!data?.api_url || !data?.api_key || !data?.instance_name) return null;
  return data as EvolutionConfig;
}

async function callEvolution(url: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = await readJson(response);
  return { ok: response.ok, status: response.status, data };
}

function hasQrPayload(data: any) {
  const values = [
    data?.base64,
    data?.qrcode?.base64,
    data?.qrcode?.code,
    data?.qrcode?.pairingCode,
    data?.code,
    data?.pairingCode,
    data?.data?.base64,
    data?.data?.qrcode,
  ];
  return values.some((value) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    const normalized = value.toLowerCase().trim();
    return !normalized.includes('scan qr code')
      && !normalized.includes('whatsapp web')
      && !normalized.includes('escaneie')
      && !normalized.includes('leia o qr');
  });
}

function collectStates(data: any, acc: string[] = []): string[] {
  if (!data || typeof data !== 'object') return acc;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && ['state', 'status', 'connectionstatus', 'instancestatus'].includes(key.toLowerCase())) {
      acc.push(value.toLowerCase().trim());
    } else if (value && typeof value === 'object') {
      collectStates(value, acc);
    }
  }
  return acc;
}

function isAlreadyConnected(data: any) {
  const states = collectStates(data);
  return states.some((s) => ['open', 'connected', 'conectado'].includes(s));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Sessão inválida' }, 401);

    const body = (await req.json().catch(() => ({}))) as ConnectPayload;
    const empresaId = body.empresa_id;
    if (!empresaId) return json({ error: 'Empresa obrigatória' }, 400);

    const hasAccess = await ensureCompanyAccess(admin, empresaId, userData.user.id);
    if (!hasAccess) return json({ error: 'Sem acesso a esta empresa' }, 403);

    const config = await loadConfig(admin, empresaId);
    if (!config) return json({ error: 'Configuração Evolution incompleta para esta empresa' }, 400);

    const instanceName = (body.instance_name || config.instance_name).trim();
    if (!instanceName) return json({ error: 'Nome da instância obrigatório' }, 400);

    const baseUrl = config.api_url.replace(/\/+$/, '');

    if (body.action === 'status') {
      const list = await callEvolution(`${baseUrl}/instance/fetchInstances`, config.api_key);
      if (!list.ok) {
        return json({ error: 'Falha ao consultar Evolution', details: list.data }, list.status);
      }
      return json({ success: true, instances: list.data });
    }



    const encodedInstance = encodeURIComponent(instanceName);
    const number = body.phone_number?.replace(/\D/g, '');

    // Se a instância já está conectada (celular pareado), não há QR a gerar.
    const stateCheck = await callEvolution(`${baseUrl}/instance/connectionState/${encodedInstance}`, config.api_key);
    if (stateCheck.ok && isAlreadyConnected(stateCheck.data)) {
      return json({
        success: true,
        alreadyConnected: true,
        state: 'open',
        qrcode: stateCheck.data,
        message: 'Instância já está conectada ao WhatsApp.',
      });
    }

    let createData: unknown = null;
    if (body.action === 'create') {
      const created = await callEvolution(`${baseUrl}/instance/create`, config.api_key, {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
      createData = created.data;
      if (!created.ok && created.status !== 403 && created.status !== 409) {
        return json({ error: 'Falha ao criar instância na Evolution', details: created.data }, created.status);
      }
      if (hasQrPayload(created.data)) return json({ success: true, qrcode: created.data, created: true });
      if (isAlreadyConnected(created.data)) {
        return json({ success: true, alreadyConnected: true, state: 'open', qrcode: created.data });
      }
    }

    const query = number ? `?number=${encodeURIComponent(number)}` : '';
    const attempts = [
      () => callEvolution(`${baseUrl}/instance/connect/${encodedInstance}${query}`, config.api_key),
      () => callEvolution(`${baseUrl}/instance/connect/${encodedInstance}`, config.api_key, {
        method: 'POST',
        body: JSON.stringify(number ? { number } : {}),
      }),
      () => callEvolution(`${baseUrl}/instance/connect`, config.api_key, {
        method: 'POST',
        body: JSON.stringify(number ? { instanceName, number } : { instanceName }),
      }),
    ];

    const results = [];
    for (const attempt of attempts) {
      const result = await attempt();
      results.push({ status: result.status, data: result.data });
      if (result.ok && hasQrPayload(result.data)) {
        return json({ success: true, qrcode: result.data, create: createData });
      }
      if (result.ok && isAlreadyConnected(result.data)) {
        return json({ success: true, alreadyConnected: true, state: 'open', qrcode: result.data });
      }
    }

    return json({
      error: number
        ? 'A Evolution respondeu sem QR Code/código de pareamento. Confira se o número está correto e tente novamente. Se o celular já está pareado, desconecte em Aparelhos Conectados no WhatsApp e tente de novo.'
        : 'A Evolution respondeu sem QR Code. Se o celular já está pareado nesta instância, desconecte em Aparelhos Conectados no WhatsApp e tente de novo, ou recrie a instância.',
      details: results,
    });
  } catch (error) {
    console.error('evolution-connect error', error);
    return json({ error: (error as Error).message }, 500);
  }
});