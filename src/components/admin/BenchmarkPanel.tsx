import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2 } from "lucide-react";

const PRODUTOS = ["feed_bpf", "audits_bpf", "agrogestao", "nutricrm", "feedbpfcustom", "rotulos"];
const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function BenchmarkPanel() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [licencas, setLicencas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, l, lc] = await Promise.all([
        supabase.from("crm_pipeline").select("etapa,valor_estimado,produto_interesse,created_at"),
        supabase.from("leads").select("produto_interesse,created_at"),
        supabase.functions.invoke("admin-licencas", { body: { action: "list" } }),
      ]);
      setPipeline(p.data || []); setLeads(l.data || []); setLicencas(lc.data || []);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => {
    return PRODUTOS.map(prod => {
      const leadsP = leads.filter(l => (l.produto_interesse || "").toLowerCase() === prod);
      const pipeP = pipeline.filter(p => (p.produto_interesse || "").toLowerCase() === prod);
      const ganhos = pipeP.filter(p => p.etapa === "ganho");
      const perdidos = pipeP.filter(p => p.etapa === "perdido");
      const abertos = pipeP.filter(p => !["ganho", "perdido"].includes(p.etapa));
      const licsP = licencas.filter((li: any) => (li.produto || "").toLowerCase() === prod);
      const ativas = licsP.filter((li: any) => li.liberado_admin || (li.status === "ativa" && new Date(li.data_expiracao) > new Date()));
      const receita = ganhos.reduce((s, p) => s + (Number(p.valor_estimado) || 0), 0);
      const pipeAberto = abertos.reduce((s, p) => s + (Number(p.valor_estimado) || 0), 0);
      const winRate = ganhos.length + perdidos.length > 0 ? (ganhos.length / (ganhos.length + perdidos.length)) * 100 : 0;
      const conversao = leadsP.length > 0 ? (ganhos.length / leadsP.length) * 100 : 0;
      const ticket = ganhos.length ? receita / ganhos.length : 0;
      return { prod, leads: leadsP.length, pipe: pipeP.length, abertos: abertos.length, ganhos: ganhos.length, perdidos: perdidos.length, pipeAberto, receita, winRate, conversao, ticket, licencas: licsP.length, ativas: ativas.length };
    });
  }, [pipeline, leads, licencas]);

  const totais = useMemo(() => ({
    leads: rows.reduce((s, r) => s + r.leads, 0),
    receita: rows.reduce((s, r) => s + r.receita, 0),
    ativas: rows.reduce((s, r) => s + r.ativas, 0),
  }), [rows]);

  const maxReceita = Math.max(1, ...rows.map(r => r.receita));

  if (loading) return <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Benchmark por Produto</h2>
        <p className="text-sm text-muted-foreground">Compare desempenho comercial entre Feed_BPF, NutriCRM, AgroGestão, Audits_BPF, Custom, Rótulos</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{totais.leads}</div><div className="text-xs text-muted-foreground">Leads totais</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{fmtBRL(totais.receita)}</div><div className="text-xs text-muted-foreground">Receita acumulada</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{totais.ativas}</div><div className="text-xs text-muted-foreground">Licenças ativas</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Comparativo</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground text-xs">
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">Leads</th>
                <th className="py-2 pr-3">Deals</th>
                <th className="py-2 pr-3">Ganhos</th>
                <th className="py-2 pr-3">Perdidos</th>
                <th className="py-2 pr-3">Win rate</th>
                <th className="py-2 pr-3">Conv. lead→cliente</th>
                <th className="py-2 pr-3">Ticket médio</th>
                <th className="py-2 pr-3">Pipe aberto</th>
                <th className="py-2 pr-3">Receita</th>
                <th className="py-2 pr-3">Licenças ativas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.prod} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-3"><Badge variant="outline">{r.prod}</Badge></td>
                  <td className="py-2 pr-3">{r.leads}</td>
                  <td className="py-2 pr-3">{r.pipe}</td>
                  <td className="py-2 pr-3 text-emerald-600 font-medium">{r.ganhos}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.perdidos}</td>
                  <td className="py-2 pr-3">{r.winRate.toFixed(0)}%</td>
                  <td className="py-2 pr-3">{r.conversao.toFixed(1)}%</td>
                  <td className="py-2 pr-3">{fmtBRL(r.ticket)}</td>
                  <td className="py-2 pr-3">{fmtBRL(r.pipeAberto)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-muted rounded-full flex-1 min-w-[60px] overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(r.receita / maxReceita) * 100}%` }} />
                      </div>
                      <span className="font-medium whitespace-nowrap">{fmtBRL(r.receita)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3">{r.ativas}/{r.licencas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Destaques</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(() => {
            const withLeads = rows.filter(r => r.leads > 0 || r.ganhos > 0);
            if (!withLeads.length) return <div className="text-muted-foreground">Sem dados ainda.</div>;
            const topReceita = [...withLeads].sort((a, b) => b.receita - a.receita)[0];
            const topWin = [...withLeads].filter(r => r.ganhos + r.perdidos > 0).sort((a, b) => b.winRate - a.winRate)[0];
            const topConv = [...withLeads].filter(r => r.leads > 0).sort((a, b) => b.conversao - a.conversao)[0];
            const menorPipe = [...withLeads].filter(r => r.leads > 3).sort((a, b) => a.pipeAberto - b.pipeAberto)[0];
            return (
              <>
                {topReceita && <div>🏆 <b>{topReceita.prod}</b> lidera em receita: {fmtBRL(topReceita.receita)}</div>}
                {topWin && <div>🎯 Maior win rate: <b>{topWin.prod}</b> ({topWin.winRate.toFixed(0)}%)</div>}
                {topConv && <div>🔥 Melhor conversão lead→cliente: <b>{topConv.prod}</b> ({topConv.conversao.toFixed(1)}%)</div>}
                {menorPipe && menorPipe.pipeAberto < 1000 && <div>⚠️ <b>{menorPipe.prod}</b> tem pipeline aberto baixo ({fmtBRL(menorPipe.pipeAberto)}) — considere reforçar geração de demanda.</div>}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
