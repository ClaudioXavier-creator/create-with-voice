import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ncPorSetor = [
  { setor: "Moagem", quantidade: 5 },
  { setor: "Armazenamento", quantidade: 8 },
  { setor: "Mistura", quantidade: 3 },
  { setor: "Peletização", quantidade: 2 },
  { setor: "Expedição", quantidade: 4 },
  { setor: "Área externa", quantidade: 6 },
];

const statusNC = [
  { name: "Abertas", value: 3, color: "hsl(0, 72%, 51%)" },
  { name: "Em andamento", value: 5, color: "hsl(38, 92%, 50%)" },
  { name: "Fechadas", value: 15, color: "hsl(145, 63%, 32%)" },
];

const conformidadeMensal = [
  { mes: "Out", pct: 78 },
  { mes: "Nov", pct: 82 },
  { mes: "Dez", pct: 79 },
  { mes: "Jan", pct: 85 },
  { mes: "Fev", pct: 88 },
  { mes: "Mar", pct: 85 },
];

export default function Indicadores() {
  return (
    <>
      <PageHeader icon={BarChart3} title="Indicadores" description="Dashboard de indicadores de gestão BPF" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* NC por setor */}
        <Card>
          <CardHeader><CardTitle className="font-display text-base">NCs por Setor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ncPorSetor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="setor" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="hsl(145, 63%, 32%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status NCs */}
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Status das NCs</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusNC} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {statusNC.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolução conformidade */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Evolução da Conformidade BPF (%)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={conformidadeMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="pct" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
