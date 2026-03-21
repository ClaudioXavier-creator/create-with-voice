import { useEffect, useState } from "react";
import { LayoutDashboard, AlertTriangle, ClipboardCheck, GraduationCap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    async function fetchDashboard() {
      const [ncsRes, checklistRes, treinamentosRes, recentNcsRes] = await Promise.all([
        supabase.from("nao_conformidades").select("status").eq("user_id", user!.id),
        supabase.from("checklist_items").select("area, conforme").eq("user_id", user!.id),
        supabase.from("treinamentos").select("validade").eq("user_id", user!.id),
        supabase
          .from("nao_conformidades")
          .select("setor, descricao, status")
          .eq("user_id", user!.id)
          .order("data", { ascending: false })
          .limit(5),
      ]);

      const ncs = ncsRes.data || [];
      const checklist = checklistRes.data || [];
      const treinamentos = treinamentosRes.data || [];
      const recentNCs = (recentNcsRes.data || []).map((nc) => ({
        setor: nc.setor,
        descricao: nc.descricao,
        status: nc.status || "aberta",
      }));

      // NCs abertas
      const ncAbertas = ncs.filter((nc) => nc.status === "aberta" || nc.status === "em_andamento").length;

      // Auditorias = datas únicas de checklist
      const uniqueDates = new Set(checklist.map(() => "audit"));
      const auditoriasRealizadas = checklist.length > 0 ? new Set(
        (await supabase.from("checklist_items").select("auditoria_data").eq("user_id", user!.id)).data?.map(
          (c) => c.auditoria_data
        ).filter(Boolean) || []
      ).size : 0;

      // Treinamentos pendentes (vencidos ou a vencer em 30 dias)
      const hoje = new Date();
      const em30dias = new Date();
      em30dias.setDate(hoje.getDate() + 30);
      const treinamentosPendentes = treinamentos.filter((t) => {
        if (!t.validade) return true;
        const validade = new Date(t.validade);
        return validade <= em30dias;
      }).length;

      // Conformidade por área (checklist)
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

      setData({
        ncAbertas,
        auditoriasRealizadas,
        treinamentosPendentes,
        conformidadeBPF,
        recentNCs,
        conformidadePorArea,
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
    </>
  );
}
