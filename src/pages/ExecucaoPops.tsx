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

// Checklist items for POP-02 daily health screening
const POP02_TRIAGEM_ITENS = [
  "Colaborador sem sintomas (febre, diarreia, vômito, lesões de pele)",
  "Uniforme limpo e em bom estado",
  "Uso adequado de EPIs (luvas, touca, botas)",
  "Mãos lavadas e higienizadas",
  "Ausência de adornos (anéis, relógio, brincos, pulseiras)",
  "Unhas curtas, limpas e sem esmalte",
  "Barba aparada ou protegida (rede)",
  "Ausência de ferimentos expostos / curativos impermeáveis",
  "Sem uso de perfume ou maquiagem",
  "ASO (Atestado de Saúde Ocupacional) válido e dentro da validade",
  "Exames médicos periódicos em dia (admissional, periódico, retorno ao trabalho)",
  "Certificado de capacitação em manipulação de alimentos / BPF válido",
];

// Checklist items for POP-03 pre-operational cleaning (IN 04/2007 + IN 15/2009)
const POP03_LIMPEZA_ITENS = [
  "Pisos limpos e secos, sem acúmulo de resíduos",
  "Paredes e teto sem sujidade, mofo ou descascamento",
  "Equipamentos de produção limpos e sanitizados",
  "Misturador e dosadores sem resíduos do lote anterior",
  "Esteiras e elevadores limpos e sem incrustações",
  "Utensílios e baldes lavados e armazenados corretamente",
  "Ralos e canaletas limpos e com telas de proteção",
  "Lixeiras identificadas, com tampa e saco plástico",
  "Luminárias com proteção contra quebra",
  "Registro de produto químico utilizado na limpeza (nome, concentração, validade)",
  "Ficha técnica e FISPQ do produto de limpeza disponível no local",
  "Concentração do produto sanitizante verificada antes da aplicação",
  "Tempo de contato do sanitizante respeitado conforme rótulo/POP",
  "Cronograma de limpeza semanal/mensal afixado e atualizado",
  "Silos e depósitos de MP inspecionados e sem incrustações",
];

// Checklist items for POP-04 water potability (IN 04/2007 — Art. 2º)
const POP04_AGUA_ITENS = [
  "Cloro residual dentro do padrão (0,2 a 2,0 mg/L)",
  "pH dentro do padrão (6,0 a 9,5)",
  "Turbidez dentro do padrão (≤ 5 NTU)",
  "Ausência de odor ou sabor anormal",
  "Reservatório com tampa e vedação adequada",
  "Laudo laboratorial mensal em dia (portaria 888/2021)",
  "Certificado de limpeza do reservatório válido (semestral)",
  "Ponto de coleta identificado e registrado",
  "Laudo microbiológico da água (coliformes totais e E. coli) — vigente",
  "Registro de tratamento da água (quando fonte alternativa)",
  "Frequência de análise conforme plano de amostragem",
];

// Checklist items for POP-05 Higiene e Saúde do Pessoal (IN 04/2007 + IN 15/2009)
const POP05_HIGIENE_PESSOAL_ITENS = [
  "Colaborador sem sintomas (febre, diarreia, vômito, lesões cutâneas, icterícia)",
  "ASO (Atestado de Saúde Ocupacional) válido e dentro da validade",
  "Exame admissional ou periódico em dia (intervalo ≤ 12 meses)",
  "Exame de retorno ao trabalho realizado (quando aplicável)",
  "Uniforme limpo, completo e em bom estado (sem botões, sem bolsos externos)",
  "Uso adequado de EPIs: touca, luvas, botas, máscara (quando aplicável)",
  "Ausência de adornos: anéis, relógio, brincos, pulseiras, piercings",
  "Unhas curtas, limpas e sem esmalte ou unhas postiças",
  "Barba aparada ou protegida com rede/protetor",
  "Ausência de ferimentos expostos — curativos impermeáveis aplicados",
  "Sem uso de perfume, maquiagem ou cosmético com fragrância forte",
  "Mãos lavadas e higienizadas antes do início das atividades",
  "Colaborador orientado sobre BPF e manipulação de alimentos para animais",
  "Certificado de capacitação BPF / manipulação válido (reciclagem anual)",
  "Registro de triagem diária preenchido pelo responsável do setor",
  "Colaborador apto conforme laudo médico (sem restrições impeditivas)",
];

