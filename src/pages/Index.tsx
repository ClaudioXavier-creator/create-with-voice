import { type ElementType, useEffect, useState } from "react";
import {
  LayoutDashboard, AlertTriangle, ClipboardCheck, GraduationCap, CheckCircle2,
  CalendarDays, Bell, Wrench, FileText, Droplets, Search, ShieldCheck,
  ArrowRight, Timer, BarChart as BarChartIcon, HelpCircle, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";
import { useOnboarding, OnboardingOverlay } from "@/components/OnboardingTour";
import { cn } from "@/lib/utils";
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
interface AcaoPrioritaria {
  titulo: string;
  detalhe: string;
  criticidade: "critico" | "atencao" | "estavel";
  link: string;
}
interface SaudeOperacionalItem {
  label: string;
  valor: number;
  descricao: string;
  link: string;
}

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
  acoesPrioritarias: AcaoPrioritaria[];
  saudeOperacional: SaudeOperacionalItem[];
  loading: boolean;
}

const getPeriodoCutoff = (periodo: string) => {
  if (periodo === "todos") return null;

  const base = new Date();
  const cutoff = new Date(base);

  if (periodo === "mes") cutoff.setMonth(base.getMonth() - 1);
  if (periodo === "trimestre") cutoff.setMonth(base.getMonth() - 3);
  if (periodo === "semestre") cutoff.setMonth(base.getMonth() - 6);
  if (periodo === "ano") cutoff.setFullYear(base.getFullYear() - 1);

  return cutoff.toISOString().split("T")[0];
};

const progressFromOverdue = (overdue: number, total: number) => {
  if (total <= 0) return 100;
  return Math.max(0, Math.round(((total - overdue) / total) * 100));
};

