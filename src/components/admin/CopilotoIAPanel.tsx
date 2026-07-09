import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Bot, Flame, MessageSquare, Mail, RefreshCw, Copy, TrendingUp, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const tempColors: Record<string, string> = {
  frio: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  morno: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  quente: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  muito_quente: "bg-red-500/10 text-red-700 border-red-500/30",
};

export default function CopilotoIAPanel() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const qc = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["copilot-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_pipeline")
        .select("id, lead_id, nome, email, telefone, produto_interesse, etapa, valor_estimado, created_at")
        .in("etapa", ["novo", "qualificado", "proposta", "negociacao"])
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const { data: insight, isLoading: loadingInsight, refetch } = useQuery({
    queryKey: ["insight", selectedLead?.lead_id],
    enabled: !!selectedLead?.lead_id,
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("ai-copilot-lead", {
        body: { lead_id: selectedLead.lead_id, lead_origem: "produto" },
      });
      return data?.insight;
    },
  });

  const refreshMut = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.functions.invoke("ai-copilot-lead", {
        body: { lead_id: selectedLead.lead_id, lead_origem: "produto", force_refresh: true },
      });
      return data?.insight;
    },
    onSuccess: () => {
      toast.success("Análise IA atualizada");
      qc.invalidateQueries({ queryKey: ["insight", selectedLead?.lead_id] });
    },
    onError: (e: any) => toast.error("Falha: " + e.message),
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Leads */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-orange-500" />
            Leads em Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : leads?.length ? (
            leads.map((l: any) => (
              <button
                key={l.id}
                onClick={() => setSelectedLead(l)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                  selectedLead?.id === l.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">{l.nome}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{l.etapa}</Badge>
                  {l.produto_interesse && (
                    <Badge variant="secondary" className="text-xs">{l.produto_interesse}</Badge>
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead ativo</p>
          )}
        </CardContent>
      </Card>

      {/* Análise IA */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            Copiloto IA {selectedLead && `— ${selectedLead.nome}`}
          </CardTitle>
          {selectedLead && (
            <Button size="sm" variant="outline" onClick={() => refreshMut.mutate()} disabled={refreshMut.isPending}>
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshMut.isPending ? "animate-spin" : ""}`} />
              Reanalisar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!selectedLead ? (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecione um lead para gerar análise IA</p>
            </div>
          ) : loadingInsight ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : insight ? (
            <div className="space-y-4">
              {/* Header stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Temperatura</p>
                  <Badge className={tempColors[insight.temperatura] || tempColors.morno}>
                    {insight.temperatura?.replace("_", " ")}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Score</p>
                  <p className="text-2xl font-bold text-primary">{insight.score}/100</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Sinais de Compra</p>
                  <p className="text-2xl font-bold">{insight.sinais_compra?.length || 0}</p>
                </div>
              </div>

              {/* Resumo & ação */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">Resumo</p>
                <p className="text-sm mb-3">{insight.resumo}</p>
                <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Próxima Ação Sugerida
                </p>
                <p className="text-sm font-medium">{insight.proxima_acao}</p>
              </div>

              {/* Sinais */}
              {insight.sinais_compra?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2">Sinais de Compra Detectados:</p>
                  <div className="flex flex-wrap gap-1">
                    {insight.sinais_compra.map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">✓ {s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Rascunhos */}
              <Tabs defaultValue="whatsapp">
                <TabsList>
                  <TabsTrigger value="whatsapp"><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</TabsTrigger>
                  <TabsTrigger value="email"><Mail className="h-3 w-3 mr-1" />Email</TabsTrigger>
                </TabsList>
                <TabsContent value="whatsapp" className="space-y-2">
                  <Textarea value={insight.rascunho_whatsapp || ""} readOnly rows={5} />
                  <Button size="sm" variant="outline" onClick={() => copy(insight.rascunho_whatsapp || "")}>
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                </TabsContent>
                <TabsContent value="email" className="space-y-2">
                  <Textarea value={insight.rascunho_email || ""} readOnly rows={8} />
                  <Button size="sm" variant="outline" onClick={() => copy(insight.rascunho_email || "")}>
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <Button onClick={() => refetch()}>
                <Sparkles className="h-4 w-4 mr-2" /> Gerar Análise IA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
