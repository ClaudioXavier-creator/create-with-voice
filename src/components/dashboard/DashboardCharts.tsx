import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface DashboardChartsProps {
  ncs: any[];
  checklist: any[];
  conformidadePorArea: { area: string; pct: number }[];
}

export const DashboardCharts = memo(({ ncs, checklist, conformidadePorArea }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-border/50 shadow-premium overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">Desempenho por Área de BPF</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conformidadePorArea} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
              <XAxis type="number" hide />
              <YAxis dataKey="area" type="category" width={80} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px" }} />
              <Bar dataKey="pct" name="Conformidade %" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* Adicione outros gráficos conforme necessário ou mantenha simplificado para auditoria */}
    </div>
  );
});

DashboardCharts.displayName = "DashboardCharts";
