import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TrendingDown, Users, Activity, AlertTriangle, Search, Loader2,
  Flame, Snowflake, CircleDashed, Calendar, Building2, Key, RefreshCw, MessageSquare,
} from "lucide-react";

type Tier = "ativo" | "risco" | "churn" | "novo";

interface LicenseUsage {
  licenca_id: string;
  produto: string;
  plano: string;
  nivel: string | null;
  status: string;
  data_inicio: string | null;
  data_expiracao: string | null;
  liberado_admin: boolean;
  slots_max: number | null;
  slots_usados: number | null;
  user_id: string;
  user_email?: string;
  user_nome?: string;
  user_telefone?: string;
  empresa_nome?: string;
  ultima_atividade: Date | null;
  eventos_30d: number;
  dias_inativo: number | null;
  tier: Tier;
}

const TIER_CFG: Record<Tier, { label: string; color: string; bg: string; Icon: any }> = {
  ativo: { label: "Ativo",       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", Icon: Flame },
  novo:  { label: "Novo",        color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10 border-blue-500/30",       Icon: CircleDashed },
  risco: { label: "Em risco",    color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10 border-amber-500/30",     Icon: AlertTriangle },
  churn: { label: "Churn provável", color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30",       Icon: Snowflake },
};

function calcTier(diasInativo: number | null, eventos30d: number, dataInicio: string | null): Tier {
  const idadeConta = dataInicio ? Math.floor((Date.now() - new Date(dataInicio).getTime()) / 86400000) : 999;
  if (idadeConta <= 14 && eventos30d < 5) return "novo";
  if (diasInativo === null || diasInativo >= 30) return "churn";
  if (diasInativo >= 14 || eventos30d < 3) return "risco";
  return "ativo";
}

export default function RetencaoPanel() {
  const [rows, setRows] = useState<LicenseUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | Tier>("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const licRes: any = await supabase.functions.invoke("admin-licencas", { body: { action: "list" } });
      const licencas: any[] = licRes.data || [];

      const past30d = new Date(Date.now() - 30 * 86400000).toISOString();
      const userIds = Array.from(new Set(licencas.map(l => l.user_id).filter(Boolean)));

      const [auditRes, profilesRes, empRes] = await Promise.all([
        userIds.length
          ? (supabase.from as any)("audit_log")
              .select("user_id, created_at")
              .in("user_id", userIds)
              .gte("created_at", past30d)
              .order("created_at", { ascending: false })
              .limit(5000)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? supabase.from("profiles").select("user_id, nome, telefone").in("user_id", userIds)
          : Promise.resolve({ data: [] }),
        supabase.from("empresas").select("id, nome, user_id"),
      ]);

      const audit: any[] = auditRes.data || [];
      const profiles: any[] = (profilesRes as any).data || [];
      const empresas: any[] = (empRes as any).data || [];

      const eventos = new Map<string, { last: Date; count: number }>();
      for (const a of audit) {
        const cur = eventos.get(a.user_id);
        const t = new Date(a.created_at);
        if (!cur) eventos.set(a.user_id, { last: t, count: 1 });
        else {
          cur.count++;
          if (t > cur.last) cur.last = t;
        }
      }

      const profileMap = new Map(profiles.map(p => [p.user_id, p]));
      const empresaMap = new Map<string, string>();
      for (const e of empresas) empresaMap.set(e.id, e.nome);

      const now = Date.now();
      const rows: LicenseUsage[] = licencas.map((l: any) => {
        const ev = eventos.get(l.user_id);
        const dias = ev ? Math.floor((now - ev.last.getTime()) / 86400000) : null;
        const prof = profileMap.get(l.user_id);
        return {
          licenca_id: l.id,
          produto: l.produto || "feedbpf",
          plano: l.plano || "—",
          nivel: l.nivel,
          status: l.status,
          data_inicio: l.data_inicio,
          data_expiracao: l.data_expiracao,
          liberado_admin: !!l.liberado_admin,
          slots_max: l.slots_max,
          slots_usados: l.slots_usados,
          user_id: l.user_id,
          user_email: l.user_email,
          user_nome: prof?.nome,
          user_telefone: prof?.telefone,
          empresa_nome: l.empresa_id ? empresaMap.get(l.empresa_id) : undefined,
          ultima_atividade: ev?.last || null,
          eventos_30d: ev?.count || 0,
          dias_inativo: dias,
          tier: calcTier(dias, ev?.count || 0, l.data_inicio),
        };
      });

      // Foco em licenças ativas
      const ativas = rows.filter(r => r.liberado_admin || (r.status === "ativa" && (!r.data_expiracao || new Date(r.data_expiracao) > new Date())));
      setRows(ativas);
    } catch (e) {
      console.error("Erro retenção:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const counts = useMemo(() => ({
    ativo: rows.filter(r => r.tier === "ativo").length,
    novo:  rows.filter(r => r.tier === "novo").length,
    risco: rows.filter(r => r.tier === "risco").length,
    churn: rows.filter(r => r.tier === "churn").length,
  }), [rows]);

  const healthScore = useMemo(() => {
    if (!rows.length) return 0;
    return Math.round(((counts.ativo + counts.novo * 0.7) / rows.length) * 100);
  }, [rows, counts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(r => filter === "all" || r.tier === filter)
      .filter(r => !q || [r.user_email, r.user_nome, r.empresa_nome, r.produto].some(v => v?.toLowerCase().includes(q)))
      .sort((a, b) => (b.dias_inativo ?? -1) - (a.dias_inativo ?? -1));
  }, [rows, filter, search]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Health score + KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1 border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Health Score</p>
            <p className="text-4xl font-black text-primary mt-1">{healthScore}<span className="text-lg">%</span></p>
            <p className="text-[11px] text-muted-foreground mt-1">{rows.length} licenças ativas</p>
          </CardContent>
        </Card>
        {(["ativo", "novo", "risco", "churn"] as Tier[]).map(t => {
          const cfg = TIER_CFG[t];
          const Icon = cfg.Icon;
          return (
            <button key={t} type="button" onClick={() => setFilter(filter === t ? "all" : t)} className="text-left">
              <Card className={`${cfg.bg} border transition-all ${filter === t ? "ring-2 ring-offset-2 ring-primary" : "hover:shadow-md"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className="text-[10px] uppercase text-muted-foreground">{cfg.label}</span>
                  </div>
                  <p className={`text-3xl font-black ${cfg.color}`}>{counts[t]}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Ações recomendadas */}
      {(counts.risco > 0 || counts.churn > 0) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" /> Ações de Retenção Sugeridas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {counts.churn > 0 && <p>• <strong className="text-rose-600">{counts.churn}</strong> licença(s) sem atividade há 30d+ — contato de reengajamento urgente ou oferta de retenção.</p>}
            {counts.risco > 0 && <p>• <strong className="text-amber-600">{counts.risco}</strong> licença(s) em risco — enviar tutorial, agendar call de sucesso ou oferecer novas features.</p>}
            {counts.novo > 0 && <p>• <strong className="text-blue-600">{counts.novo}</strong> cliente(s) novo(s) precisam de onboarding ativo para não churnar.</p>}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por email, empresa, produto..." className="pl-9" />
        </div>
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Todos</Button>
        <Button size="sm" variant="outline" onClick={() => void fetchData()} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Lista de licenças */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Licenças por engajamento ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma licença corresponde aos filtros.</p>
          )}
          {filtered.map(r => {
            const cfg = TIER_CFG[r.tier];
            const TierIcon = cfg.Icon;
            const wa = r.user_telefone?.replace(/\D/g, "");
            return (
              <div key={r.licenca_id} className={`p-3 rounded-lg border ${cfg.bg} flex flex-wrap items-center gap-3 justify-between`}>
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg ${cfg.color}`}>
                    <TierIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{r.user_nome || r.user_email || "—"}</span>
                      <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.produto}</Badge>
                      {r.nivel && <Badge variant="outline" className="text-[10px]">{r.nivel}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                      {r.empresa_nome && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{r.empresa_nome}</span>}
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{r.eventos_30d} eventos/30d</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {r.ultima_atividade
                          ? `Última: ${r.dias_inativo === 0 ? "hoje" : `${r.dias_inativo}d atrás`}`
                          : "Sem atividade registrada"}
                      </span>
                      {r.data_expiracao && (
                        <span className="flex items-center gap-1"><Key className="h-3 w-3" />Exp: {new Date(r.data_expiracao).toLocaleDateString("pt-BR")}</span>
                      )}
                      {r.slots_max && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.slots_usados || 0}/{r.slots_max} slots</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.user_email && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${r.user_email}`}>Email</a>
                    </Button>
                  )}
                  {wa && (
                    <Button size="sm" variant="outline" asChild className="gap-1">
                      <a href={`https://wa.me/55${wa}`} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
