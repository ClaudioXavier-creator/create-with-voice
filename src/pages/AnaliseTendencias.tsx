import { useState } from "react";
import { Brain, AlertTriangle, Shield, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface Analise {
  resumo_geral: string;
  padroes_recorrentes: { padrao: string; frequencia: string; gravidade: string; setores_afetados: string }[];
  acoes_preventivas: { acao: string; prioridade: string; prazo_sugerido: string; pop_relacionado?: string }[];
  indicadores_risco: { indicador: string; status: string; recomendacao: string }[];
}

const gravidadeColors: Record<string, string> = {
  alta: "bg-destructive text-destructive-foreground",
  media: "bg-yellow-500 text-white",
  baixa: "bg-primary text-primary-foreground",
};
const prioridadeColors: Record<string, string> = {
  critica: "bg-destructive text-destructive-foreground",
  alta: "bg-orange-500 text-white",
  media: "bg-yellow-500 text-white",
};
const statusColors: Record<string, string> = {
  critico: "bg-destructive text-destructive-foreground",
  atencao: "bg-yellow-500 text-white",
  ok: "bg-primary text-primary-foreground",
};

export default function AnaliseTendencias() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [loading, setLoading] = useState(false);

  const executarAnalise = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let qNC = supabase.from("nao_conformidades").select("*").eq("user_id", user.id);
      let qRec = supabase.from("reclamacoes_qualidade").select("*").eq("user_id", user.id);
      if (empresaAtiva) {
        qNC = qNC.eq("empresa_id", empresaAtiva.id);
        qRec = qRec.eq("empresa_id", empresaAtiva.id);
      }
      const [{ data: ncs }, { data: reclamacoes }] = await Promise.all([qNC, qRec]);

      if ((!ncs || ncs.length === 0) && (!reclamacoes || reclamacoes.length === 0)) {
        toast.warning("Nenhum dado encontrado para análise. Cadastre NCs ou reclamações primeiro.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("analise-tendencias", {
        body: { ncs, reclamacoes },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalise(data);
      toast.success("Análise concluída!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao executar análise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análise de Tendências com IA"
        description="Identificação de padrões recorrentes de NCs e sugestões preventivas baseadas em IA"
        icon={Brain}
      />

      <Card>
        <CardContent className="pt-6 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground mb-4">
            A IA analisa suas não conformidades e reclamações para identificar padrões, tendências e sugerir ações preventivas.
          </p>
          <Button onClick={executarAnalise} disabled={loading} size="lg">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {loading ? "Analisando dados..." : "Executar Análise"}
          </Button>
        </CardContent>
      </Card>

      {analise && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Resumo Geral</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-sm">{analise.resumo_geral}</p></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Padrões Recorrentes</CardTitle></CardHeader>
            <CardContent>
              {analise.padroes_recorrentes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum padrão identificado.</p>
              ) : (
                <div className="space-y-3">
                  {analise.padroes_recorrentes.map((p, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{p.padrao}</h4>
                        <Badge className={gravidadeColors[p.gravidade] || ""}>{p.gravidade}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Frequência: {p.frequencia} · Setores: {p.setores_afetados}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Ações Preventivas Sugeridas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analise.acoes_preventivas.map((a, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{a.acao}</h4>
                      <Badge className={prioridadeColors[a.prioridade] || ""}>{a.prioridade}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Prazo: {a.prazo_sugerido}
                      {a.pop_relacionado && ` · POP: ${a.pop_relacionado}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Indicadores de Risco</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {analise.indicadores_risco.map((ind, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{ind.indicador}</span>
                      <Badge className={statusColors[ind.status] || ""}>{ind.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ind.recomendacao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
