import { useState, useEffect, useMemo } from "react";
import { PlayCircle, Plus, CheckCircle2, Clock, AlertTriangle, Link2, Loader2, ExternalLink, Filter, CalendarIcon, Bell } from "lucide-react";
import { format, subDays, isAfter, isBefore, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DocRow {
  id: string;
  codigo: string;
  nome: string;
  versao: string | null;
  status: string | null;
}

interface ExecRow {
  id: string;
  codigo_pop: string;
  nome_pop: string;
  data_execucao: string;
  executor: string;
  setor: string | null;
  status: string | null;
  observacoes: string | null;
  checklist_auditoria_ref: string | null;
  documento_id: string | null;
}

interface ArquivoRow {
  id: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  documento_ref_id: string | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", className: "bg-muted text-muted-foreground", icon: Clock },
  em_execucao: { label: "Em execução", className: "bg-info/20 text-info", icon: PlayCircle },
  concluido: { label: "Concluído", className: "bg-primary/20 text-primary", icon: CheckCircle2 },
  nao_conforme: { label: "Não conforme", className: "bg-destructive/20 text-destructive", icon: AlertTriangle },
};

// POPs obrigatórios com periodicidade em dias
const POPS_PERIODICIDADE: Record<string, number> = {
  "POP-001": 30,
  "POP-002": 7,
  "POP-003": 30,
  "POP-004": 30,
  "POP-005": 7,
  "POP-006": 7,
  "POP-007": 30,
  "POP-008": 90,
  "POP-009": 30,
};

interface Alerta {
  codigo: string;
  nome: string;
  ultimaExecucao: string | null;
  diasAtraso: number;
  periodicidade: number;
}

export default function ExecucaoPops() {
  const { user } = useAuth();
  const [execucoes, setExecucoes] = useState<ExecRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  // Filters
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [filtroPop, setFiltroPop] = useState("todos");

  // Form
  const [docSelecionado, setDocSelecionado] = useState("");
  const [executor, setExecutor] = useState("");
  const [setor, setSetor] = useState("");
  const [statusExec, setStatusExec] = useState("concluido");
  const [obs, setObs] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [execRes, docsRes, arqRes] = await Promise.all([
      supabase.from("execucao_pops").select("*").order("data_execucao", { ascending: false }),
      supabase.from("documentos").select("*").order("codigo"),
      supabase.from("arquivos_bpf").select("id, arquivo_url, arquivo_nome, documento_ref_id"),
    ]);
    if (execRes.data) setExecucoes(execRes.data as unknown as ExecRow[]);
    if (docsRes.data) setDocs(docsRes.data);
    if (arqRes.data) setArquivos(arqRes.data as unknown as ArquivoRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const selectedDoc = docs.find(d => d.id === docSelecionado);

  const handleAdd = async () => {
    if (!selectedDoc || !executor || !user) return;
    setSaving(true);
    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id,
      codigo_pop: selectedDoc.codigo,
      nome_pop: selectedDoc.nome,
      executor,
      setor,
      status: statusExec,
      observacoes: obs,
      documento_id: selectedDoc.id,
    });
    if (error) toast.error("Erro ao salvar execução");
    else {
      toast.success("Execução registrada!");
      setOpen(false);
      setDocSelecionado(""); setExecutor(""); setSetor(""); setObs(""); setStatusExec("concluido");
      fetchData();
    }
    setSaving(false);
  };

  const getArquivoForDoc = (docId: string | null) => {
    if (!docId) return null;
    return arquivos.find(a => a.documento_ref_id === docId);
  };

  const getDocForExec = (docId: string | null) => {
    if (!docId) return null;
    return docs.find(d => d.id === docId);
  };

  // Filtered executions
  const filteredExecucoes = useMemo(() => {
    return execucoes.filter(e => {
      if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
      if (filtroPop !== "todos" && e.codigo_pop !== filtroPop) return false;
      if (dataInicio) {
        const execDate = parseISO(e.data_execucao);
        if (isBefore(execDate, dataInicio)) return false;
      }
      if (dataFim) {
        const execDate = parseISO(e.data_execucao);
        const endOfDay = new Date(dataFim);
        endOfDay.setHours(23, 59, 59);
        if (isAfter(execDate, endOfDay)) return false;
      }
      return true;
    });
  }, [execucoes, filtroStatus, dataInicio, dataFim, filtroPop]);

  // Alertas de não realização
  const alertas = useMemo<Alerta[]>(() => {
    const hoje = new Date();
    const result: Alerta[] = [];

    // Check each registered POP that has periodicity
    const popsRegistrados = docs.filter(d => POPS_PERIODICIDADE[d.codigo]);

    for (const doc of popsRegistrados) {
      const periodicidade = POPS_PERIODICIDADE[doc.codigo];
      const execsDoDoc = execucoes
        .filter(e => e.codigo_pop === doc.codigo && (e.status === "concluido" || e.status === "em_execucao"))
        .sort((a, b) => b.data_execucao.localeCompare(a.data_execucao));

      const ultimaExec = execsDoDoc[0];
      const ultimaData = ultimaExec ? parseISO(ultimaExec.data_execucao) : null;

      if (!ultimaData) {
        // Nunca executado
        result.push({
          codigo: doc.codigo,
          nome: doc.nome,
          ultimaExecucao: null,
          diasAtraso: periodicidade,
          periodicidade,
        });
      } else {
        const diasDesdeUltima = differenceInDays(hoje, ultimaData);
        if (diasDesdeUltima >= periodicidade) {
          result.push({
            codigo: doc.codigo,
            nome: doc.nome,
            ultimaExecucao: ultimaExec.data_execucao,
            diasAtraso: diasDesdeUltima - periodicidade,
            periodicidade,
          });
        }
      }
    }

    return result.sort((a, b) => b.diasAtraso - a.diasAtraso);
  }, [docs, execucoes]);

  const concluidos = execucoes.filter(e => e.status === "concluido").length;
  const naoConformes = execucoes.filter(e => e.status === "nao_conforme").length;
  const uniquePops = [...new Set(execucoes.map(e => e.codigo_pop))];

  const clearFilters = () => {
    setFiltroStatus("todos");
    setDataInicio(undefined);
    setDataFim(undefined);
    setFiltroPop("todos");
  };

  const hasFilters = filtroStatus !== "todos" || dataInicio || dataFim || filtroPop !== "todos";

  return (
    <>
      <PageHeader icon={PlayCircle} title="Execução de ITs e POPs" description="Registro de execução vinculado aos documentos cadastrados" />

      {/* Alertas de não realização */}
      {alertas.length > 0 && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2 text-destructive">
              <Bell className="w-4 h-4" />
              Alertas — POPs com execução atrasada ({alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map(a => (
                <div key={a.codigo} className="flex items-center justify-between p-2 rounded-lg bg-background border border-destructive/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="font-mono">{a.codigo}</span> — {a.nome.length > 50 ? a.nome.slice(0, 50) + "…" : a.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Periodicidade: {a.periodicidade} dias •
                        {a.ultimaExecucao
                          ? ` Última execução: ${a.ultimaExecucao}`
                          : " Nunca executado"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-destructive/20 text-destructive shrink-0 ml-2">
                    {a.diasAtraso > 0 ? `${a.diasAtraso}d atraso` : "Vencido hoje"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{execucoes.length}</p>
          <p className="text-xs text-muted-foreground">Total execuções</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{concluidos}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{naoConformes}</p>
          <p className="text-xs text-muted-foreground">Não conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{alertas.length}</p>
          <p className="text-xs text-muted-foreground">Alertas ativos</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Execuções Registradas</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Execução</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Execução de POP/IT</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>POP / IT (documento cadastrado)</Label>
                  <Select value={docSelecionado} onValueChange={setDocSelecionado}>
                    <SelectTrigger><SelectValue placeholder="Selecione o documento" /></SelectTrigger>
                    <SelectContent>
                      {docs.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.codigo} — {d.nome.length > 45 ? d.nome.slice(0, 45) + "…" : d.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {docs.length === 0 && (
                    <p className="text-xs text-destructive mt-1">Nenhum documento cadastrado. Registre POPs no módulo Documentos primeiro.</p>
                  )}
                </div>

                {selectedDoc && (
                  <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                    <p><strong>Documento vinculado:</strong> {selectedDoc.codigo} — {selectedDoc.nome}</p>
                    <p>Versão: {selectedDoc.versao} | Status: {selectedDoc.status}</p>
                    {(() => {
                      const arq = getArquivoForDoc(selectedDoc.id);
                      return arq?.arquivo_url ? (
                        <a href={arq.arquivo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Ver arquivo: {arq.arquivo_nome}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">Nenhum arquivo vinculado a este documento</p>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Executor</Label>
                    <Input value={executor} onChange={e => setExecutor(e.target.value)} placeholder="Nome do executor" />
                  </div>
                  <div>
                    <Label>Setor</Label>
                    <Input value={setor} onChange={e => setSetor(e.target.value)} placeholder="Setor" />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusExec} onValueChange={setStatusExec}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_execucao">Em execução</SelectItem>
                      <SelectItem value="nao_conforme">Não conforme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Observações da execução..." />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={saving || !docSelecionado || !executor}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Registrar Execução
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* Filtros */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Filter className="w-3 h-3" /> Filtros:
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_execucao">Em execução</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="nao_conforme">Não conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs">POP/IT</Label>
              <Select value={filtroPop} onValueChange={setFiltroPop}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {uniquePops.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 text-xs w-[130px] justify-start", !dataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">Data fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 text-xs w-[130px] justify-start", !dataFim && "text-muted-foreground")}>
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-destructive">
                Limpar filtros
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredExecucoes.length} de {execucoes.length} registros
            </span>
          </div>
        </div>

        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredExecucoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {execucoes.length === 0 ? "Nenhuma execução registrada" : "Nenhum registro encontrado com os filtros aplicados"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>POP/IT</TableHead>
                  <TableHead>Executor</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecucoes.map((e) => {
                  const cfg = statusConfig[e.status || "concluido"];
                  const doc = getDocForExec(e.documento_id);
                  const arq = getArquivoForDoc(e.documento_id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{e.data_execucao}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{e.codigo_pop}</span>
                        <br />
                        <span className="text-xs text-muted-foreground">{e.nome_pop}</span>
                      </TableCell>
                      <TableCell>{e.executor}</TableCell>
                      <TableCell>{e.setor}</TableCell>
                      <TableCell>
                        {doc ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                              <Link2 className="w-3 h-3" /> v{doc.versao}
                            </span>
                            {arq?.arquivo_url && (
                              <a href={arq.arquivo_url} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline truncate max-w-[120px]">
                                <ExternalLink className="w-3 h-3 inline mr-1" />{arq.arquivo_nome}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><Badge className={cfg.className}>{cfg.label}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{e.observacoes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
