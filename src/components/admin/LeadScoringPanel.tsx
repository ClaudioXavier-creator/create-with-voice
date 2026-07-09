import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Flame, TrendingUp, Clock, AlertCircle, ExternalLink, Phone, Mail, Building2, RefreshCw } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

type PipelineRow = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  produto_interesse: string | null;
  etapa: string;
  valor_estimado: number | null;
  responsavel_nome: string | null;
  updated_at: string;
  created_at: string;
};

type Interacao = { pipeline_id: string; created_at: string };
type Tarefa = { id: string; pipeline_id: string; titulo: string; vencimento: string | null; status: string };

type Scored = PipelineRow & {
  score: number;
  tier: "quente" | "morno" | "frio";
  diasSemContato: number;
  interacoes30d: number;
  motivos: string[];
};

const ETAPAS_ATIVAS = ["novo", "contato", "qualificado", "proposta", "negociacao"];

export default function LeadScoringPanel() {
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, tRes] = await Promise.all([
        supabase
          .from("crm_pipeline")
          .select("id, nome, email, telefone, empresa, produto_interesse, etapa, valor_estimado, responsavel_nome, updated_at, created_at")
          .in("etapa", ETAPAS_ATIVAS)
          .order("updated_at", { ascending: false })
          .limit(300),
        supabase
          .from("crm_interacoes")
          .select("pipeline_id, created_at")
          .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
        supabase
          .from("crm_tarefas")
          .select("id, pipeline_id, titulo, vencimento, status")
          .neq("status", "concluida")
          .limit(300),
      ]);
      setRows((pRes.data as PipelineRow[]) || []);
      setInteracoes((iRes.data as Interacao[]) || []);
      setTarefas((tRes.data as Tarefa[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const scored: Scored[] = useMemo(() => {
    const interacoesByPipe = new Map<string, string[]>();
    interacoes.forEach((i) => {
      const arr = interacoesByPipe.get(i.pipeline_id) || [];
      arr.push(i.created_at);
      interacoesByPipe.set(i.pipeline_id, arr);
    });

    return rows.map((r) => {
      const motivos: string[] = [];
      let s = 0;

      if (r.telefone) { s += 15; motivos.push("Telefone (+15)"); }
      if (r.empresa) { s += 10; motivos.push("Empresa (+10)"); }

      const v = Number(r.valor_estimado) || 0;
      if (v >= 5000) { s += 20; motivos.push("Valor ≥ R$ 5k (+20)"); }
      else if (v >= 2000) { s += 10; motivos.push("Valor ≥ R$ 2k (+10)"); }

      const inters = interacoesByPipe.get(r.id) || [];
      const bonus = Math.min(inters.length * 5, 25);
      if (bonus > 0) { s += bonus; motivos.push(`${inters.length} interações 30d (+${bonus})`); }

      const etapaBonus: Record<string, number> = {
        novo: 5, contato: 15, qualificado: 25, proposta: 40, negociacao: 55,
      };
      const eb = etapaBonus[r.etapa] || 0;
      s += eb;
      motivos.push(`Etapa ${r.etapa} (+${eb})`);

      const prod = (r.produto_interesse || "").toLowerCase();
      if (["feed_bpf", "audits_bpf", "completo", "feedbpf", "auditsbpf"].some(k => prod.includes(k))) {
        s += 10; motivos.push("Produto premium (+10)");
      }

      const ultimo = inters.sort().pop() || r.updated_at;
      const dias = differenceInDays(new Date(), new Date(ultimo));

      s = Math.min(s, 100);
      const tier: Scored["tier"] = s >= 70 ? "quente" : s >= 40 ? "morno" : "frio";

      return { ...r, score: s, tier, diasSemContato: dias, interacoes30d: inters.length, motivos };
    }).sort((a, b) => b.score - a.score);
  }, [rows, interacoes]);

  const alertas = useMemo(() => {
    const now = Date.now();
    const stale = scored.filter(s => s.diasSemContato >= 7 && s.etapa !== "novo");
    const semResp = rows.filter(r => !r.responsavel_nome && differenceInHours(new Date(), new Date(r.created_at)) >= 48);
    const tarefasVencidas = tarefas.filter(t => t.vencimento && new Date(t.vencimento).getTime() < now);
    return { stale, semResp, tarefasVencidas };
  }, [scored, rows, tarefas]);

  const quentes = scored.filter(s => s.tier === "quente");
  const mornos = scored.filter(s => s.tier === "morno");
  const frios = scored.filter(s => s.tier === "frio");

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Leads Quentes" value={quentes.length} tone="red" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Mornos" value={mornos.length} tone="amber" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Sem contato ≥ 7d" value={alertas.stale.length} tone="blue" />
        <StatCard icon={<AlertCircle className="h-4 w-4" />} label="Tarefas vencidas" value={alertas.tarefasVencidas.length} tone="red" />
      </div>

      {(alertas.stale.length > 0 || alertas.semResp.length > 0 || alertas.tarefasVencidas.length > 0) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" /> Ações Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {alertas.semResp.length > 0 && (
              <div>🚨 <b>{alertas.semResp.length}</b> lead(s) sem responsável há mais de 48h — atribuir agora.</div>
            )}
            {alertas.stale.length > 0 && (
              <div>⏰ <b>{alertas.stale.length}</b> lead(s) sem contato há 7+ dias — retomar cadência.</div>
            )}
            {alertas.tarefasVencidas.length > 0 && (
              <div>📌 <b>{alertas.tarefasVencidas.length}</b> tarefa(s) vencida(s) no CRM.</div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ranking de Leads</h3>
        <Button size="sm" variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      <Tabs defaultValue="quente">
        <TabsList>
          <TabsTrigger value="quente" className="gap-1"><Flame className="h-3.5 w-3.5" /> Quentes ({quentes.length})</TabsTrigger>
          <TabsTrigger value="morno">Mornos ({mornos.length})</TabsTrigger>
          <TabsTrigger value="frio">Frios ({frios.length})</TabsTrigger>
          <TabsTrigger value="stale">Follow-up urgente ({alertas.stale.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="quente" className="mt-4"><LeadList items={quentes} /></TabsContent>
        <TabsContent value="morno" className="mt-4"><LeadList items={mornos} /></TabsContent>
        <TabsContent value="frio" className="mt-4"><LeadList items={frios} /></TabsContent>
        <TabsContent value="stale" className="mt-4"><LeadList items={alertas.stale} /></TabsContent>
      </Tabs>
    </div>
  );
}

function LeadList({ items }: { items: Scored[] }) {
  if (items.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum lead nesta categoria.</CardContent></Card>;
  }
  return (
    <div className="space-y-2">
      {items.map((l) => (
        <Card key={l.id} className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{l.nome}</span>
                  <TierBadge tier={l.tier} />
                  <Badge variant="outline" className="capitalize">{l.etapa}</Badge>
                  {l.produto_interesse && <Badge variant="outline">{l.produto_interesse}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                  {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>}
                  {l.telefone && (
                    <a href={`https://wa.me/55${l.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" />{l.telefone}
                    </a>
                  )}
                  {l.empresa && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{l.empresa}</span>}
                  <span>· Últ. contato há {l.diasSemContato}d</span>
                  {l.valor_estimado ? <span>· R$ {Number(l.valor_estimado).toLocaleString("pt-BR")}</span> : null}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground line-clamp-1">
                  {l.motivos.join(" · ")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[140px]">
                <div className="text-2xl font-bold tabular-nums">{l.score}</div>
                <Progress value={l.score} className="w-32 h-1.5" />
                <Link to={`/superadmin?tab=crm`} className="text-xs text-primary hover:underline flex items-center gap-1">
                  Abrir no CRM <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TierBadge({ tier }: { tier: Scored["tier"] }) {
  const map = {
    quente: "bg-red-500/15 text-red-700 border-red-500/30",
    morno: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    frio: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  } as const;
  return <Badge variant="outline" className={map[tier] + " capitalize"}>{tier}</Badge>;
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "red" | "amber" | "blue" | "emerald" }) {
  const tones = {
    red: "bg-red-500/10 text-red-600 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  } as const;
  return (
    <Card className={`border ${tones[tone]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
