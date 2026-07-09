import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Loader2, Target } from "lucide-react";

// Probabilidade por etapa (%)
const PROB: Record<string, number> = {
  novo: 5, contato_inicial: 15, qualificado: 30, proposta: 55, negociacao: 75, ganho: 100, perdido: 0,
};

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function ForecastPanel() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("crm_pipeline").select("etapa,valor_estimado,produto_interesse,updated_at,ganho_em");
      setPipeline(data || []); setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const abertos = pipeline.filter(p => !["ganho", "perdido"].includes(p.etapa));
    const ganhos = pipeline.filter(p => p.etapa === "ganho");
    const perdidos = pipeline.filter(p => p.etapa === "perdido");

    const ponderado = (arr: any[]) => arr.reduce((s, p) => s + (Number(p.valor_estimado) || 0) * ((PROB[p.etapa] ?? 0) / 100), 0);
    const totalPipe = abertos.reduce((s, p) => s + (Number(p.valor_estimado) || 0), 0);
    const forecast = ponderado(abertos);
    const ganhoTotal = ganhos.reduce((s, p) => s + (Number(p.valor_estimado) || 0), 0);

    // Sem data prevista de fechamento: distribui forecast proporcionalmente por etapa (janelas heurísticas)
    // Etapas avançadas fecham mais cedo: negociação/proposta => 30d, qualificado => 60d, novo/contato => 90d
    const janelaEtapa: Record<string, number> = { novo: 90, contato_inicial: 90, qualificado: 60, proposta: 30, negociacao: 30 };
    const f30 = ponderado(abertos.filter(p => (janelaEtapa[p.etapa] ?? 90) <= 30));
    const f60 = ponderado(abertos.filter(p => (janelaEtapa[p.etapa] ?? 90) <= 60));
    const f90 = forecast;

    const winRate = ganhos.length + perdidos.length > 0 ? (ganhos.length / (ganhos.length + perdidos.length)) * 100 : 0;
    const ticketMedio = ganhos.length ? ganhoTotal / ganhos.length : 0;

    const porEtapa = Object.keys(PROB).map(e => {
      const arr = pipeline.filter(p => p.etapa === e);
      const val = arr.reduce((s, p) => s + (Number(p.valor_estimado) || 0), 0);
      return { etapa: e, count: arr.length, valor: val, ponderado: val * (PROB[e] / 100) };
    });

    const porProduto: Record<string, { count: number; valor: number; forecast: number }> = {};
    for (const p of abertos) {
      const k = p.produto_interesse || "sem_produto";
      if (!porProduto[k]) porProduto[k] = { count: 0, valor: 0, forecast: 0 };
      porProduto[k].count++;
      porProduto[k].valor += Number(p.valor_estimado) || 0;
      porProduto[k].forecast += (Number(p.valor_estimado) || 0) * ((PROB[p.etapa] ?? 0) / 100);
    }

    return { totalPipe, forecast, ganhoTotal, f30, f60, f90, winRate, ticketMedio, porEtapa, porProduto, abertos: abertos.length };
  }, [pipeline]);

  if (loading) return <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Forecast de Vendas</h2>
        <p className="text-sm text-muted-foreground">Previsão de receita ponderada pela probabilidade de fechamento por etapa</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{fmtBRL(stats.totalPipe)}</div><div className="text-xs text-muted-foreground">Pipeline aberto ({stats.abertos})</div></CardContent></Card>
        <Card className="border-primary"><CardContent className="pt-4"><div className="text-2xl font-bold text-primary">{fmtBRL(stats.forecast)}</div><div className="text-xs text-muted-foreground">Forecast ponderado total</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{fmtBRL(stats.ganhoTotal)}</div><div className="text-xs text-muted-foreground">Ganho acumulado</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{stats.winRate.toFixed(0)}%</div><div className="text-xs text-muted-foreground">Win rate · ticket {fmtBRL(stats.ticketMedio)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Forecast por janela</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-muted/30"><div className="text-xs text-muted-foreground">Próximos 30 dias</div><div className="text-xl font-bold">{fmtBRL(stats.f30)}</div></div>
          <div className="p-3 rounded-lg border bg-muted/30"><div className="text-xs text-muted-foreground">Próximos 60 dias</div><div className="text-xl font-bold">{fmtBRL(stats.f60)}</div></div>
          <div className="p-3 rounded-lg border bg-muted/30"><div className="text-xs text-muted-foreground">Próximos 90 dias</div><div className="text-xl font-bold">{fmtBRL(stats.f90)}</div></div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline por etapa</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.porEtapa.filter(e => e.count > 0).map(e => (
              <div key={e.etapa} className="flex items-center justify-between text-sm p-2 border rounded">
                <div className="flex items-center gap-2"><Badge variant="outline">{e.etapa}</Badge><span className="text-muted-foreground">{e.count} · prob {PROB[e.etapa]}%</span></div>
                <div className="text-right"><div className="font-medium">{fmtBRL(e.valor)}</div><div className="text-xs text-muted-foreground">ponderado {fmtBRL(e.ponderado)}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Forecast por produto</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.porProduto).sort((a, b) => b[1].forecast - a[1].forecast).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm p-2 border rounded">
                <div><Badge variant="outline">{k}</Badge> <span className="text-muted-foreground">{v.count} deals</span></div>
                <div className="text-right"><div className="font-medium text-primary">{fmtBRL(v.forecast)}</div><div className="text-xs text-muted-foreground">de {fmtBRL(v.valor)}</div></div>
              </div>
            ))}
            {!Object.keys(stats.porProduto).length && <div className="text-sm text-muted-foreground text-center py-4">Sem deals abertos.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
