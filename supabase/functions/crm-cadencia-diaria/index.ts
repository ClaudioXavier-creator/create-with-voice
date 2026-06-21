// Régua automática do CRM — roda 1x por dia (cron 09:00 America/Sao_Paulo)
// Para cada lead no pipeline, aplica SLA por etapa:
//   novo         > 1 dia  → cria tarefa "Fazer primeiro contato"
//   novo         > 3 dias → move para "qualificacao" + tarefa de qualificação
//   qualificacao > 5 dias → tarefa de re-engajamento
//   proposta     > 7 dias → tarefa crítica + alerta WhatsApp
// Nunca duplica tarefa do mesmo tipo aberta no mesmo lead (idempotente).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ALERT_WHATSAPP =
  Deno.env.get("ALERT_WHATSAPP_NUMBER") ?? "5561996757585";

interface PipelineRow {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  produto_interesse: string | null;
  etapa: string;
  updated_at: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
}

interface Rule {
  etapa: string;
  diasSLA: number;
  tituloTarefa: string;
  descricaoTarefa: (l: PipelineRow) => string;
  novaEtapa?: string;       // se preenchido, move o lead
  alertaWhatsapp?: boolean; // se true, dispara alerta
}

const RULES: Rule[] = [
  {
    etapa: "novo",
    diasSLA: 1,
    tituloTarefa: "Fazer primeiro contato",
    descricaoTarefa: (l) =>
      `Lead "${l.nome ?? l.email}" está no pipeline há mais de 1 dia sem contato. Produto: ${l.produto_interesse ?? "N/A"}. Telefone: ${l.telefone ?? "N/A"}.`,
  },
  {
    etapa: "novo",
    diasSLA: 3,
    tituloTarefa: "Qualificar lead (SLA estourado)",
    descricaoTarefa: (l) =>
      `Lead "${l.nome ?? l.email}" passou 3 dias em "novo" sem qualificação. Movido automaticamente para qualificação.`,
    novaEtapa: "qualificacao",
  },
  {
    etapa: "qualificacao",
    diasSLA: 5,
    tituloTarefa: "Re-engajar lead em qualificação",
    descricaoTarefa: (l) =>
      `Lead "${l.nome ?? l.email}" está em qualificação há mais de 5 dias. Hora de retomar contato.`,
  },
  {
    etapa: "proposta",
    diasSLA: 7,
    tituloTarefa: "ALERTA: Proposta parada há 7+ dias",
    descricaoTarefa: (l) =>
      `Proposta enviada para "${l.nome ?? l.email}" sem resposta há mais de 7 dias. Fazer follow-up urgente.`,
    alertaWhatsapp: true,
  },
];

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

async function jaTemTarefaAberta(pipelineId: string, titulo: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("crm_tarefas")
    .select("id")
    .eq("pipeline_id", pipelineId)
    .eq("titulo", titulo)
    .neq("status", "concluida")
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

async function enviarAlertaWhatsapp(lead: PipelineRow, titulo: string, descricao: string) {
  try {
    await supabase.functions.invoke("evolution-send", {
      body: {
        to: ALERT_WHATSAPP,
        message:
          `🚨 *CRM — ${titulo}*\n\n` +
          `Lead: ${lead.nome ?? lead.email ?? "?"}\n` +
          `Produto: ${lead.produto_interesse ?? "N/A"}\n` +
          `Telefone: ${lead.telefone ?? "N/A"}\n\n` +
          descricao,
        modulo: "crm",
        tipo: "alerta_cadencia",
      },
    });
  } catch (err) {
    console.error("Falha ao enviar WhatsApp:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stats = { processados: 0, tarefasCriadas: 0, movidos: 0, alertas: 0, erros: 0 };

  try {
    const { data: leads, error } = await supabase
      .from("crm_pipeline")
      .select("id, nome, email, telefone, produto_interesse, etapa, updated_at, responsavel_id, responsavel_nome")
      .not("etapa", "in", "(ganho,perdido)");

    if (error) throw error;

    for (const lead of (leads ?? []) as PipelineRow[]) {
      stats.processados++;
      const dias = diasDesde(lead.updated_at);

      for (const rule of RULES) {
        if (lead.etapa !== rule.etapa) continue;
        if (dias < rule.diasSLA) continue;

        try {
          if (await jaTemTarefaAberta(lead.id, rule.tituloTarefa)) continue;

          const descricao = rule.descricaoTarefa(lead);

          const { error: tarefaErr } = await supabase.from("crm_tarefas").insert({
            pipeline_id: lead.id,
            titulo: rule.tituloTarefa,
            descricao,
            vencimento: new Date(Date.now() + 86_400_000).toISOString(),
            responsavel_id: lead.responsavel_id,
            responsavel_nome: lead.responsavel_nome,
            status: "pendente",
          });
          if (tarefaErr) throw tarefaErr;
          stats.tarefasCriadas++;

          if (rule.novaEtapa) {
            const { error: moveErr } = await supabase
              .from("crm_pipeline")
              .update({ etapa: rule.novaEtapa, updated_at: new Date().toISOString() })
              .eq("id", lead.id);
            if (moveErr) throw moveErr;
            stats.movidos++;
          }

          if (rule.alertaWhatsapp) {
            await enviarAlertaWhatsapp(lead, rule.tituloTarefa, descricao);
            stats.alertas++;
          }
        } catch (e) {
          stats.erros++;
          console.error(`Erro lead ${lead.id} regra "${rule.tituloTarefa}":`, e);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err), stats }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
