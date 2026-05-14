import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ClipboardCheck, GraduationCap, Wrench, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  conformidadeBPF: number;
  ncAbertas: number;
  auditoriasRealizadas: number;
  treinamentosPendentes: number;
  calibracoesVencidas: number;
  docsVencidos: number;
}

export function DashboardStats(props: DashboardStatsProps) {
  const stats = [
    { label: "Conformidade BPF", value: `${props.conformidadeBPF}%`, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", link: "/auditoria" },
    { label: "NCs Abertas", value: `${props.ncAbertas}`, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", link: "/nao-conformidades" },
    { label: "Auditorias", value: `${props.auditoriasRealizadas}`, icon: ClipboardCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", link: "/auditoria" },
    { label: "Treinamentos", value: `${props.treinamentosPendentes}`, icon: GraduationCap, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", link: "/treinamentos" },
    { label: "Calibrações", value: `${props.calibracoesVencidas}`, icon: Wrench, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", link: "/manutencao" },
    { label: "Docs p/ Revisão", value: `${props.docsVencidos}`, icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", link: "/documentos" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <Link key={i} to={stat.link}>
          <Card className={`border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 group bg-card`}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{stat.label}</p>
              <p className={`text-xl font-display font-black ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
