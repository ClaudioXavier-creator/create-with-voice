import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface DashboardOperationalHealthProps {
  items: any[];
}

export function DashboardOperationalHealth({ items }: DashboardOperationalHealthProps) {
  return (
    <Card className="border-border/50 shadow-premium overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-bold">Saúde Operacional</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5">
        {items.map((item, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={item.valor < 70 ? "text-rose-500" : item.valor < 90 ? "text-amber-500" : "text-emerald-500"}>{item.valor}%</span>
            </div>
            <Progress value={item.valor} className="h-1.5 bg-muted" />
            <div className="flex items-center justify-between group">
              <p className="text-[10px] text-muted-foreground leading-none">{item.descricao}</p>
              <Link to={item.link} className="p-1 rounded-full hover:bg-muted text-primary opacity-0 group-hover:opacity-100 transition-all">
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
