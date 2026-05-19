import { useState, useEffect, useMemo } from "react";
import { PlayCircle, Plus, CheckCircle2, Clock, AlertTriangle, ExternalLink, Loader2, Filter, CalendarIcon, Bell } from "lucide-react";
import { format, parseISO, isAfter, isBefore, differenceInDays } from "date-fns";
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
import { useEmpresa } from "@/hooks/useEmpresa";
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

const POP02_TRIAGEM_ITENS = ["Colaborador sem sintomas", "Uniforme limpo", "Uso de EPIs", "Mãos higienizadas", "Ausência de adornos", "Unhas curtas", "Barba aparada", "Ausência de ferimentos", "Sem perfume", "ASO válido", "Exames em dia", "Capacitação válida"];
const POP03_LIMPEZA_ITENS = ["Pisos limpos", "Paredes limpas", "Equipamentos limpos", "Misturador sem resíduos", "Esteiras limpas", "Utensílios lavados", "Ralos limpos", "Lixeiras identificadas", "Luminárias protegidas", "Registro de produtos", "FISPQ disponível", "Concentração verificada", "Tempo respeitado", "Cronograma afixado", "Silos inspecionados"];
const POP04_AGUA_ITENS = ["Cloro residual (0,2-2,0mg/L)", "pH (6,0-9,5)", "Turbidez (≤ 5 NTU)", "Ausência de odor", "Reservatório com tampa", "Laudo laboratorial mensal", "Certificado de limpeza", "Ponto de coleta identificado", "Laudo microbiológico", "Registro de tratamento"];
const POP05_HIGIENE_PESSOAL_ITENS = ["Colaborador sem sintomas", "ASO válido", "Exame admissional/periódico em dia", "Exame retorno realizado", "Uniforme limpo", "Uso de EPIs", "Ausência de adornos", "Unhas curtas/sem esmalte", "Barba aparada", "Ausência de ferimentos", "Sem perfume/maquiagem", "Mãos lavadas", "BPF orientado", "Capacitação válida", "Triagem diária preenchida", "Apto médico"];
const POP09_VEICULO_ITENS = ["Carroceria limpa", "Ausência de odor", "Lona em bom estado", "Ausência de pragas", "Sem carga proibida", "Lacre íntegro", "DANFE completa", "Temperatura adequada"];

const POPS_PERIODICIDADE: Record<string, number> = {
  "POP-01": 30, "POP-02": 7, "POP-03": 30, "POP-04": 30, "POP-05": 7, "POP-06": 7, "POP-07": 30, "POP-08": 90, "POP-09": 30, "POP-10": 30,
};

export default function ExecucaoPops() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [execucoes, setExecucoes] = useState<ExecRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [filtroPop, setFiltroPop] = useState("todos");

  const [docSelecionado, setDocSelecionado] = useState("");
  const [executor, setExecutor] = useState("");
  const [setor, setSetor] = useState("");
  const [statusExec, setStatusExec] = useState("concluido");
  const [obs, setObs] = useState("");
  const [checklistTriagem, setChecklistTriagem] = useState<Record<number, boolean | null>>({});

  const fetchData = async () => {
    if (!user) return;
    const [execRes, docsRes, arqRes] = await Promise.all([
      (() => { let q = supabase.from("execucao_pops").select("*").order("data_execucao", { ascending: false }); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
      (() => { let q = supabase.from("documentos").select("*").order("codigo"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
      (() => { let q = supabase.from("arquivos_bpf").select("id, arquivo_url, arquivo_nome, documento_ref_id"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
    ]);
    if (execRes.data) setExecucoes(execRes.data as unknown as ExecRow[]);
    if (docsRes.data) setDocs(docsRes.data);
    if (arqRes.data) setArquivos(arqRes.data as unknown as ArquivoRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const selectedDoc = docs.find(d => d.id === docSelecionado);

  const isPOP02 = selectedDoc?.codigo?.includes("POP-02");
  const isPOP03 = selectedDoc?.codigo?.includes("POP-03");
  const isPOP04 = selectedDoc?.codigo?.includes("POP-04");
  const isPOP05 = selectedDoc?.codigo?.includes("POP-05");
  const isPOP09 = selectedDoc?.codigo?.includes("POP-09");
  const activeChecklist = isPOP02 ? POP02_TRIAGEM_ITENS : isPOP03 ? POP03_LIMPEZA_ITENS : isPOP04 ? POP04_AGUA_ITENS : isPOP05 ? POP05_HIGIENE_PESSOAL_ITENS : isPOP09 ? POP09_VEICULO_ITENS : null;

  const handleAdd = async () => {
    if (!selectedDoc || !executor || !user) return;
    setSaving(true);
    let obsCompleta = obs;
    if (activeChecklist) {
      const checkItems = activeChecklist.map((item, i) => `${checklistTriagem[i] === true ? "✅" : checklistTriagem[i] === false ? "❌" : "⬜"} ${item}`).join("\n");
      obsCompleta = `${obsCompleta}\n\nChecklist:\n${checkItems}`;
    }
    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      codigo_pop: selectedDoc.codigo,
      nome_pop: selectedDoc.nome,
      executor,
      setor,
      status: statusExec,
      observacoes: obsCompleta,
      documento_id: selectedDoc.id,
    });
    if (error) toast.error("Erro ao salvar execução");
    else {
      toast.success("Execução registrada!");
      setOpen(false);
      setDocSelecionado(""); setExecutor(""); setSetor(""); setObs(""); setStatusExec("concluido");
      setChecklistTriagem({});
      fetchData();
    }
    setSaving(false);
  };

  const filteredExecucoes = useMemo(() => {
    return execucoes.filter(e => {
      if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
      if (filtroPop !== "todos" && e.codigo_pop !== filtroPop) return false;
      if (dataInicio && isBefore(parseISO(e.data_execucao), dataInicio)) return false;
      if (dataFim) {
        const endOfDay = new Date(dataFim);
        endOfDay.setHours(23, 59, 59);
        if (isAfter(parseISO(e.data_execucao), endOfDay)) return false;
      }
      return true;
    });
  }, [execucoes, filtroStatus, dataInicio, dataFim, filtroPop]);

  const uniquePops = [...new Set(execucoes.map(e => e.codigo_pop))];

  return (
    <>
      <PageHeader icon={PlayCircle} title="Execução de ITs e POPs" description="Diário de bordo" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Registros</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Registrar</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nova Execução</DialogTitle></DialogHeader>
                <Select value={docSelecionado} onValueChange={setDocSelecionado}>
                  <SelectTrigger><SelectValue placeholder="Selecione o documento" /></SelectTrigger>
                  <SelectContent>
                    {docs.map(d => <SelectItem key={d.id} value={d.id}>{d.codigo} — {d.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {activeChecklist && (
                  <div className="space-y-1">
                    {activeChecklist.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center text-xs">
                        <Button variant="outline" size="sm" onClick={() => setChecklistTriagem(p => ({...p, [idx]: !p[idx]}))}>
                          {checklistTriagem[idx] ? "✅" : "⬜"}
                        </Button>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                <Input value={executor} onChange={e => setExecutor(e.target.value)} placeholder="Executor" />
                <Button onClick={handleAdd} disabled={saving}>Salvar</Button>
              </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>POP</TableHead>
                        <TableHead>Executor</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredExecucoes.map(e => (
                        <TableRow key={e.id}>
                            <TableCell>{e.data_execucao}</TableCell>
                            <TableCell>{e.codigo_pop}</TableCell>
                            <TableCell>{e.executor}</TableCell>
                            <TableCell>{e.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
