import { Wrench, GraduationCap, FileText, Droplets, CalendarDays, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";

const alertaIconMap: Record<string, any> = {
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

interface DashboardAlertsProps {
  alertas: any[];
}

export function DashboardAlerts({ alertas }: DashboardAlertsProps) {
  return (
    <Card className="border-border/50 shadow-premium overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span>Alertas Próximos</span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{alertas.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {alertas.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted-foreground italic">Nenhum alerta para os próximos 30 dias.</p>
          ) : (
            alertas.slice(0, 5).map((alerta, i) => {
              const Icon = alertaIconMap[alerta.tipo] || FileText;
              return (
                <Link key={i} to={alerta.link} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">{alertaTipoLabel[alerta.tipo]}</p>
                    <p className="text-xs font-semibold truncate leading-tight mb-0.5">{alerta.descricao}</p>
                    <p className="text-[10px] text-muted-foreground">Vence em {format(parseISO(alerta.vencimento), "dd/MM")}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
