import { useState, useEffect } from "react";
import { Scale, Sparkles, Loader2, RefreshCw, Bell, BookOpen, CheckCircle2, AlertTriangle, Info, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Alerta {
  titulo: string;
  resumo: string;
  fonte: string;
  tipo: string;
  relevancia: string;
  data_aproximada: string;
}

interface ResumoSistema {
  modulos_implementados: { modulo: string; descricao: string; status: string }[];
  resumo_executivo: string;
  recomendacoes: string[];
}

interface AlertaDB {
  id: string;
  titulo: string;
  resumo: string;
  fonte: string | null;
  tipo: string | null;
  relevancia: string | null;
  data_publicacao: string | null;
  lido: boolean | null;
  created_at: string;
}

const tipoConfig: Record<string, { label: string; icon: typeof Bell; className: string }> = {
  atualizacao: { label: "Atualização", icon: RefreshCw, className: "bg-blue-500/20 text-blue-700" },
  nova_norma: { label: "Nova Norma", icon: BookOpen, className: "bg-primary/20 text-primary" },
  revogacao: { label: "Revogação", icon: AlertTriangle, className: "bg-destructive/20 text-destructive" },
  alerta: { label: "Alerta", icon: Bell, className: "bg-yellow-500/20 text-yellow-700" },
};

const relevanciaConfig: Record<string, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-destructive/20 text-destructive" },
  media: { label: "Média", className: "bg-yellow-500/20 text-yellow-700" },
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

export default function Legislacao() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [alertas, setAlertas] = useState<AlertaDB[]>([]);
  const [alertasIA, setAlertasIA] = useState<Alerta[]>([]);
  const [resumoGeral, setResumoGeral] = useState("");
  const [resumoSistema, setResumoSistema] = useState<ResumoSistema | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaDB | Alerta | null>(null);
  const [fetchingDB, setFetchingDB] = useState(true);

  const fetchAlertas = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("legislacao_alertas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAlertas(data as unknown as AlertaDB[]);
    setFetchingDB(false);
  };

  useEffect(() => { fetchAlertas(); }, [user]);

  const buscarAtualizacoes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("legislacao-ai", {
        body: { action: "buscar_atualizacoes" },
      });

      if (error) {
        toast.error("Erro ao buscar atualizações: " + error.message);
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      const result = data?.data;
      if (result?.alertas) {
        setAlertasIA(result.alertas);
        setResumoGeral(result.resumo_geral || "");

        // Save alerts to DB
        const records = result.alertas.map((a: Alerta) => ({
          user_id: user.id,
          titulo: a.titulo,
          resumo: a.resumo,
          fonte: a.fonte || "",
          tipo: a.tipo || "atualizacao",
          relevancia: a.relevancia || "media",
          data_publicacao: a.data_aproximada || new Date().toISOString().split("T")[0],
        }));

        await supabase.from("legislacao_alertas").insert(records as any);
        fetchAlertas();
        toast.success(`${result.alertas.length} alertas encontrados e salvos!`);
      } else {
        toast.warning("Nenhum alerta retornado pela IA.");
      }
    } catch (err) {
      toast.error("Erro ao conectar com a IA");
      console.error(err);
    }
    setLoading(false);
  };

  const buscarResumoSistema = async () => {
    setLoadingResumo(true);
    try {
      const { data, error } = await supabase.functions.invoke("legislacao-ai", {
        body: { action: "resumo_sistema" },
      });

      if (error) {
        toast.error("Erro ao gerar resumo: " + error.message);
        setLoadingResumo(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setLoadingResumo(false);
        return;
      }

      const result = data?.data;
      if (result) {
        setResumoSistema(result as ResumoSistema);
        toast.success("Resumo do sistema gerado!");
      }
    } catch (err) {
      toast.error("Erro ao conectar com a IA");
      console.error(err);
    }
    setLoadingResumo(false);
  };

  const marcarLido = async (id: string) => {
    await supabase.from("legislacao_alertas").update({ lido: true } as any).eq("id", id);
    fetchAlertas();
  };

  const naoLidos = alertas.filter(a => !a.lido).length;

  return (
    <>
      <PageHeader
        icon={Scale}
        title="Legislação & IA"
        description="Atualizações legislativas com inteligência artificial e resumo do sistema"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{alertas.length}</p>
          <p className="text-xs text-muted-foreground">Total alertas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{naoLidos}</p>
          <p className="text-xs text-muted-foreground">Não lidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{alertas.filter(a => a.relevancia === "alta").length}</p>
          <p className="text-xs text-muted-foreground">Alta relevância</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-info">{resumoSistema ? resumoSistema.modulos_implementados.length : "—"}</p>
          <p className="text-xs text-muted-foreground">Módulos analisados</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="alertas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alertas">
            <Bell className="w-4 h-4 mr-1" />
            Alertas Legislativos
            {naoLidos > 0 && <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">{naoLidos}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="resumo">
            <Sparkles className="w-4 h-4 mr-1" />
            Resumo do Sistema
          </TabsTrigger>
        </TabsList>

        {/* Tab: Alertas */}
        <TabsContent value="alertas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Atualizações da Legislação
              </CardTitle>
              <Button onClick={buscarAtualizacoes} disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? "Consultando IA..." : "Buscar Atualizações com IA"}
              </Button>
            </CardHeader>
            <CardContent>
              {resumoGeral && (
                <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-primary mb-1">Panorama Regulatório</p>
                      <p className="text-sm text-muted-foreground">{resumoGeral}</p>
                    </div>
                  </div>
                </div>
              )}

              {fetchingDB ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : alertas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum alerta legislativo ainda.</p>
                  <p className="text-sm mt-1">Clique em "Buscar Atualizações com IA" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Relevância</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertas.map((alerta) => {
                      const tipo = tipoConfig[alerta.tipo || "atualizacao"] || tipoConfig.atualizacao;
                      const rel = relevanciaConfig[alerta.relevancia || "media"] || relevanciaConfig.media;
                      return (
                        <TableRow key={alerta.id} className={!alerta.lido ? "bg-primary/5" : ""}>
                          <TableCell>
                            {alerta.lido
                              ? <CheckCircle2 className="w-4 h-4 text-primary" />
                              : <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />}
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">{alerta.titulo}</TableCell>
                          <TableCell><Badge className={tipo.className}>{tipo.label}</Badge></TableCell>
                          <TableCell><Badge className={rel.className}>{rel.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{alerta.fonte}</TableCell>
                          <TableCell className="text-xs">{alerta.data_publicacao}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedAlerta(alerta); setDetailOpen(true); }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!alerta.lido && (
                                <Button variant="ghost" size="sm" onClick={() => marcarLido(alerta.id)}>
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Resumo do Sistema */}
        <TabsContent value="resumo">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Resumo do Sistema — Análise IA
              </CardTitle>
              <Button onClick={buscarResumoSistema} disabled={loadingResumo} className="bg-primary hover:bg-primary/90">
                {loadingResumo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loadingResumo ? "Analisando..." : "Gerar Resumo com IA"}
              </Button>
            </CardHeader>
            <CardContent>
              {!resumoSistema ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Clique em "Gerar Resumo com IA" para analisar o sistema.</p>
                  <p className="text-sm mt-1">A IA irá avaliar os módulos implementados e gerar recomendações.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resumo Executivo */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Resumo Executivo
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{resumoSistema.resumo_executivo}</p>
                  </div>

                  {/* Módulos */}
                  <div>
                    <h3 className="font-display font-semibold mb-3">Módulos Implementados</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {resumoSistema.modulos_implementados.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{m.modulo}</span>
                            <Badge className={m.status === "completo" ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-700"}>
                              {m.status === "completo" ? "Completo" : "Parcial"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{m.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recomendações */}
                  {resumoSistema.recomendacoes?.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Recomendações
                      </h3>
                      <ul className="space-y-2">
                        {resumoSistema.recomendacoes.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{(selectedAlerta as any)?.titulo}</DialogTitle>
          </DialogHeader>
          {selectedAlerta && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(selectedAlerta as any).tipo && (
                  <Badge className={tipoConfig[(selectedAlerta as any).tipo]?.className || ""}>
                    {tipoConfig[(selectedAlerta as any).tipo]?.label || (selectedAlerta as any).tipo}
                  </Badge>
                )}
                {(selectedAlerta as any).relevancia && (
                  <Badge className={relevanciaConfig[(selectedAlerta as any).relevancia]?.className || ""}>
                    {relevanciaConfig[(selectedAlerta as any).relevancia]?.label || (selectedAlerta as any).relevancia}
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed">{(selectedAlerta as any).resumo}</p>
              {(selectedAlerta as any).fonte && (
                <p className="text-xs text-muted-foreground">
                  <strong>Fonte:</strong> {(selectedAlerta as any).fonte}
                </p>
              )}
              {((selectedAlerta as any).data_publicacao || (selectedAlerta as any).data_aproximada) && (
                <p className="text-xs text-muted-foreground">
                  <strong>Data:</strong> {(selectedAlerta as any).data_publicacao || (selectedAlerta as any).data_aproximada}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
