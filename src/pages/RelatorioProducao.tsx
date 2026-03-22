import { useState, useEffect, useMemo } from "react";
import { BarChart3, Download, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProducaoRow {
  id: string;
  data: string;
  produto: string;
  lote: string | null;
  quantidade: string | null;
}

interface ProdutoInfo {
  nome: string;
  classificacao: string;
  especie_alvo: string | null;
  categoria_animal: string | null;
}

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6", "#f97316",
];

function parseQty(val: string | null): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function RelatorioProducao() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [ano, setAno] = useState(String(currentYear));
  const [mes, setMes] = useState(String(currentMonth));
  const [producao, setProducao] = useState<ProducaoRow[]>([]);
  const [produtos, setProdutos] = useState<ProdutoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
      const endMonth = Number(mes) === 12 ? 1 : Number(mes) + 1;
      const endYear = Number(mes) === 12 ? Number(ano) + 1 : Number(ano);
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      const [prodRes, produtosRes] = await Promise.all([
        supabase.from("producao").select("*").gte("data", startDate).lt("data", endDate).order("data"),
        supabase.from("produtos").select("nome, classificacao, especie_alvo, categoria_animal"),
      ]);

      setProducao(prodRes.data || []);
      setProdutos(produtosRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user, ano, mes]);

  const produtoMap = useMemo(() => {
    const map: Record<string, ProdutoInfo> = {};
    for (const p of produtos) {
      map[p.nome.toLowerCase()] = p;
    }
    return map;
  }, [produtos]);

  const enriched = useMemo(() => {
    return producao.map(p => {
      const info = produtoMap[p.produto.toLowerCase()];
      return {
        ...p,
        classificacao: info?.classificacao || "Outros",
        especie: info?.especie_alvo || "Não especificada",
        categoria: info?.categoria_animal || "",
        qty: parseQty(p.quantidade),
      };
    });
  }, [producao, produtoMap]);

  // Group by classification (segment)
  const bySegmento = useMemo(() => {
    const map: Record<string, { qty: number; count: number }> = {};
    for (const e of enriched) {
      const key = e.classificacao;
      if (!map[key]) map[key] = { qty: 0, count: 0 };
      map[key].qty += e.qty;
      map[key].count += 1;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty);
  }, [enriched]);

  // Group by species
  const byEspecie = useMemo(() => {
    const map: Record<string, { qty: number; count: number }> = {};
    for (const e of enriched) {
      const key = e.especie;
      if (!map[key]) map[key] = { qty: 0, count: 0 };
      map[key].qty += e.qty;
      map[key].count += 1;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty);
  }, [enriched]);

  // Group by product
  const byProduto = useMemo(() => {
    const map: Record<string, { qty: number; count: number; classificacao: string; especie: string }> = {};
    for (const e of enriched) {
      if (!map[e.produto]) map[e.produto] = { qty: 0, count: 0, classificacao: e.classificacao, especie: e.especie };
      map[e.produto].qty += e.qty;
      map[e.produto].count += 1;
    }
    return Object.entries(map).map(([produto, v]) => ({ produto, ...v })).sort((a, b) => b.qty - a.qty);
  }, [enriched]);

  const totalQty = enriched.reduce((s, e) => s + e.qty, 0);
  const totalBatches = enriched.length;

  const exportCsv = () => {
    const now = new Date().toISOString().slice(0, 10);
    let csv = `Relatório Mensal de Produção — ${MESES[Number(mes) - 1]}/${ano}\n\n`;
    csv += "RESUMO POR SEGMENTO\nSegmento,Quantidade (kg),Batidas\n";
    for (const s of bySegmento) csv += `${escapeCsv(s.name)},${s.qty.toFixed(0)},${s.count}\n`;
    csv += `\nRESUMO POR ESPÉCIE\nEspécie,Quantidade (kg),Batidas\n`;
    for (const e of byEspecie) csv += `${escapeCsv(e.name)},${e.qty.toFixed(0)},${e.count}\n`;
    csv += `\nDETALHE POR PRODUTO\nProduto,Segmento,Espécie,Quantidade (kg),Batidas\n`;
    for (const p of byProduto) csv += `${escapeCsv(p.produto)},${escapeCsv(p.classificacao)},${escapeCsv(p.especie)},${p.qty.toFixed(0)},${p.count}\n`;
    csv += `\nTOTAL,${totalQty.toFixed(0)},${totalBatches}\n`;

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_producao_${ano}_${mes.padStart(2, "0")}_${now}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  return (
    <>
      <PageHeader icon={BarChart3} title="Relatório Mensal de Produção" description="Produção por segmento de produto e espécie" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Mês</label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-40"><Calendar className="w-4 h-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Ano</label>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={loading}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : enriched.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum registro de produção para {MESES[Number(mes) - 1]}/{ano}.</CardContent></Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display">{totalBatches}</p>
              <p className="text-xs text-muted-foreground">Batidas/Lotes</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-primary">{(totalQty / 1000).toFixed(1)} t</p>
              <p className="text-xs text-muted-foreground">Produção Total</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display">{bySegmento.length}</p>
              <p className="text-xs text-muted-foreground">Segmentos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display">{byEspecie.length}</p>
              <p className="text-xs text-muted-foreground">Espécies</p>
            </CardContent></Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader><CardTitle className="font-display text-sm">Produção por Segmento (kg)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={bySegmento}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} kg`} />
                    <Bar dataKey="qty" name="Quantidade (kg)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-display text-sm">Distribuição por Espécie</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={byEspecie} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {byEspecie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Table: By Segment */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="font-display text-sm">Resumo por Segmento</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segmento</TableHead>
                    <TableHead className="text-right">Quantidade (kg)</TableHead>
                    <TableHead className="text-right">Batidas</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bySegmento.map(s => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.qty.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-right">{totalQty > 0 ? ((s.qty / totalQty) * 100).toFixed(1) : 0}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{totalQty.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{totalBatches}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Table: By Species */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="font-display text-sm">Resumo por Espécie</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Espécie</TableHead>
                    <TableHead className="text-right">Quantidade (kg)</TableHead>
                    <TableHead className="text-right">Batidas</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byEspecie.map(e => (
                    <TableRow key={e.name}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-right">{e.qty.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{e.count}</TableCell>
                      <TableCell className="text-right">{totalQty > 0 ? ((e.qty / totalQty) * 100).toFixed(1) : 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Table: Detail by Product */}
          <Card>
            <CardHeader><CardTitle className="font-display text-sm">Detalhe por Produto</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead className="text-right">Quantidade (kg)</TableHead>
                    <TableHead className="text-right">Batidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byProduto.map(p => (
                    <TableRow key={p.produto}>
                      <TableCell className="font-medium">{p.produto}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.classificacao}</Badge></TableCell>
                      <TableCell>{p.especie}</TableCell>
                      <TableCell className="text-right">{p.qty.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{p.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
