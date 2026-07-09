// Ações de campanha: preview, criar-fila, iniciar, pausar, cancelar, retomar
// Requer usuário autenticado com role 'admin'.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface ActionBody {
  action: 'preview_contatos' | 'gerar_fila' | 'iniciar' | 'pausar' | 'retomar' | 'cancelar' | 'reagendar';
  campanha_id?: string;
  filtros?: {
    origens?: string[];        // ['leads', 'leads_contato', 'crm_pipeline']
    etapas?: string[];         // para crm_pipeline
    produto?: string;          // filtro texto ilike
    limit?: number;
  };
}

interface Contato {
  telefone: string;
  nome: string | null;
  empresa: string | null;
  produto: string | null;
}

function normalizeTel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = String(raw).replace(/\D/g, '');
  if (!n) return null;
  if (n.length <= 11) n = '55' + n;
  if (n.length < 12 || n.length > 13) return null;
  return n;
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

async function fetchContatos(supabase: any, filtros: ActionBody['filtros']): Promise<Contato[]> {
  const origens = filtros?.origens?.length ? filtros.origens : ['leads', 'leads_contato', 'crm_pipeline'];
  const limit = Math.min(filtros?.limit ?? 2000, 5000);
  const rows: Contato[] = [];

  if (origens.includes('leads')) {
    let q = supabase.from('leads').select('nome, telefone, produto_interesse').limit(limit);
    if (filtros?.produto) q = q.ilike('produto_interesse', `%${filtros.produto}%`);
    const { data } = await q;
    (data ?? []).forEach((r: any) => rows.push({ telefone: r.telefone, nome: r.nome, empresa: null, produto: r.produto_interesse }));
  }

  if (origens.includes('leads_contato')) {
    let q = supabase.from('leads_contato').select('nome, telefone, programa').limit(limit);
    if (filtros?.produto) q = q.ilike('programa', `%${filtros.produto}%`);
    const { data } = await q;
    (data ?? []).forEach((r: any) => rows.push({ telefone: r.telefone, nome: r.nome, empresa: null, produto: r.programa }));
  }

  if (origens.includes('crm_pipeline')) {
    let q = supabase.from('crm_pipeline').select('nome, telefone, empresa, produto_interesse, etapa').limit(limit);
    if (filtros?.etapas?.length) q = q.in('etapa', filtros.etapas);
    if (filtros?.produto) q = q.ilike('produto_interesse', `%${filtros.produto}%`);
    const { data } = await q;
    (data ?? []).forEach((r: any) => rows.push({ telefone: r.telefone, nome: r.nome, empresa: r.empresa, produto: r.produto_interesse }));
  }

  // Normaliza + dedup por telefone
  const seen = new Set<string>();
  const out: Contato[] = [];
  for (const c of rows) {
    const tel = normalizeTel(c.telefone);
    if (!tel || seen.has(tel)) continue;
    seen.add(tel);
    out.push({ ...c, telefone: tel });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth: exige usuário admin
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Apenas administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json().catch(() => ({}))) as ActionBody;

    switch (body.action) {
      case 'preview_contatos': {
        const contatos = await fetchContatos(admin, body.filtros);
        return new Response(JSON.stringify({ ok: true, total: contatos.length, amostra: contatos.slice(0, 10) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'gerar_fila': {
        if (!body.campanha_id) throw new Error('campanha_id obrigatório');
        const { data: camp, error: cErr } = await admin.from('campanhas').select('*').eq('id', body.campanha_id).single();
        if (cErr || !camp) throw new Error('Campanha não encontrada');

        // Remove fila existente pendente
        await admin.from('campanha_mensagens').delete().eq('campanha_id', camp.id).eq('status', 'pendente');

        const contatos = await fetchContatos(admin, body.filtros ?? camp.filtros);
        if (contatos.length === 0) {
          return new Response(JSON.stringify({ ok: true, total: 0, msg: 'Nenhum contato encontrado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Filtrar opt-outs
        const tels = contatos.map((c) => c.telefone);
        const { data: opts } = await admin.from('campanha_optout').select('telefone').in('telefone', tels);
        const optSet = new Set((opts ?? []).map((o: any) => o.telefone));
        const filtrados = contatos.filter((c) => !optSet.has(c.telefone));

        // Agendamento com intervalos randômicos + pausa longa a cada N
        const linhas: any[] = [];
        let cursor = new Date();
        for (let i = 0; i < filtrados.length; i++) {
          const c = filtrados[i];
          const nomeCurto = (c.nome ?? '').split(' ')[0] || 'Olá';
          const mensagem = renderTemplate(camp.template_texto, {
            nome: nomeCurto,
            nome_completo: c.nome ?? '',
            empresa: c.empresa ?? '',
            produto: c.produto ?? '',
          });
          linhas.push({
            campanha_id: camp.id,
            telefone: c.telefone,
            nome: c.nome,
            empresa: c.empresa,
            produto: c.produto,
            mensagem_final: mensagem,
            agendado_para: cursor.toISOString(),
          });
          // Próximo intervalo
          const intervalo = Math.floor(Math.random() * (camp.intervalo_max_seg - camp.intervalo_min_seg + 1)) + camp.intervalo_min_seg;
          cursor = new Date(cursor.getTime() + intervalo * 1000);
          // Pausa longa a cada N
          if ((i + 1) % camp.pausa_a_cada === 0) {
            cursor = new Date(cursor.getTime() + camp.pausa_duracao_seg * 1000);
          }
        }

        // Insert em chunks
        const CHUNK = 500;
        for (let i = 0; i < linhas.length; i += CHUNK) {
          const { error: iErr } = await admin.from('campanha_mensagens').insert(linhas.slice(i, i + CHUNK));
          if (iErr) throw iErr;
        }

        await admin.from('campanhas').update({
          total: filtrados.length,
          filtros: body.filtros ?? camp.filtros,
        }).eq('id', camp.id);

        return new Response(JSON.stringify({ ok: true, total: filtrados.length, optouts_removidos: contatos.length - filtrados.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'iniciar': {
        if (!body.campanha_id) throw new Error('campanha_id obrigatório');
        await admin.from('campanhas').update({
          status: 'em_andamento',
          iniciada_em: new Date().toISOString(),
        }).eq('id', body.campanha_id);
        return new Response(JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'pausar': {
        if (!body.campanha_id) throw new Error('campanha_id obrigatório');
        await admin.from('campanhas').update({ status: 'pausada' }).eq('id', body.campanha_id);
        return new Response(JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'retomar': {
        if (!body.campanha_id) throw new Error('campanha_id obrigatório');
        // Reagenda mensagens pendentes que ficaram para trás
        const nowIso = new Date().toISOString();
        await admin.from('campanha_mensagens')
          .update({ agendado_para: nowIso })
          .eq('campanha_id', body.campanha_id)
          .eq('status', 'pendente')
          .lt('agendado_para', nowIso);
        await admin.from('campanhas').update({ status: 'em_andamento' }).eq('id', body.campanha_id);
        return new Response(JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'cancelar': {
        if (!body.campanha_id) throw new Error('campanha_id obrigatório');
        await admin.from('campanhas').update({
          status: 'cancelada',
          concluida_em: new Date().toISOString(),
        }).eq('id', body.campanha_id);
        await admin.from('campanha_mensagens')
          .update({ status: 'cancelado' })
          .eq('campanha_id', body.campanha_id)
          .eq('status', 'pendente');
        return new Response(JSON.stringify({ ok: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (e) {
    console.error('campanha-actions erro:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
