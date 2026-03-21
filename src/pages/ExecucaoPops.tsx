import { useState } from "react";
import { PlayCircle, Plus, CheckCircle2, Clock, XCircle, AlertTriangle, Link2 } from "lucide-react";
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
import type { ExecucaoPOP } from "@/types/feedbpf";

const POPS_DISPONIVEIS = [
  { codigo: "POP-001", nome: "Limpeza da área de produção" },
  { codigo: "POP-002", nome: "Controle de pragas" },
  { codigo: "POP-003", nome: "Recebimento de matérias-primas" },
  { codigo: "POP-004", nome: "Operação do misturador" },
  { codigo: "POP-005", nome: "Controle de flushing" },
  { codigo: "POP-006", nome: "Rastreabilidade de lotes" },
  { codigo: "POP-007", nome: "Coleta de amostras" },
];

const DEMO_EXECUCOES: ExecucaoPOP[] = [
  { id: "1", codigoPop: "POP-001", nomePop: "Limpeza da área de produção", dataExecucao: "2026-03-21", executor: "João Silva", setor: "Moagem", status: "concluido", observacoes: "Limpeza completa realizada", checklistRef: "2. Higiene – BPF e PPHO" },
  { id: "2", codigoPop: "POP-003", nomePop: "Recebimento de matérias-primas", dataExecucao: "2026-03-21", executor: "Maria Santos", setor: "Recebimento", status: "concluido", observacoes: "Milho recebido - OK", checklistRef: "6. Recebimento e Armazenamento" },
  { id: "3", codigoPop: "POP-002", nomePop: "Controle de pragas", dataExecucao: "2026-03-20", executor: "Pedro Oliveira", setor: "Área externa", status: "nao_conforme", observacoes: "Armadilha 5 danificada - NC aberta", checklistRef: "8. Controle de Pragas" },
  { id: "4", codigoPop: "POP-005", nomePop: "Controle de flushing", dataExecucao: "2026-03-21", executor: "Carlos Ferreira", setor: "Mistura", status: "em_execucao", observacoes: "Flushing após ração medicamentosa", checklistRef: "5. Contaminação Cruzada" },
];

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", className: "bg-muted text-muted-foreground", icon: Clock },
  em_execucao: { label: "Em execução", className: "bg-info/20 text-info", icon: PlayCircle },
  concluido: { label: "Concluído", className: "bg-primary/20 text-primary", icon: CheckCircle2 },
  nao_conforme: { label: "Não conforme", className: "bg-destructive/20 text-destructive", icon: AlertTriangle },
};

export default function ExecucaoPops() {
  const [execucoes, setExecucoes] = useState<ExecucaoPOP[]>(DEMO_EXECUCOES);
  const [open, setOpen] = useState(false);
  const [popSelecionado, setPopSelecionado] = useState("");
  const [executor, setExecutor] = useState("");
  const [setor, setSetor] = useState("");
  const [obs, setObs] = useState("");

  const handleAdd = () => {
    const pop = POPS_DISPONIVEIS.find(p => p.codigo === popSelecionado);
    if (!pop || !executor) return;
    setExecucoes(prev => [...prev, {
      id: String(Date.now()),
      codigoPop: pop.codigo,
      nomePop: pop.nome,
      dataExecucao: new Date().toISOString().split("T")[0],
      executor,
      setor,
      status: "pendente",
      observacoes: obs,
    }]);
    setOpen(false);
    setPopSelecionado("");
    setExecutor("");
    setSetor("");
    setObs("");
  };

  const concluidos = execucoes.filter(e => e.status === "concluido").length;
  const naoConformes = execucoes.filter(e => e.status === "nao_conforme").length;

  return (
    <>
      <PageHeader icon={PlayCircle} title="Execução de ITs e POPs" description="Registro de execução de procedimentos vinculados à auditoria BPF" />

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
          <p className="text-2xl font-bold font-display text-muted-foreground">{execucoes.filter(e => e.status === "pendente" || e.status === "em_execucao").length}</p>
          <p className="text-xs text-muted-foreground">Em andamento</p>
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
                  <Label>POP / IT</Label>
                  <Select value={popSelecionado} onValueChange={setPopSelecionado}>
                    <SelectTrigger><SelectValue placeholder="Selecione o POP" /></SelectTrigger>
                    <SelectContent>
                      {POPS_DISPONIVEIS.map(p => (
                        <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} – {p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label>Observações</Label>
                  <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Observações da execução..." />
                </div>
                <Button onClick={handleAdd} className="w-full">Registrar Execução</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>POP/IT</TableHead>
                <TableHead>Executor</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Vínculo Auditoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {execucoes.map((e) => {
                const cfg = statusConfig[e.status];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{e.dataExecucao}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{e.codigoPop}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{e.nomePop}</span>
                    </TableCell>
                    <TableCell>{e.executor}</TableCell>
                    <TableCell>{e.setor}</TableCell>
                    <TableCell>
                      {e.checklistRef && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <Link2 className="w-3 h-3" />
                          {e.checklistRef}
                        </span>
                      )}
                    </TableCell>
                    <TableCell><Badge className={cfg.className}>{cfg.label}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">{e.observacoes}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
