import { useState, useEffect, useMemo } from "react";
import { BarChart3, Factory, Clock, CheckCircle2, Loader2, TrendingUp, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";

// ── Types ──────────────────────────────────────────────
interface OrdemProd {
  id: string;
  produto: string;
  quantidade_programada: string | null;
  status: string | null;
  data_programada: string;
  created_at: string;
}

interface Batida {
  id: string;
  ordem_id: string;
  tempo_mistura_minutos: number | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  status: string | null;
  created_at: string;
}

interface NC {
  id: string;
  setor: string;
  status: string | null;
  data: string;
}

interface CheckItem {
  id: string;
  area: string;
  conforme: boolean | null;
  auditoria_data: string | null;
}

interface RecebimentoMP {
  id: string;
  aprovado: boolean | null;
  data: string;
}

// ── Helpers ────────────────────────────────────────────
const COLORS = [
  "hsl(145, 63%, 32%)", "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(280, 60%, 50%)", "hsl(170, 60%, 40%)",
];

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function groupByMonth<T>(items: T[], dateKey: keyof T) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = monthLabel(String(item[dateKey]));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export default function Indicadores() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [ordens, setOrdens] = useState<OrdemProd[]>([]);
  const [batidas, setBatidas] = useState<Batida[]>([]);
  const [ncs, setNCs] = useState<NC[]>([]);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoMP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [o, b, n, c, r] = await Promise.all([
        supabase.from("ordens_producao").select("id,produto,quantidade_programada,status,data_programada,created_at").order("data_programada"),
        supabase.from("batidas_producao").select("id,ordem_id,tempo_mistura_minutos,hora_inicio,hora_fim,status,created_at").order("created_at"),
        supabase.from("nao_conformidades").select("id,setor,status,data").order("data"),
        supabase.from("checklist_items").select("id,area,conforme,auditoria_data").order("auditoria_data"),
        supabase.from("recebimento_mp").select("id,aprovado,data").order("data"),
      ]);
      if (o.data) setOrdens(o.data as unknown as OrdemProd[]);
      if (b.data) setBatidas(b.data as unknown as Batida[]);
      if (n.data) setNCs(n.data as unknown as NC[]);
      if (c.data) setChecks(c.data as unknown as CheckItem[]);
      if (r.data) setRecebimentos(r.data as unknown as RecebimentoMP[]);
      setLoading(false);
    })();
  }, [user]);

  // ── Computed data ──────────────────────────────────
  const totalProduzido = useMemo(() => {
    return ordens
      .filter(o => o.status === "concluida")
      .reduce((sum, o) => sum + (parseFloat(o.quantidade_programada || "0") || 0), 0);
  }, [ordens]);

  const tempoMedioMistura = useMemo(() => {
    const comTempo = batidas.filter(b => b.tempo_mistura_minutos && b.tempo_mistura_minutos > 0);
    if (comTempo.length === 0) return 0;
    return Math.round(comTempo.reduce((s, b) => s + (b.tempo_mistura_minutos || 0), 0) / comTempo.length);
  }, [batidas]);

  const taxaConformidade = useMemo(() => {
    if (checks.length === 0) return 0;
    const conformes = checks.filter(c => c.conforme === true).length;
    return Math.round((conformes / checks.length) * 100);
  }, [checks]);

  const taxaAprovacaoMP = useMemo(() => {
    if (recebimentos.length === 0) return 0;
    const aprovados = recebimentos.filter(r => r.aprovado === true).length;
    return Math.round((aprovados / recebimentos.length) * 100);
  }, [recebimentos]);

  // Volume por mês
  const volumeMensal = useMemo(() => {
    const concluidas = ordens.filter(o => o.status === "concluida");
    const byMonth = groupByMonth(concluidas, "data_programada");
    return Array.from(byMonth.entries()).map(([mes, items]) => ({
      mes,
      volume: items.reduce((s, o) => s + (parseFloat(o.quantidade_programada || "0") || 0), 0),
    }));
  }, [ordens]);

  // Tempo médio mistura por mês
  const tempoMensalMistura = useMemo(() => {
    const comTempo = batidas.filter(b => b.tempo_mistura_minutos && b.tempo_mistura_minutos > 0);
    const byMonth = groupByMonth(comTempo, "created_at");
    return Array.from(byMonth.entries()).map(([mes, items]) => ({
      mes,
      media: Math.round(items.reduce((s, b) => s + (b.tempo_mistura_minutos || 0), 0) / items.length),
    }));
  }, [batidas]);

  // Status ordens (pie)
  const statusOrdens = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of ordens) {
      const s = o.status || "programada";
      counts[s] = (counts[s] || 0) + 1;
    }
    const labels: Record<string, string> = {
      programada: "Programadas", em_producao: "Em Produção", concluida: "Concluídas", cancelada: "Canceladas",
    };
    return Object.entries(counts).map(([key, value], i) => ({
      name: labels[key] || key, value, color: COLORS[i % COLORS.length],
    }));
  }, [ordens]);

  // NC por setor (bar)
  const ncPorSetor = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const nc of ncs) { counts[nc.setor] = (counts[nc.setor] || 0) + 1; }
    return Object.entries(counts).map(([setor, quantidade]) => ({ setor, quantidade }));
  }, [ncs]);

  // NC status (pie)
  const ncStatus = useMemo(() => {
    const counts: Record<string, number> = { aberta: 0, em_andamento: 0, fechada: 0 };
    for (const nc of ncs) {
      const s = nc.status || "aberta";
      counts[s] = (counts[s] || 0) + 1;
    }
    return [
      { name: "Abertas", value: counts.aberta, color: "hsl(0, 72%, 51%)" },
      { name: "Em andamento", value: counts.em_andamento, color: "hsl(38, 92%, 50%)" },
      { name: "Fechadas", value: counts.fechada, color: "hsl(145, 63%, 32%)" },
    ].filter(i => i.value > 0);
  }, [ncs]);

  // Conformidade por área (bar)
  const conformidadePorArea = useMemo(() => {
    const areas: Record<string, { total: number; conformes: number }> = {};
    for (const c of checks) {
      if (!areas[c.area]) areas[c.area] = { total: 0, conformes: 0 };
      areas[c.area].total++;
      if (c.conforme) areas[c.area].conformes++;
    }
    return Object.entries(areas).map(([area, { total, conformes }]) => ({
      area, pct: Math.round((conformes / total) * 100),
    }));
  }, [checks]);

  // Volume por produto (top 5)
  const volumePorProduto = useMemo(() => {
    const prods: Record<string, number> = {};
    for (const o of ordens.filter(o => o.status === "concluida")) {
      prods[o.produto] = (prods[o.produto] || 0) + (parseFloat(o.quantidade_programada || "0") || 0);
    }
    return Object.entries(prods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([produto, volume]) => ({ produto, volume: Math.round(volume) }));
  }, [ordens]);

  if (loading) return (
    <>
      <PageHeader icon={BarChart3} title="Indicadores" description="Dashboard de indicadores de gestão BPF e produção" />
      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
    </>
  );

  return (
    <>
      <PageHeader icon={BarChart3} title="Indicadores" description="Dashboard de indicadores de gestão BPF e produção" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <Factory className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold font-display">{totalProduzido.toLocaleString("pt-BR")} kg</p>
            <p className="text-xs text-muted-foreground">Volume produzido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-info" />
            <p className="text-2xl font-bold font-display">{tempoMedioMistura} min</p>
            <p className="text-xs text-muted-foreground">Tempo médio mistura</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold font-display">{taxaConformidade}%</p>
            <p className="text-xs text-muted-foreground">Taxa de conformidade</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Scale className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold font-display">{taxaAprovacaoMP}%</p>
            <p className="text-xs text-muted-foreground">Aprovação de MP</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="producao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="producao"><Factory className="w-4 h-4 mr-1" /> Produção</TabsTrigger>
          <TabsTrigger value="qualidade"><CheckCircle2 className="w-4 h-4 mr-1" /> Qualidade</TabsTrigger>
          <TabsTrigger value="ncs"><TrendingUp className="w-4 h-4 mr-1" /> Não Conformidades</TabsTrigger>
        </TabsList>

        {/* ── Tab: Produção ── */}
        <TabsContent value="producao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume Mensal */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Volume Produzido por Mês (kg)</CardTitle></CardHeader>
              <CardContent>
                {volumeMensal.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ordem concluída ainda</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={volumeMensal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString("pt-BR")} kg`} />
                      <Area type="monotone" dataKey="volume" stroke="hsl(145, 63%, 32%)" fill="hsl(145, 63%, 32%)" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status Ordens */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Status das Ordens de Produção</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {statusOrdens.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8">Nenhuma ordem registrada</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusOrdens} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}>
                        {statusOrdens.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Volume por Produto */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Volume por Produto (Top 6)</CardTitle></CardHeader>
              <CardContent>
                {volumePorProduto.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={volumePorProduto} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="produto" type="category" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString("pt-BR")} kg`} />
                      <Bar dataKey="volume" fill="hsl(210, 80%, 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Tempo Médio de Mistura por Mês */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Tempo Médio de Mistura por Mês (min)</CardTitle></CardHeader>
              <CardContent>
                {tempoMensalMistura.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma batida com tempo registrado</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={tempoMensalMistura}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(v: number) => `${v} min`} />
                      <Line type="monotone" dataKey="media" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Qualidade ── */}
        <TabsContent value="qualidade" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conformidade por Área */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Conformidade por Área da Auditoria (%)</CardTitle></CardHeader>
              <CardContent>
                {conformidadePorArea.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma auditoria registrada</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conformidadePorArea}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="area" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="pct" fill="hsl(145, 63%, 32%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Taxa de Aprovação de MP */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Recebimento de Matéria-Prima</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {recebimentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8">Nenhum recebimento registrado</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Aprovadas", value: recebimentos.filter(r => r.aprovado).length, color: "hsl(145, 63%, 32%)" },
                          { name: "Reprovadas", value: recebimentos.filter(r => !r.aprovado).length, color: "hsl(0, 72%, 51%)" },
                        ].filter(i => i.value > 0)}
                        dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {[
                          { color: "hsl(145, 63%, 32%)" },
                          { color: "hsl(0, 72%, 51%)" },
                        ].map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Não Conformidades ── */}
        <TabsContent value="ncs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NC por Setor */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">NCs por Setor</CardTitle></CardHeader>
              <CardContent>
                {ncPorSetor.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma NC registrada</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ncPorSetor}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="setor" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status NCs */}
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Status das NCs</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {ncStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8">Nenhuma NC registrada</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={ncStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}>
                        {ncStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
