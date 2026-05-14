import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface DashboardPrioritiesProps {
  acoes: any[];
}

const criticidadeConfig: Record<string, any> = {
  critico: { badge: "destructive", container: "border-destructive/40 bg-destructive/5", text: "text-destructive", label: "Crítico" },
  atencao: { badge: "secondary", container: "border-warning/40 bg-warning/5", text: "text-warning-foreground", label: "Atenção" },
  estavel: { badge: "outline", container: "border-primary/30 bg-primary/5", text: "text-primary", label: "Estável" },
};

export function DashboardPriorities({ acoes }: DashboardPrioritiesProps) {
  return (
    <Card className="border-border/50 shadow-premium overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-bold">Ações Prioritárias</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3 pt-4">
        {acoes.map((acao, i) => {
          const config = criticidadeConfig[acao.criticidade] || criticidadeConfig.estavel;
          return (
            <Link key={i} to={acao.link} className={`block p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${config.container}`}>
              <div className="flex justify-between items-start mb-1.5">
                <Badge variant={config.badge} className="text-[9px] uppercase font-black px-1.5 py-0">{config.label}</Badge>
                <AlertTriangle className={`h-3.5 w-3.5 ${config.text}`} />
              </div>
              <h4 className="text-xs font-bold leading-tight mb-1">{acao.titulo}</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{acao.detalhe}</p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
