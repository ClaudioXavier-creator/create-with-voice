import { useEffect, useState } from "react";
import {
  LayoutDashboard, AlertTriangle, ClipboardCheck, GraduationCap, CheckCircle2,
  CalendarDays, Bell, Wrench, FileText, Droplets, Search, ShieldCheck,
  ArrowRight, Timer, BarChart as BarChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";
import { useOnboarding, OnboardingOverlay } from "@/components/OnboardingTour";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { differenceInDays, parseISO, format } from "date-fns";

const statusColors: Record<string, string> = {
  aberta: "bg-destructive text-destructive-foreground",
  em_andamento: "bg-warning text-accent-foreground",
  fechada: "bg-primary text-primary-foreground",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  fechada: "Fechada",
};

interface AlertItem {
  tipo: "calibracao" | "treinamento" | "documento" | "aso" | "planejamento";
  descricao: string;
  vencimento: string;
  diasRestantes: number;
  link: string;
}

interface NCPorMes { mes: string; abertas: number; fechadas: number }
interface ConformidadePorMes { mes: string; percentual: number }

interface DashboardData {
  ncAbertas: number;
  auditoriasRealizadas: number;
  treinamentosPendentes: number;
  conformidadeBPF: number;
  recentNCs: { setor: string; descricao: string; status: string }[];
  conformidadePorArea: { area: string; pct: number }[];
  ncPorMes: NCPorMes[];
  conformidadePorMes: ConformidadePorMes[];
  alertasVencimento: AlertItem[];
  atividadesVencidas: { atividade: string; proxima_execucao: string; categoria: string }[];
  atividadesProximas: { atividade: string; proxima_execucao: string; categoria: string; dias: number }[];
  calibracoesVencidas: number;
  docsVencidos: number;
  loading: boolean;
}

export default function Index() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const { showOnboarding, fecharTour } = useOnboarding();
  const [data, setData] = useState<DashboardData>({
    ncAbertas: 0, auditoriasRealizadas: 0, treinamentosPendentes: 0, conformidadeBPF: 0,
    recentNCs: [], conformidadePorArea: [], ncPorMes: [], conformidadePorMes: [],
    alertasVencimento: [], atividadesVencidas: [], atividadesProximas: [],
    calibracoesVencidas: 0, docsVencidos: 0, loading: true,
  });

  useEffect(() => {
    if (!user) return;

    async function fetchDashboard() {
      const addEmpresa = (q: any) => {
        let r = q.eq("user_id", user!.id);
        if (empresaAtiva) r = r.eq("empresa_id", empresaAtiva.id);
        return r;
      };
      const [ncsRes, ncsFullRes, checklistRes, checklistDatesRes, treinamentosRes, recentNcsRes, planejamentoRes, calibracoesRes, documentosRes] = await Promise.all([
        addEmpresa(supabase.from("nao_conformidades").select("status")),
        addEmpresa(supabase.from("nao_conformidades").select("data, status")),
        addEmpresa(supabase.from("checklist_items").select("area, conforme")),
        addEmpresa(supabase.from("checklist_items").select("auditoria_data, conforme")),
        addEmpresa(supabase.from("treinamentos").select("funcionario, treinamento, validade")),
        addEmpresa(supabase.from("nao_conformidades").select("setor, descricao, status")).order("data", { ascending: false }).limit(5),
        addEmpresa(supabase.from("planejamento_anual").select("atividade, proxima_execucao, categoria")).not("proxima_execucao", "is", null),
        addEmpresa(supabase.from("calibracoes").select("equipamento, proxima_calibracao, status")),
        addEmpresa(supabase.from("documentos").select("nome, codigo, proxima_revisao, validade_revisao, status")),
      ]);

      const ncs = ncsRes.data || [];
      const ncsFull = ncsFullRes.data || [];
      const checklist = checklistRes.data || [];
      const checklistDates = checklistDatesRes.data || [];
      const treinamentos = treinamentosRes.data || [];
      const recentNCs = (recentNcsRes.data || []).map((nc) => ({
        setor: nc.setor, descricao: nc.descricao, status: nc.status || "aberta",
      }));

      const ncAbertas = ncs.filter((nc) => nc.status === "aberta" || nc.status === "em_andamento").length;

      const auditoriasRealizadas = new Set(
        checklistDates.map((c) => c.auditoria_data).filter(Boolean)
      ).size;

      const hoje = new Date();
      const em30dias = new Date();
      em30dias.setDate(hoje.getDate() + 30);

      // ---- ALERTAS DE VENCIMENTO UNIFICADOS ----
      const alertas: AlertItem[] = [];

      // Treinamentos
      const treinamentosPendentes = treinamentos.filter((t: any) => {
        if (!t.validade) return true;
        const validade = new Date(t.validade);
        return validade <= em30dias;
      }).length;

      treinamentos.forEach((t: any) => {
        if (!t.validade) return;
        const dias = differenceInDays(parseISO(t.validade), hoje);
        if (dias <= 30) {
          alertas.push({
            tipo: "treinamento",
            descricao: `${t.treinamento} — ${t.funcionario}`,
            vencimento: t.validade,
            diasRestantes: dias,
            link: "/treinamentos",
          });
        }
      });

      // Calibrações
      const calibracoes = calibracoesRes.data || [];
      let calibracoesVencidas = 0;
      calibracoes.forEach((c: any) => {
        if (!c.proxima_calibracao) return;
        const dias = differenceInDays(parseISO(c.proxima_calibracao), hoje);
        if (dias <= 30) {
          if (dias < 0) calibracoesVencidas++;
          alertas.push({
            tipo: "calibracao",
            descricao: `${c.equipamento}`,
            vencimento: c.proxima_calibracao,
            diasRestantes: dias,
            link: "/manutencao",
          });
        }
      });

      // Documentos (revisões)
      const documentos = documentosRes.data || [];
      let docsVencidos = 0;
      documentos.forEach((d: any) => {
        const dataRef = d.proxima_revisao || d.validade_revisao;
        if (!dataRef) return;
        const dias = differenceInDays(parseISO(dataRef), hoje);
        if (dias <= 30) {
          if (dias < 0) docsVencidos++;
          alertas.push({
            tipo: "documento",
            descricao: `${d.codigo} — ${d.nome}`,
            vencimento: dataRef,
            diasRestantes: dias,
            link: "/documentos",
          });
        }
      });

      // Sort by urgency
      alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

      // Conformidade por área
      const areaMap = new Map<string, { total: number; conformes: number }>();
      checklist.forEach((c) => {
        const entry = areaMap.get(c.area) || { total: 0, conformes: 0 };
        entry.total++;
        if (c.conforme === true) entry.conformes++;
        areaMap.set(c.area, entry);
      });
      const conformidadePorArea = Array.from(areaMap.entries()).map(([area, { total, conformes }]) => ({
        area: area.replace(/^\d+\.\s*/, "").split("(")[0].trim(),
        pct: total > 0 ? Math.round((conformes / total) * 100) : 0,
      }));

      const totalChecklist = checklist.length;
      const totalConformes = checklist.filter((c) => c.conforme === true).length;
      const conformidadeBPF = totalChecklist > 0 ? Math.round((totalConformes / totalChecklist) * 100) : 0;

      // NCs por mês
      const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const ncMesMap = new Map<string, { abertas: number; fechadas: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        ncMesMap.set(key, { abertas: 0, fechadas: 0 });
      }
      ncsFull.forEach((nc) => {
        if (!nc.data) return;
        const key = nc.data.substring(0, 7);
        const entry = ncMesMap.get(key);
        if (!entry) return;
        if (nc.status === "fechada") entry.fechadas++;
        else entry.abertas++;
      });
      const ncPorMes: NCPorMes[] = Array.from(ncMesMap.entries()).map(([key, val]) => {
        const [, m] = key.split("-");
        return { mes: mesesNomes[parseInt(m) - 1], abertas: val.abertas, fechadas: val.fechadas };
      });

      // Conformidade por mês
      const confMesMap = new Map<string, { total: number; conformes: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        confMesMap.set(key, { total: 0, conformes: 0 });
      }
      checklistDates.forEach((c) => {
        if (!c.auditoria_data) return;
        const key = c.auditoria_data.substring(0, 7);
        const entry = confMesMap.get(key);
        if (!entry) return;
        entry.total++;
        if (c.conforme === true) entry.conformes++;
      });
      const conformidadePorMes: ConformidadePorMes[] = Array.from(confMesMap.entries()).map(([key, val]) => {
        const [, m] = key.split("-");
        return { mes: mesesNomes[parseInt(m) - 1], percentual: val.total > 0 ? Math.round((val.conformes / val.total) * 100) : 0 };
      });

      // Planejamento
      const planejamento = (planejamentoRes.data || []) as any[];
      const now = new Date();
      const atividadesVencidas = planejamento
        .filter(p => p.proxima_execucao && differenceInDays(parseISO(p.proxima_execucao), now) < 0)
        .map(p => ({ atividade: p.atividade, proxima_execucao: p.proxima_execucao, categoria: p.categoria }));
      const atividadesProximas = planejamento
        .filter(p => { if (!p.proxima_execucao) return false; const dias = differenceInDays(parseISO(p.proxima_execucao), now); return dias >= 0 && dias <= 7; })
        .map(p => ({ atividade: p.atividade, proxima_execucao: p.proxima_execucao, categoria: p.categoria, dias: differenceInDays(parseISO(p.proxima_execucao), now) }));

      setData({
        ncAbertas, auditoriasRealizadas, treinamentosPendentes, conformidadeBPF,
        recentNCs, conformidadePorArea, ncPorMes, conformidadePorMes,
        alertasVencimento: alertas, atividadesVencidas, atividadesProximas,
        calibracoesVencidas, docsVencidos, loading: false,
      });
    }

    fetchDashboard();
  }, [user]);

  const stats = [
    { label: "Conformidade BPF", value: data.loading ? "..." : `${data.conformidadeBPF}%`, icon: CheckCircle2, color: "text-primary", link: "/auditoria" },
    { label: "NCs Abertas", value: data.loading ? "..." : `${data.ncAbertas}`, icon: AlertTriangle, color: "text-destructive", link: "/nao-conformidades" },
    { label: "Auditorias Realizadas", value: data.loading ? "..." : `${data.auditoriasRealizadas}`, icon: ClipboardCheck, color: "text-accent-foreground", link: "/auditoria" },
    { label: "Treinamentos Pendentes", value: data.loading ? "..." : `${data.treinamentosPendentes}`, icon: GraduationCap, color: "text-warning-foreground", link: "/treinamentos" },
    { label: "Calibrações Vencidas", value: data.loading ? "..." : `${data.calibracoesVencidas}`, icon: Wrench, color: "text-destructive", link: "/manutencao" },
    { label: "Docs p/ Revisão", value: data.loading ? "..." : `${data.docsVencidos}`, icon: FileText, color: "text-muted-foreground", link: "/documentos" },
  ];

  const alertaIconMap: Record<string, React.ElementType> = {
    calibracao: Wrench,
    treinamento: GraduationCap,
    documento: FileText,
    aso: Droplets,
    planejamento: CalendarDays,
  };

  const alertaTipoLabel: Record<string, string> = {
    calibracao: "Calibração",
    treinamento: "Treinamento",
    documento: "Documento",
    aso: "ASO",
    planejamento: "Planejamento",
  };

  return (
    <>
      <PageHeader icon={LayoutDashboard} title="Dashboard" description="Visão geral do sistema FeedBPF" />

      {/* Alertas do Planejamento Anual */}
      {!data.loading && (data.atividadesVencidas.length > 0 || data.atividadesProximas.length > 0) && (
        <div className="space-y-3 mb-6">
          {data.atividadesVencidas.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-destructive text-sm">
                    {data.atividadesVencidas.length} atividade(s) do planejamento anual VENCIDA(S)
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {data.atividadesVencidas.slice(0, 5).map((a, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {a.atividade} — venceu em {format(parseISO(a.proxima_execucao), "dd/MM/yyyy")}
                      </li>
                    ))}
                  </ul>
                  <Link to="/planejamento-anual" className="text-xs text-primary underline mt-1 inline-block">Ver Planejamento Anual →</Link>
                </div>
              </CardContent>
            </Card>
          )}
          {data.atividadesProximas.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-500/5">
              <CardContent className="flex items-start gap-3 p-4">
                <Bell className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700 text-sm">
                    {data.atividadesProximas.length} atividade(s) vencem nos próximos 7 dias
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {data.atividadesProximas.map((a, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {a.atividade} — vence em {a.dias === 0 ? "hoje" : `${a.dias} dia(s)`} ({format(parseISO(a.proxima_execucao), "dd/MM/yyyy")})
                      </li>
                    ))}
                  </ul>
                  <Link to="/planejamento-anual" className="text-xs text-primary underline mt-1 inline-block">Ver Planejamento Anual →</Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards — Clicáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.link}>
            <Card className="border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="flex flex-col items-center gap-2 pt-4 pb-3 px-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground text-center leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Painel de Alertas de Vencimento */}
      {!data.loading && data.alertasVencimento.length > 0 && (
        <Card className="mb-6 border-orange-400/50 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              Central de Alertas de Vencimento ({data.alertasVencimento.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {data.alertasVencimento.slice(0, 10).map((alerta, i) => {
                const Icon = alertaIconMap[alerta.tipo] || Bell;
                const isVencido = alerta.diasRestantes < 0;
                return (
                  <Link key={i} to={alerta.link} className="flex items-center gap-3 py-2 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                    <Icon className={`w-4 h-4 shrink-0 ${isVencido ? "text-destructive" : "text-yellow-600"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alerta.descricao}</p>
                      <p className="text-xs text-muted-foreground">{alertaTipoLabel[alerta.tipo]}</p>
                    </div>
                    <Badge variant={isVencido ? "destructive" : "secondary"} className="text-xs shrink-0">
                      {isVencido ? `Vencido ${Math.abs(alerta.diasRestantes)}d` : alerta.diasRestantes === 0 ? "Hoje" : `${alerta.diasRestantes}d`}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link to="/checklist-pre-auditoria">
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Checklist Pré-Auditoria</span>
          </Button>
        </Link>
        <Link to="/simulacao-recall">
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-1.5">
            <Timer className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-medium">Simular Recall</span>
          </Button>
        </Link>
        <Link to="/busca-global">
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-1.5">
            <Search className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-medium">Busca Global</span>
          </Button>
        </Link>
        <Link to="/qualidade-total">
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-1.5">
            <BarChartIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-medium">Relatório Anual</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conformidade por área */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Conformidade por Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-2 w-full" /></div>
              ))
            ) : data.conformidadePorArea.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">Nenhum dado de auditoria encontrado.</p>
                <Link to="/auditoria"><Button size="sm">Realizar Auditoria</Button></Link>
              </div>
            ) : (
              data.conformidadePorArea.map((item) => (
                <div key={item.area}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.area}</span>
                    <span className="text-muted-foreground">{item.pct}%</span>
                  </div>
                  <Progress value={item.pct} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* NCs Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Não Conformidades Recentes</CardTitle>
            <Link to="/nao-conformidades"><Button variant="ghost" size="sm" className="text-xs">Ver todas <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : data.recentNCs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma não conformidade registrada.</p>
            ) : (
              data.recentNCs.map((nc, i) => (
                <Link key={i} to="/nao-conformidades" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-sm">{nc.descricao}</p>
                    <p className="text-xs text-muted-foreground">{nc.setor}</p>
                  </div>
                  <Badge className={statusColors[nc.status] || ""}>{statusLabels[nc.status] || nc.status}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Evolução de NCs (últimos 6 meses)</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.ncPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="abertas" name="Abertas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fechadas" name="Fechadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Conformidade BPF (últimos 6 meses)</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.conformidadePorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(value: number) => [`${value}%`, "Conformidade"]} />
                  <Line type="monotone" dataKey="percentual" name="Conformidade" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      {showOnboarding && <OnboardingOverlay onClose={fecharTour} />}
    </>
  );
}
