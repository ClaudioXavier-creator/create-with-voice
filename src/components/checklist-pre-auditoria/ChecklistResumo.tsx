import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChecklistMetrics, CheckItem } from "./types";

interface ChecklistResumoProps {
  metrics: ChecklistMetrics;
  items: CheckItem[];
  loading: boolean;
  children?: ReactNode;
}

export default function ChecklistResumo({ metrics, items, loading, children }: ChecklistResumoProps) {
  const focoPrincipal = items.find((item) => item.status === "critico") ?? items.find((item) => item.status === "alerta");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Prontidão atual</p>
              <h2 className="font-display text-3xl font-bold text-foreground">{loading ? "..." : `${metrics.pct}%`}</h2>
              <p className="text-sm text-muted-foreground">
                {metrics.oks} de {metrics.total} verificações aprovadas
              </p>
            </div>
            {children}
          </div>

          <Progress value={loading ? 0 : metrics.pct} className="h-3" />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Em dia
              </div>
              <p className="mt-1 text-2xl font-semibold">{metrics.oks}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Alertas
              </div>
              <p className="mt-1 text-2xl font-semibold">{metrics.alertas}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                Críticos
              </div>
              <p className="mt-1 text-2xl font-semibold">{metrics.criticos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Foco imediato</h3>
          </div>

          {focoPrincipal ? (
            <>
              <p className="text-sm font-medium text-foreground">{focoPrincipal.item}</p>
              <p className="text-sm text-muted-foreground">{focoPrincipal.detalhe}</p>
              <p className="text-xs text-muted-foreground">
                Área prioritária: <span className="font-medium text-foreground">{focoPrincipal.area}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum ponto crítico identificado no momento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}