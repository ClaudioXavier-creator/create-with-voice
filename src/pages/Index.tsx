import { useEffect, useState } from "react";
import { LayoutDashboard, AlertTriangle, ClipboardCheck, GraduationCap, CheckCircle2, CalendarDays, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

interface NCPorMes {
  mes: string;
  abertas: number;
  fechadas: number;
}

interface ConformidadePorMes {
  mes: string;
  percentual: number;
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
  atividadesVencidas: { atividade: string; proxima_execucao: string; categoria: string }[];
  atividadesProximas: { atividade: string; proxima_execucao: string; categoria: string; dias: number }[];
  loading: boolean;
}

export default function Index() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    ncAbertas: 0,
    auditoriasRealizadas: 0,
    treinamentosPendentes: 0,
    conformidadeBPF: 0,
    recentNCs: [],
    conformidadePorArea: [],
    ncPorMes: [],
    conformidadePorMes: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    async function fetchDashboard() {
      const [ncsRes, ncsFullRes, checklistRes, checklistDatesRes, treinamentosRes, recentNcsRes] = await Promise.all([
        supabase.from("nao_conformidades").select("status").eq("user_id", user!.id),
        supabase.from("nao_conformidades").select("data, status").eq("user_id", user!.id),
        supabase.from("checklist_items").select("area, conforme").eq("user_id", user!.id),
        supabase.from("checklist_items").select("auditoria_data, conforme").eq("user_id", user!.id),
        supabase.from("treinamentos").select("validade").eq("user_id", user!.id),
        supabase
          .from("nao_conformidades")
          .select("setor, descricao, status")
          .eq("user_id", user!.id)
          .order("data", { ascending: false })
          .limit(5),
      ]);

      const ncs = ncsRes.data || [];
      const ncsFull = ncsFullRes.data || [];
      const checklist = checklistRes.data || [];
      const checklistDates = checklistDatesRes.data || [];
      const treinamentos = treinamentosRes.data || [];
      const recentNCs = (recentNcsRes.data || []).map((nc) => ({
        setor: nc.setor,
        descricao: nc.descricao,
        status: nc.status || "aberta",
      }));

      // NCs abertas
      const ncAbertas = ncs.filter((nc) => nc.status === "aberta" || nc.status === "em_andamento").length;

      // Auditorias = datas únicas de checklist
      const auditoriasRealizadas = new Set(
        checklistDates.map((c) => c.auditoria_data).filter(Boolean)
      ).size;

      // Treinamentos pendentes
      const hoje = new Date();
      const em30dias = new Date();
      em30dias.setDate(hoje.getDate() + 30);
      const treinamentosPendentes = treinamentos.filter((t) => {
        if (!t.validade) return true;
        const validade = new Date(t.validade);
        return validade <= em30dias;
      }).length;

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

      // Conformidade BPF geral
      const totalChecklist = checklist.length;
      const totalConformes = checklist.filter((c) => c.conforme === true).length;
      const conformidadeBPF = totalChecklist > 0 ? Math.round((totalConformes / totalChecklist) * 100) : 0;

      // --- Gráfico: NCs por mês (últimos 6 meses) ---
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

      // --- Gráfico: Conformidade por mês (baseado em auditoria_data) ---
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
        return {
          mes: mesesNomes[parseInt(m) - 1],
          percentual: val.total > 0 ? Math.round((val.conformes / val.total) * 100) : 0,
        };
      });

      setData({
        ncAbertas,
        auditoriasRealizadas,
        treinamentosPendentes,
        conformidadeBPF,
        recentNCs,
        conformidadePorArea,
        ncPorMes,
        conformidadePorMes,
        loading: false,
      });
    }

    fetchDashboard();
  }, [user]);

  const stats = [
    { label: "Conformidade BPF", value: data.loading ? "..." : `${data.conformidadeBPF}%`, icon: CheckCircle2, color: "text-success" },
    { label: "NCs Abertas", value: data.loading ? "..." : `${data.ncAbertas}`, icon: AlertTriangle, color: "text-warning" },
    { label: "Auditorias Realizadas", value: data.loading ? "..." : `${data.auditoriasRealizadas}`, icon: ClipboardCheck, color: "text-info" },
    { label: "Treinamentos Pendentes", value: data.loading ? "..." : `${data.treinamentosPendentes}`, icon: GraduationCap, color: "text-destructive" },
  ];

  return (
    <>
      <PageHeader icon={LayoutDashboard} title="Dashboard" description="Visão geral do sistema FeedBPF" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : data.conformidadePorArea.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado de auditoria encontrado. Realize uma auditoria para ver a conformidade por área.</p>
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
          <CardHeader>
            <CardTitle className="font-display text-lg">Não Conformidades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : data.recentNCs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma não conformidade registrada ainda.</p>
            ) : (
              data.recentNCs.map((nc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{nc.descricao}</p>
                    <p className="text-xs text-muted-foreground">{nc.setor}</p>
                  </div>
                  <Badge className={statusColors[nc.status] || ""}>{statusLabels[nc.status] || nc.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Evolução de NCs */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Evolução de NCs (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
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

        {/* Conformidade ao longo do tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Conformidade BPF (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
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
    </>
  );
}
