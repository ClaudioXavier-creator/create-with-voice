import { LayoutDashboard, AlertTriangle, ClipboardCheck, GraduationCap, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";

const stats = [
  { label: "Conformidade BPF", value: "85%", icon: CheckCircle2, color: "text-success" },
  { label: "NCs Abertas", value: "3", icon: AlertTriangle, color: "text-warning" },
  { label: "Auditorias Realizadas", value: "12", icon: ClipboardCheck, color: "text-info" },
  { label: "Treinamentos Pendentes", value: "2", icon: GraduationCap, color: "text-destructive" },
];

const recentNCs = [
  { setor: "Moagem", desc: "Resíduos no moinho", status: "fechada" },
  { setor: "Armazenamento", desc: "Sacos sem identificação", status: "em_andamento" },
  { setor: "Área externa", desc: "Armadilha danificada", status: "aberta" },
];

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

export default function Index() {
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
            {[
              { area: "Estrutura", pct: 90 },
              { area: "Higiene", pct: 80 },
              { area: "Controle de Pragas", pct: 95 },
              { area: "Armazenamento", pct: 75 },
              { area: "Produção", pct: 88 },
              { area: "Documentação", pct: 70 },
            ].map((item) => (
              <div key={item.area}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.area}</span>
                  <span className="text-muted-foreground">{item.pct}%</span>
                </div>
                <Progress value={item.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* NCs Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Não Conformidades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNCs.map((nc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{nc.desc}</p>
                  <p className="text-xs text-muted-foreground">{nc.setor}</p>
                </div>
                <Badge className={statusColors[nc.status]}>{statusLabels[nc.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