// Checklist items for POP-09 vehicle transport inspection (IN 15/2009)
const POP09_VEICULO_ITENS = [
  "Carroceria/baú limpo e seco, sem resíduos de cargas anteriores",
  "Ausência de odor estranho ou contaminante no veículo",
  "Lona/cobertura em bom estado (sem rasgos ou furos)",
  "Ausência de sinais de pragas (insetos, roedores)",
  "Veículo sem carga proibida anterior (proteína animal para ruminantes — IN 15/2009)",
  "Lacre de segurança íntegro (quando aplicável)",
  "Documentação de transporte completa (DANFE, romaneio)",
  "Temperatura do veículo adequada (quando refrigerado)",
];

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
  const { empresaAtiva } = useEmpresa();
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
  const [checklistTriagem, setChecklistTriagem] = useState<Record<number, boolean | null>>({});
  // POP-02 ASO fields
  const [asoNumero, setAsoNumero] = useState("");
  const [asoValidade, setAsoValidade] = useState("");
  const [asoTipo, setAsoTipo] = useState("periodico");
  // POP-03 chemical fields
  const [produtoQuimico, setProdutoQuimico] = useState("");
  const [concentracaoQuimico, setConcentracaoQuimico] = useState("");
  const [tempoContato, setTempoContato] = useState("");
  // POP-04 laudo fields
  const [laudoNumero, setLaudoNumero] = useState("");
  const [laudoLaboratorio, setLaudoLaboratorio] = useState("");
  const [laudoData, setLaudoData] = useState("");

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

  const isPOP02 = selectedDoc?.codigo?.toUpperCase().includes("POP-002") || selectedDoc?.codigo?.toUpperCase().includes("POP-02") || (selectedDoc?.nome?.toLowerCase().includes("higiene") && selectedDoc?.nome?.toLowerCase().includes("saúde"));
  const isPOP03 = selectedDoc?.codigo?.toUpperCase().includes("POP-003") || selectedDoc?.codigo?.toUpperCase().includes("POP-03") || (selectedDoc?.nome?.toLowerCase().includes("higienização") && selectedDoc?.nome?.toLowerCase().includes("instalações"));
  const isPOP04 = selectedDoc?.codigo?.toUpperCase().includes("POP-004") || selectedDoc?.codigo?.toUpperCase().includes("POP-04") || selectedDoc?.nome?.toLowerCase().includes("potabilidade");
  const isPOP05 = selectedDoc?.codigo?.toUpperCase().includes("POP-005") || selectedDoc?.codigo?.toUpperCase().includes("POP-05") || (selectedDoc?.nome?.toLowerCase().includes("higiene") && selectedDoc?.nome?.toLowerCase().includes("pessoal")) || (selectedDoc?.nome?.toLowerCase().includes("saúde") && selectedDoc?.nome?.toLowerCase().includes("pessoal"));
  const isPOP09 = selectedDoc?.codigo?.toUpperCase().includes("POP-009") || selectedDoc?.codigo?.toUpperCase().includes("POP-09") || selectedDoc?.nome?.toLowerCase().includes("transporte") || selectedDoc?.nome?.toLowerCase().includes("veículo");
  const activeChecklist = isPOP02 ? POP02_TRIAGEM_ITENS : isPOP03 ? POP03_LIMPEZA_ITENS : isPOP04 ? POP04_AGUA_ITENS : isPOP05 ? POP05_HIGIENE_PESSOAL_ITENS : isPOP09 ? POP09_VEICULO_ITENS : null;

  const handleAdd = async () => {
    if (!selectedDoc || !executor || !user) return;
    setSaving(true);

    // Build checklist observation
    let obsCompleta = obs;
    if (activeChecklist) {
      const checkItems = activeChecklist.map((item, i) => {
        const val = checklistTriagem[i];
        return `${val === true ? "✅" : val === false ? "❌" : "⬜"} ${item}`;
      }).join("\n");
      const naoConformes = activeChecklist.filter((_, i) => checklistTriagem[i] === false).length;
      const header = isPOP02 ? "[TRIAGEM DIÁRIA — POP-02 / IN 15/2009]" : isPOP03 ? "[LIMPEZA PRÉ-OPERACIONAL — POP-03 / IN 04/2007 + IN 15/2009]" : isPOP04 ? "[CONTROLE POTABILIDADE — POP-04 / IN 04/2007]" : isPOP05 ? "[HIGIENE E SAÚDE DO PESSOAL — POP-05 / IN 04/2007]" : "[VISTORIA VEÍCULO — POP-09 / IN 15/2009]";
      const laudoInfo = isPOP04 && laudoNumero ? `\n📄 Laudo nº ${laudoNumero} | Lab: ${laudoLaboratorio} | Data: ${laudoData}` : "";
      const asoInfo = isPOP02 && asoNumero ? `\n🩺 ASO nº ${asoNumero} | Tipo: ${asoTipo} | Validade: ${asoValidade}` : "";
      const quimicoInfo = isPOP03 && produtoQuimico ? `\n🧴 Produto: ${produtoQuimico} | Conc: ${concentracaoQuimico} | Tempo contato: ${tempoContato}` : "";
      obsCompleta = `${header}\n${checkItems}${naoConformes > 0 ? `\n⚠️ ${naoConformes} item(ns) não conforme(s)` : "\n✅ Todos os itens conformes"}${laudoInfo}${asoInfo}${quimicoInfo}${obs ? `\nObs: ${obs}` : ""}`;
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
      setChecklistTriagem({}); setLaudoNumero(""); setLaudoLaboratorio(""); setLaudoData("");
      setAsoNumero(""); setAsoValidade(""); setAsoTipo("periodico");
      setProdutoQuimico(""); setConcentracaoQuimico(""); setTempoContato("");
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
      <PageHeader icon={PlayCircle} title="Execução de ITs e POPs" description="Diário de bordo digital — comprova ao MAPA que os POPs são executados" orientacaoModuloId="execucao-pops" />

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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

                {/* Checklist POP-02 / POP-04 */}
                {activeChecklist && (
                  <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-2">
                    <p className="text-xs font-semibold text-primary">
                      {isPOP02 ? "📋 Triagem Diária — Higiene e Saúde do Pessoal (POP-02 / IN 15/2009)" : isPOP03 ? "🧹 Checklist Limpeza Pré-Operacional — Instalações e Equipamentos (POP-03 / IN 04/2007)" : isPOP04 ? "💧 Controle de Potabilidade da Água (POP-04 / IN 04/2007)" : isPOP05 ? "🩺 Higiene e Saúde do Pessoal — Exames Médicos e Adornos (POP-05 / IN 04/2007)" : "🚛 Vistoria de Veículo de Transporte (POP-09 / IN 15/2009)"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">Marque cada item como Conforme (✅) ou Não Conforme (❌):</p>
                    <div className="space-y-1.5">
                      {activeChecklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-background border text-xs">
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              className={`w-6 h-6 rounded text-xs font-bold ${checklistTriagem[idx] === true ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
                              onClick={() => setChecklistTriagem(prev => ({ ...prev, [idx]: prev[idx] === true ? null : true }))}
                            >✓</button>
                            <button
                              type="button"
                              className={`w-6 h-6 rounded text-xs font-bold ${checklistTriagem[idx] === false ? "bg-destructive text-white" : "bg-muted text-muted-foreground"}`}
                              onClick={() => setChecklistTriagem(prev => ({ ...prev, [idx]: prev[idx] === false ? null : false }))}
                            >✗</button>
                          </div>
                          <span className="flex-1">{item}</span>
                        </div>
                      ))}
                    </div>
                    {Object.values(checklistTriagem).some(v => v === false) && (
                      <p className="text-xs text-destructive font-semibold mt-2">⚠️ Itens não conformes detectados — registrar como "Não conforme" se necessário.</p>
                    )}

                    {/* POP-02 or POP-05 ASO/Exames fields */}
                    {(isPOP02 || isPOP05) && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 space-y-2">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">🩺 Registro de ASO / Exames Médicos Periódicos (IN 04/2007)</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Tipo de Exame</Label>
                            <Select value={asoTipo} onValueChange={setAsoTipo}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admissional">Admissional</SelectItem>
                                <SelectItem value="periodico">Periódico</SelectItem>
                                <SelectItem value="retorno">Retorno ao Trabalho</SelectItem>
                                <SelectItem value="mudanca_funcao">Mudança de Função</SelectItem>
                                <SelectItem value="demissional">Demissional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Nº ASO</Label><Input value={asoNumero} onChange={e => setAsoNumero(e.target.value)} placeholder="Ex: ASO-2026/045" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Validade do ASO</Label><Input type="date" value={asoValidade} onChange={e => setAsoValidade(e.target.value)} className="h-8 text-xs" /></div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Exames periódicos devem ser realizados anualmente ou conforme PCMSO. Mantenha cópia do ASO no prontuário do colaborador.</p>
                      </div>
                    )}

                    {/* POP-03 chemical substance fields */}
                    {isPOP03 && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 space-y-2">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">🧴 Produtos Químicos Utilizados (IN 15/2009)</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className="text-xs">Produto / Sanitizante</Label><Input value={produtoQuimico} onChange={e => setProdutoQuimico(e.target.value)} placeholder="Ex: Hipoclorito de Sódio" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Concentração</Label><Input value={concentracaoQuimico} onChange={e => setConcentracaoQuimico(e.target.value)} placeholder="Ex: 200 ppm" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Tempo de Contato</Label><Input value={tempoContato} onChange={e => setTempoContato(e.target.value)} placeholder="Ex: 15 min" className="h-8 text-xs" /></div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Registrar nome comercial, princípio ativo, concentração de uso e tempo de contato. Manter FISPQ disponível no setor.</p>
                      </div>
                    )}

                    {/* POP-04 laudo fields */}
                    {isPOP04 && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-300 space-y-2">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">📄 Dados do Laudo de Análise da Água</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className="text-xs">Nº Laudo</Label><Input value={laudoNumero} onChange={e => setLaudoNumero(e.target.value)} placeholder="Ex: 2026/0145" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Laboratório</Label><Input value={laudoLaboratorio} onChange={e => setLaudoLaboratorio(e.target.value)} placeholder="Nome do lab" className="h-8 text-xs" /></div>
                          <div><Label className="text-xs">Data do Laudo</Label><Input type="date" value={laudoData} onChange={e => setLaudoData(e.target.value)} className="h-8 text-xs" /></div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Anexe o laudo completo no módulo Documentos/Arquivo BPF para evidência fiscal.</p>
                      </div>
                    )}
                  </div>
                )}

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