export default function Index() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const { showOnboarding, iniciarTour, fecharTour } = useOnboarding();
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");
  const [data, setData] = useState<DashboardData>({
    ncAbertas: 0, auditoriasRealizadas: 0, treinamentosPendentes: 0, conformidadeBPF: 0,
    recentNCs: [], conformidadePorArea: [], ncPorMes: [], conformidadePorMes: [],
    alertasVencimento: [], atividadesVencidas: [], atividadesProximas: [],
    calibracoesVencidas: 0, docsVencidos: 0, acoesPrioritarias: [], saudeOperacional: [], loading: true,
  });

  useEffect(() => {
    if (!user) return;

    async function fetchDashboard() {
      const cutoff = getPeriodoCutoff(periodoFiltro);
      const addEmpresa = (q: any, dateField?: string) => {
        let r = q;
        if (empresaAtiva) {
          r = r.eq("empresa_id", empresaAtiva.id);
        } else {
          r = r.eq("user_id", user!.id);
        }
        if (cutoff && dateField) r = r.gte(dateField, cutoff);
        return r;
      };
      const [ncsRes, ncsFullRes, checklistRes, checklistDatesRes, treinamentosRes, recentNcsRes, planejamentoRes, calibracoesRes, documentosRes] = await Promise.all([
        addEmpresa(supabase.from("nao_conformidades").select("status")),
        addEmpresa(supabase.from("nao_conformidades").select("data, status"), "data"),
        addEmpresa(supabase.from("checklist_items").select("area, conforme")),
        addEmpresa(supabase.from("checklist_items").select("auditoria_data, conforme"), "auditoria_data"),
        addEmpresa(supabase.from("treinamentos").select("funcionario, treinamento, validade")),
        addEmpresa(supabase.from("nao_conformidades").select("setor, descricao, status"), "data").order("data", { ascending: false }).limit(5),
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

      const acoesPrioritarias: AcaoPrioritaria[] = [];
      if (calibracoesVencidas > 0) {
        acoesPrioritarias.push({
          titulo: "Regularizar calibrações vencidas",
          detalhe: `${calibracoesVencidas} equipamento(s) exigem ação imediata.`,
          criticidade: "critico",
          link: "/manutencao",
        });
      }
      if (docsVencidos > 0) {
        acoesPrioritarias.push({
          titulo: "Revisar documentos obrigatórios",
          detalhe: `${docsVencidos} documento(s) estão vencidos ou fora da revisão.`,
          criticidade: "critico",
          link: "/documentos",
        });
      }
      if (treinamentosPendentes > 0) {
        acoesPrioritarias.push({
          titulo: "Atualizar treinamentos da equipe",
          detalhe: `${treinamentosPendentes} treinamento(s) vencem em até 30 dias.`,
          criticidade: treinamentosPendentes >= 5 ? "critico" : "atencao",
          link: "/treinamentos",
        });
      }
      if (ncAbertas > 0) {
        acoesPrioritarias.push({
          titulo: "Fechar não conformidades em aberto",
          detalhe: `${ncAbertas} ocorrência(s) impactando a rotina de BPF.`,
          criticidade: ncAbertas >= 5 ? "critico" : "atencao",
          link: "/nao-conformidades",
        });
      }
      if (atividadesVencidas.length > 0) {
        acoesPrioritarias.push({
          titulo: "Reprogramar atividades do plano anual",
          detalhe: `${atividadesVencidas.length} atividade(s) já passaram da data prevista.`,
          criticidade: "atencao",
          link: "/planejamento-anual",
        });
      }
      if (acoesPrioritarias.length === 0) {
        acoesPrioritarias.push({
          titulo: "Operação estável",
          detalhe: "Nenhum ponto crítico encontrado para a empresa ativa.",
          criticidade: "estavel",
          link: "/qualidade-total",
        });
      }

      const totalAlertas = alertas.length;
      const saudeOperacional: SaudeOperacionalItem[] = [
        {
          label: "Agenda regulatória",
          valor: progressFromOverdue(calibracoesVencidas + docsVencidos, Math.max(totalAlertas, 1)),
          descricao: `${totalAlertas} alerta(s) monitorado(s) entre vencimentos e revisões.`,
          link: "/documentos",
        },
        {
          label: "Treinamento da equipe",
          valor: progressFromOverdue(treinamentosPendentes, Math.max(treinamentos.length, 1)),
          descricao: `${treinamentosPendentes} pendência(s) com validade próxima ou ausente.`,
          link: "/treinamentos",
        },
        {
          label: "Resposta a desvios",
          valor: progressFromOverdue(ncAbertas, Math.max(ncs.length, 1)),
          descricao: `${ncAbertas} NC(s) aberta(s) ou em andamento.`,
          link: "/nao-conformidades",
        },
      ];

      setData({
        ncAbertas, auditoriasRealizadas, treinamentosPendentes, conformidadeBPF,
        recentNCs, conformidadePorArea, ncPorMes, conformidadePorMes,
        alertasVencimento: alertas, atividadesVencidas, atividadesProximas,
        calibracoesVencidas, docsVencidos, acoesPrioritarias, saudeOperacional, loading: false,
      });
    }

    fetchDashboard();
  }, [user, empresaAtiva, periodoFiltro]);

  const stats = [
    { label: "Conformidade BPF", value: data.loading ? "..." : `${data.conformidadeBPF}%`, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", link: "/auditoria" },
    { label: "NCs Abertas", value: data.loading ? "..." : `${data.ncAbertas}`, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", link: "/nao-conformidades" },
    { label: "Auditorias", value: data.loading ? "..." : `${data.auditoriasRealizadas}`, icon: ClipboardCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", link: "/auditoria" },
    { label: "Treinamentos", value: data.loading ? "..." : `${data.treinamentosPendentes}`, icon: GraduationCap, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", link: "/treinamentos" },
    { label: "Calibrações", value: data.loading ? "..." : `${data.calibracoesVencidas}`, icon: Wrench, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", link: "/manutencao" },
    { label: "Docs p/ Revisão", value: data.loading ? "..." : `${data.docsVencidos}`, icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", link: "/documentos" },
  ];

  const alertaIconMap: Record<string, ElementType> = {
    calibracao: Wrench,
    treinamento: GraduationCap,
    documento: FileText,
    aso: Droplets,
    planejamento: CalendarDays,
  };

  const criticidadeConfig = {
    critico: {
      badge: "destructive" as const,
      container: "border-destructive/40 bg-destructive/5",
      text: "text-destructive",
      label: "Crítico",
    },
    atencao: {
      badge: "secondary" as const,
      container: "border-warning/40 bg-warning/5",
      text: "text-warning-foreground",
      label: "Atenção",
    },
    estavel: {
      badge: "outline" as const,
      container: "border-primary/30 bg-primary/5",
      text: "text-primary",
      label: "Estável",
    },
  };

  const alertaTipoLabel: Record<string, string> = {
    calibracao: "Calibração",
    treinamento: "Treinamento",
    documento: "Documento",
    aso: "ASO",
    planejamento: "Planejamento",
  };
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader 
          icon={LayoutDashboard} 
          title="Painel de Controle" 
          description="Visão analítica e operacional da conformidade BPF" 
        />
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={iniciarTour}
            aria-label="Iniciar guia interativo do sistema"
            className="rounded-full border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <HelpCircle aria-hidden="true" className="w-4 h-4 mr-2 text-primary" /> 
            Guia do Sistema
          </Button>
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-full border-primary/20 bg-background/50 backdrop-blur-sm">
              <CalendarDays aria-hidden="true" className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar Período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-2xl">
              <SelectItem value="todos">Todo período histórico</SelectItem>
              <SelectItem value="mes">Últimos 30 dias</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="semestre">Último semestre</SelectItem>
              <SelectItem value="ano">Último ano fiscal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!data.loading && (data.atividadesVencidas.length > 0 || data.atividadesProximas.length > 0) && (
        <div className="flex flex-col gap-4">
          {data.atividadesVencidas.length > 0 && (
            <Card className="border-none shadow-premium bg-rose-500/5 overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10 shrink-0">
                  <AlertTriangle aria-hidden="true" className="h-5 w-5 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                    {data.atividadesVencidas.length} Atividades Vencidas
                  </p>
                  <p className="text-xs text-rose-700/70 dark:text-rose-400/70 mt-0.5 line-clamp-1">
                    {data.atividadesVencidas[0].atividade} e outras pendências.
                  </p>
                  <Link to="/planejamento-anual" className="text-xs font-bold text-rose-600 hover:text-rose-700 mt-2 flex items-center gap-1 group/link">
                    Regularizar Agora <ChevronRight aria-hidden="true" className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          {data.atividadesProximas.length > 0 && (
            <Card className="border-none shadow-premium bg-amber-500/5 overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 shrink-0">
                  <Bell aria-hidden="true" className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                    Atenção ao Cronograma
                  </p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5 line-clamp-1">
                    {data.atividadesProximas.length} itens vencem em breve.
                  </p>
                  <Link to="/planejamento-anual" className="text-xs font-bold text-amber-600 hover:text-amber-700 mt-2 flex items-center gap-1 group/link">
                    Ver Cronograma <ChevronRight aria-hidden="true" className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards — Premium Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.link} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-xl">
            <Card className="border-none shadow-premium bg-card hover:shadow-premium-hover transition-all duration-300 relative overflow-hidden h-full">
              <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-bl-[40px] opacity-10 transition-opacity group-hover:opacity-20", s.bg)} />
              <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                <div className={cn("flex items-center justify-center w-12 h-12 rounded-2xl shadow-inner transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300", s.bg)}>
                  <s.icon aria-hidden="true" className={cn("w-6 h-6", s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display tracking-tight text-foreground">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1 leading-tight">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Prioridades */}
        <Card className="xl:col-span-2 border-none shadow-premium bg-card overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck aria-hidden="true" className="w-4 h-4 text-primary" />
                </div>
                Prioridades Estratégicas
              </CardTitle>
              <Badge variant="outline" className="bg-background/50 border-border/50 font-mono text-[10px]">
                {data.acoesPrioritarias.length} PENDÊNCIAS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : (
              data.acoesPrioritarias.map((acao, idx) => {
                const config = criticidadeConfig[acao.criticidade];
                return (
                  <Link key={idx} to={acao.link} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
                    <div className={cn("rounded-2xl border border-transparent p-4 transition-all hover:shadow-md hover:translate-x-1 relative overflow-hidden group", config.container)}>
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                        <ArrowRight aria-hidden="true" className="w-8 h-8 -rotate-45" />
                      </div>
                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", config.text.replace("text-", "bg-"))} />
                            <p className="font-bold text-sm tracking-tight">{acao.titulo}</p>
                          </div>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">{acao.detalhe}</p>
                        </div>
                        <Badge variant={config.badge} className="rounded-full text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Saúde Operacional */}
        <Card className="border-none shadow-premium bg-card overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BarChartIcon aria-hidden="true" className="w-4 h-4 text-emerald-600" />
              </div>
              Indicadores de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-2 w-full" /></div>
              ))
            ) : (
              data.saudeOperacional.map((item, idx) => (
                <Link key={idx} to={item.link} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-1 -m-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{item.label}</p>
                    <span className="text-sm font-bold text-foreground">{item.valor}%</span>
                  </div>
                  <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-full rounded-full transition-all duration-1000",
                        item.valor > 80 ? "bg-emerald-500" : item.valor > 50 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${item.valor}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                    {item.descricao}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atalhos Rápidos — Grid Moderno */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: "/checklist-pre-auditoria", label: "Checklist Auditoria", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { to: "/simulacao-recall", label: "Simular Recall", icon: Timer, color: "text-rose-600", bg: "bg-rose-50" },
          { to: "/busca-global", label: "Busca Inteligente", icon: Search, color: "text-indigo-600", bg: "bg-indigo-50" },
          { to: "/qualidade-total", label: "Relatório Anual", icon: BarChartIcon, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((btn, i) => (
          <Button key={i} variant="ghost" asChild className="w-full h-auto py-5 flex flex-col items-center gap-3 bg-card shadow-premium hover:shadow-premium-hover border-none rounded-2xl group transition-all">
            <Link to={btn.to}>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3", btn.bg)}>
                <btn.icon aria-hidden="true" className={cn("w-6 h-6", btn.color)} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{btn.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conformidade por área */}
        <Card className="border-none shadow-premium bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Status de Conformidade por Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {data.loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : data.conformidadePorArea.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground mb-4">Nenhum dado de auditoria processado.</p>
                <Link to="/auditoria"><Button size="sm" className="rounded-full px-6">Iniciar Auditoria</Button></Link>
              </div>
            ) : (
              data.conformidadePorArea.map((item, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground/70 group-hover:text-foreground transition-colors">
                    <span>{item.area}</span>
                    <span className="font-mono">{item.pct}%</span>
                  </div>
                  <Progress value={item.pct} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* NCs Recentes */}
        <Card className="border-none shadow-premium bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Desvios Recentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full mb-3" />)
            ) : data.recentNCs.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">Sua operação está 100% conforme hoje.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentNCs.map((nc, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                    <div className={cn("w-2 h-10 rounded-full shrink-0", statusColors[nc.status] || "bg-muted")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-tighter text-primary/70">{nc.setor}</p>
                      <p className="text-sm font-medium truncate leading-tight mt-0.5">{nc.descricao}</p>
                    </div>
                    <Badge className={cn("rounded-full px-2 text-[9px] font-bold uppercase tracking-tighter", statusColors[nc.status])}>
                      {statusLabels[nc.status] || nc.status}
                    </Badge>
                  </div>
                ))}
                <Link to="/nao-conformidades" className="block text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-primary/60 hover:text-primary">
                    Gerenciar Desvios <ArrowRight aria-hidden="true" className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Onboarding Overlay */}
      {showOnboarding && <OnboardingOverlay onClose={fecharTour} />}
    </div>
  );
}
