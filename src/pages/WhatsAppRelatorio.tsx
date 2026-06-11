import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  FileText, 
  Calendar, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter
} from "lucide-react";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

export default function WhatsAppRelatorio() {
  const [dateRange, setDateRange] = useState({
    from: format(new Date().setDate(new Date().getDate() - 7), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: mensagens, isLoading } = useQuery({
    queryKey: ["whatsapp-relatorio", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_mensagens")
        .select("*")
        .gte("created_at", startOfDay(parseISO(dateRange.from)).toISOString())
        .lte("created_at", endOfDay(parseISO(dateRange.to)).toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    if (!mensagens) return { total: 0, sent: 0, error: 0, delivered: 0 };
    return {
      total: mensagens.length,
      sent: mensagens.filter(m => m.status === "enviada" || m.status === "sent").length,
      error: mensagens.filter(m => m.status === "erro" || m.status === "failed").length,
      delivered: mensagens.filter(m => m.status === "delivered" || m.status === "read").length,
    };
  }, [mensagens]);

  const chartData = useMemo(() => {
    if (!mensagens) return [];
    const days: Record<string, any> = {};
    
    mensagens.forEach(m => {
      const day = format(parseISO(m.created_at), "dd/MM");
      if (!days[day]) days[day] = { name: day, enviados: 0, erros: 0 };
      if (m.status === "enviada" || m.status === "sent") days[day].enviados++;
      if (m.status === "erro" || m.status === "failed") days[day].erros++;
    });

    return Object.values(days).reverse();
  }, [mensagens]);

  const pieData = [
    { name: "Sucesso", value: stats.sent + stats.delivered },
    { name: "Erro", value: stats.error },
  ];

  const filteredMensagens = useMemo(() => {
    if (!mensagens) return [];
    if (!searchTerm) return mensagens;
    const s = searchTerm.toLowerCase();
    return mensagens.filter(m => 
      m.to_number?.includes(s) || 
      m.body?.toLowerCase().includes(s) ||
      JSON.stringify(m.raw)?.toLowerCase().includes(s)
    );
  }, [mensagens, searchTerm]);

  const handleExport = () => {
    const csv = [
      ["Data", "Número", "Status", "Mensagem", "Módulo", "Tipo"].join(","),
      ...filteredMensagens.map(m => [
        format(parseISO(m.created_at), "yyyy-MM-dd HH:mm"),
        m.to_number,
        m.status,
        `"${m.body?.replace(/"/g, '""')}"`,
        m.raw?.modulo || "N/A",
        m.raw?.tipo || "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-whatsapp-${dateRange.from}-a-${dateRange.to}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Relatório WhatsApp
          </h2>
          <p className="text-muted-foreground">Analise o desempenho dos seus disparos e campanhas.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted p-1 rounded-md border">
            <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
            <Input 
              type="date" 
              value={dateRange.from} 
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="border-0 bg-transparent h-8 w-36 focus-visible:ring-0"
            />
            <span className="text-muted-foreground">até</span>
            <Input 
              type="date" 
              value={dateRange.to} 
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="border-0 bg-transparent h-8 w-36 focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleExport} title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Envios</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sucesso</p>
                <h3 className="text-2xl font-bold text-emerald-600">{stats.sent + stats.delivered}</h3>
              </div>
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falhas</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.error}</h3>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Entrega</p>
                <h3 className="text-2xl font-bold">
                  {stats.total > 0 ? (( (stats.sent + stats.delivered) / stats.total) * 100).toFixed(1) : 0}%
                </h3>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <BarChart className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Envios</CardTitle>
            <CardDescription>Volume diário de mensagens enviadas e erros.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enviados" name="Sucesso" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="erros" name="Erro" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Proporção de sucesso vs falha.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Logs Detalhados</CardTitle>
            <CardDescription>Lista completa de disparos no período selecionado.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por número ou texto..." 
              className="pl-8" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Data/Hora</th>
                  <th className="text-left p-3 font-medium">Destinatário</th>
                  <th className="text-left p-3 font-medium">Mensagem</th>
                  <th className="text-left p-3 font-medium">Módulo</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMensagens.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      {format(parseISO(m.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </td>
                    <td className="p-3 font-mono">{m.to_number}</td>
                    <td className="p-3 max-w-xs truncate" title={m.body}>
                      {m.body}
                    </td>
                    <td className="p-3 uppercase">
                      <Badge variant="outline">{m.raw?.modulo || "Manual"}</Badge>
                    </td>
                    <td className="p-3">
                      {(m.status === "enviada" || m.status === "sent") && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Enviado
                        </Badge>
                      )}
                      {(m.status === "erro" || m.status === "failed") && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Erro
                        </Badge>
                      )}
                      {(!m.status || m.status === "pending") && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" /> Pendente
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredMensagens.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Nenhum registro encontrado para este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}