import { useState, useEffect } from "react";
import { PlayCircle, Plus, CheckCircle2, Clock, AlertTriangle, Link2, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

export default function ExecucaoPops() {
  const { user } = useAuth();
  const [execucoes, setExecucoes] = useState<ExecRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

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

  const concluidos = execucoes.filter(e => e.status === "concluido").length;
  const naoConformes = execucoes.filter(e => e.status === "nao_conforme").length;

  return (
    <>
      <PageHeader icon={PlayCircle} title="Execução de ITs e POPs" description="Registro de execução vinculado aos documentos cadastrados" />

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
          <p className="text-2xl font-bold font-display text-muted-foreground">{docs.length}</p>
          <p className="text-xs text-muted-foreground">POPs cadastrados</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : execucoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma execução registrada</p>
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
                {execucoes.map((e) => {
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
