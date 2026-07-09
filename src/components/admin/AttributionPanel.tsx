import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, DollarSign, Target, Award } from "lucide-react";

export default function AttributionPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["attribution-data"],
    queryFn: async () => {
      const [utmRes, pipelineRes, leadsRes] = await Promise.all([
        supabase.from("lead_utm").select("*"),
        supabase.from("crm_pipeline").select("lead_id, etapa, valor_estimado, produto_interesse"),
        supabase.from("leads").select("id, produto_interesse, created_at"),
      ]);
      return {
        utm: utmRes.data || [],
        pipeline: pipelineRes.data || [],
        leads: leadsRes.data || [],
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const byChannel: Record<string, { leads: number; ganhos: number; receita: number }> = {};
    const byCampaign: Record<string, { leads: number; ganhos: number; receita: number }> = {};

    const pipelineByLead = new Map(data.pipeline.map((p) => [p.lead_id, p]));

    data.utm.forEach((u: any) => {
      const source = u.utm_source || "direto";
      const campaign = u.utm_campaign || "(nenhuma)";
      const p = pipelineByLead.get(u.lead_id);
      const isGanho = p?.etapa === "ganho";
      const valor = Number(p?.valor_estimado) || 0;

      if (!byChannel[source]) byChannel[source] = { leads: 0, ganhos: 0, receita: 0 };
      byChannel[source].leads++;
      if (isGanho) {
        byChannel[source].ganhos++;
        byChannel[source].receita += valor;
      }

      if (!byCampaign[campaign]) byCampaign[campaign] = { leads: 0, ganhos: 0, receita: 0 };
      byCampaign[campaign].leads++;
      if (isGanho) {
        byCampaign[campaign].ganhos++;
        byCampaign[campaign].receita += valor;
      }
    });

    const totalLeads = data.utm.length;
    const totalReceita = Object.values(byChannel).reduce((a, b) => a + b.receita, 0);
    const totalGanhos = Object.values(byChannel).reduce((a, b) => a + b.ganhos, 0);

    return {
      byChannel: Object.entries(byChannel)
        .map(([k, v]) => ({ nome: k, ...v, conversao: v.leads > 0 ? (v.ganhos / v.leads) * 100 : 0 }))
        .sort((a, b) => b.receita - a.receita),
      byCampaign: Object.entries(byCampaign)
        .map(([k, v]) => ({ nome: k, ...v, conversao: v.leads > 0 ? (v.ganhos / v.leads) * 100 : 0 }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10),
      totalLeads,
      totalReceita,
      totalGanhos,
      leadsSemUtm: data.leads.length - totalLeads,
    };
  }, [data]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="h-3 w-3" /> Leads Rastreados
            </div>
            <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats?.leadsSemUtm || 0} sem UTM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Award className="h-3 w-3" /> Vendas Fechadas
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats?.totalGanhos || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> Receita Atribuída
            </div>
            <p className="text-2xl font-bold">
              R$ {(stats?.totalReceita || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" /> Conversão Geral
            </div>
            <p className="text-2xl font-bold">
              {stats && stats.totalLeads > 0 ? ((stats.totalGanhos / stats.totalLeads) * 100).toFixed(1) : "0"}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Canais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Performance por Canal (UTM Source)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.byChannel.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Ganhos</TableHead>
                  <TableHead className="text-right">Conv %</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byChannel.map((c) => (
                  <TableRow key={c.nome}>
                    <TableCell><Badge variant="outline">{c.nome}</Badge></TableCell>
                    <TableCell className="text-right">{c.leads}</TableCell>
                    <TableCell className="text-right">{c.ganhos}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.conversao > 10 ? "default" : "secondary"}>
                        {c.conversao.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {c.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum dado de UTM ainda.</p>
              <p className="text-xs mt-2">
                Configure links de campanhas com <code className="text-primary">?utm_source=X&utm_campaign=Y</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            Top Campanhas por ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.byCampaign.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Ganhos</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byCampaign.map((c) => (
                  <TableRow key={c.nome}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-right">{c.leads}</TableCell>
                    <TableCell className="text-right">{c.ganhos}</TableCell>
                    <TableCell className="text-right">R$ {c.receita.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      R$ {c.ganhos > 0 ? (c.receita / c.ganhos).toLocaleString("pt-BR") : "0"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma campanha rastreada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
