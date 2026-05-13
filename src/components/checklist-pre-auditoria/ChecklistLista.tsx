import { ArrowRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckItem, CheckStatus } from "./types";

interface ChecklistListaProps {
  items: CheckItem[];
  loading: boolean;
}

const statusMap: Record<CheckStatus, { icon: typeof CheckCircle2; label: string; badgeVariant: "default" | "secondary" | "destructive" }> = {
  ok: { icon: CheckCircle2, label: "Conforme", badgeVariant: "default" },
  alerta: { icon: AlertTriangle, label: "Atenção", badgeVariant: "secondary" },
  critico: { icon: XCircle, label: "Crítico", badgeVariant: "destructive" },
};

export default function ChecklistLista({ items, loading }: ChecklistListaProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const status = statusMap[item.status];
        const StatusIcon = status.icon;

        return (
          <Card key={`${item.area}-${index}`}>
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <StatusIcon aria-hidden="true" className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <item.icon aria-hidden="true" className="h-5 w-5 text-foreground" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{item.item}</p>
                  <Badge variant={status.badgeVariant}>{status.label}</Badge>
                  <Badge variant="outline">{item.area}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.detalhe}</p>
              </div>

              <Link to={item.link} className="ml-auto">
                <Button variant="ghost" size="sm" className="gap-2">
                  Abrir
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}