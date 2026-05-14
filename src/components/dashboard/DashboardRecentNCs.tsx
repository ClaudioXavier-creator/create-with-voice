import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface DashboardRecentNCsProps {
  recentNCs: any[];
}

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

export function DashboardRecentNCs({ recentNCs }: DashboardRecentNCsProps) {
  return (
    <Card className="border-border/50 shadow-premium overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">Desvios Recentes</CardTitle>
        <Link to="/nao-conformidades" className="text-[10px] font-bold text-primary hover:underline flex items-center">
          Ver tudo <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {recentNCs.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted-foreground italic">Nenhuma não conformidade registrada.</p>
          ) : (
            recentNCs.map((nc, i) => (
              <div key={i} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-all group">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">{nc.setor}</span>
                    <Badge variant="outline" className={`text-[9px] uppercase font-black px-1.5 py-0 border-none ${statusColors[nc.status]}`}>
                      {statusLabels[nc.status]}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">{nc.descricao}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
