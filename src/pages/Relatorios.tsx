import { useState, useEffect } from "react";
import { FileDown, Plus, Upload, Monitor, ScanLine, Eye, Loader2, Download, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MODULOS = [
  "Auditoria BPF",
  "Não Conformidades",
  "Recebimento MP",
  "Produção",
  "Rastreabilidade",
  "Controle de Pragas",
  "Treinamentos",
  "Execução ITs/POPs",
  "Checklist Decreto 12.031",
];

const EXPORT_MODULES = [
  { key: "nao_conformidades", label: "Não Conformidades", table: "nao_conformidades" as const },
  { key: "recebimento_mp", label: "Recebimento de MP", table: "recebimento_mp" as const },
  { key: "producao", label: "Produção", table: "producao" as const },
  { key: "rastreabilidade", label: "Rastreabilidade", table: "rastreabilidade" as const },
  { key: "controle_pragas", label: "Controle de Pragas", table: "controle_pragas" as const },
  { key: "treinamentos", label: "Treinamentos", table: "treinamentos" as const },
  { key: "execucao_pops", label: "Execução ITs/POPs", table: "execucao_pops" as const },
  { key: "checklist_items", label: "Checklist Auditoria", table: "checklist_items" as const },
  { key: "fornecedores", label: "Fornecedores", table: "fornecedores" as const },
  { key: "calibracoes", label: "Calibrações", table: "calibracoes" as const },
  { key: "documentos", label: "Documentos/POPs", table: "documentos" as const },
] as const;

type ExportTableName = typeof EXPORT_MODULES[number]["table"];

interface RelatorioRow {
  id: string;
  titulo: string;
  tipo: string;
  modulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  data_geracao: string | null;
  status: string | null;
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, csvContent: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const COLUMN_LABELS: Record<string, Record<string, string>> = {
  nao_conformidades: { data: "Data", setor: "Setor", descricao: "Descrição", causa: "Causa Raiz", acao_corretiva: "Ação Corretiva", responsavel: "Responsável", prazo: "Prazo", status: "Status" },
  recebimento_mp: { data: "Data", fornecedor: "Fornecedor", materia_prima: "Matéria-Prima", lote: "Lote", odor: "Odor", umidade: "Umidade", insetos: "Insetos", aprovado: "Aprovado" },
  producao: { data: "Data", produto: "Produto", lote: "Lote", operador: "Operador", tempo_mistura: "Tempo Mistura", quantidade: "Quantidade" },
  rastreabilidade: { produto: "Produto", lote_produto: "Lote Produto", materia_prima: "Matéria-Prima", lote_mp: "Lote MP", fornecedor: "Fornecedor", cliente_destino: "Cliente", data_venda: "Data Venda", nota_fiscal: "NF" },
  controle_pragas: { data: "Data", local: "Local", tipo_praga: "Tipo de Praga", acao: "Ação", responsavel: "Responsável" },
  treinamentos: { data: "Data", funcionario: "Funcionário", treinamento: "Treinamento", instrutor: "Instrutor", validade: "Validade" },
  execucao_pops: { data_execucao: "Data", codigo_pop: "Código POP", nome_pop: "Nome POP", executor: "Executor", setor: "Setor", status: "Status", observacoes: "Observações" },
  checklist_items: { auditoria_data: "Data", area: "Área", item: "Item", conforme: "Conforme", observacao: "Observação" },
  fornecedores: { nome: "Nome", cnpj: "CNPJ", tipo_produto: "Tipo Produto", status_qualificacao: "Qualificação", nota_avaliacao: "Nota", contato: "Contato", email: "E-mail" },
  calibracoes: { equipamento: "Equipamento", codigo: "Código", tipo: "Tipo", data_calibracao: "Data Calibração", proxima_calibracao: "Próxima", status: "Status", certificado_numero: "Certificado" },
  documentos: { codigo: "Código", nome: "Nome", versao: "Versão", data_revisao: "Data Revisão", responsavel: "Responsável", status: "Status" },
};

export default function Relatorios() {
  const { user } = useAuth();
  const [relatorios, setRelatorios] = useState<RelatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"digital" | "digitalizado">("digital");
  const [modulo, setModulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  // Assinatura RT
  const [rtNome, setRtNome] = useState("");
  const [rtCrmv, setRtCrmv] = useState("");
  const [rtAssinado, setRtAssinado] = useState(false);

  const fetchRelatorios = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("relatorios")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar relatórios");
    } else {
      setRelatorios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelatorios();
  }, [user]);

  const handleAdd = async () => {
    if (!titulo || !modulo || !user) return;
    setSaving(true);

    let arquivoUrl = "";
    let arquivoNome = "";

    if (tipo === "digitalizado" && arquivo) {
      const filePath = `${user.id}/${Date.now()}_${arquivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("relatorios")
        .upload(filePath, arquivo);
      if (uploadError) {
        toast.error("Erro ao enviar arquivo: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("relatorios").getPublicUrl(filePath);
      arquivoUrl = urlData.publicUrl;
      arquivoNome = arquivo.name;
    }

    const rtInfo = rtAssinado ? ` | [ASSINATURA RT] ${rtNome} - CRMV: ${rtCrmv} - ${new Date().toISOString()}` : "";
    const { error } = await supabase.from("relatorios").insert({
      user_id: user.id,
      titulo,
      tipo,
      modulo,
      descricao: (descricao || "") + rtInfo,
      arquivo_url: arquivoUrl,
      arquivo_nome: arquivoNome,
    });

    if (error) {
      toast.error("Erro ao salvar relatório");
    } else {
      toast.success("Relatório salvo!");
      setOpen(false);
      setTitulo("");
      setTipo("digital");
      setModulo("");
      setDescricao("");
      setArquivo(null);
      fetchRelatorios();
    }
    setSaving(false);
  };

  const toggleModule = (key: string) => {
    setSelectedModules(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (selectedModules.length === EXPORT_MODULES.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(EXPORT_MODULES.map(m => m.key));
    }
  };

  const handleExport = async () => {
    if (!user || selectedModules.length === 0) {
      toast.error("Selecione ao menos um módulo");
      return;
    }
    setExporting(true);

    try {
      const modulesToExport = EXPORT_MODULES.filter(m => selectedModules.includes(m.key));
      let fullCsv = "";

      for (const mod of modulesToExport) {
        const { data, error } = await supabase
          .from(mod.table)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          toast.error(`Erro ao exportar ${mod.label}`);
          continue;
        }

        const rows = data || [];
        const labels = COLUMN_LABELS[mod.key] || {};
        const columns = Object.keys(labels);

        if (modulesToExport.length > 1) {
          fullCsv += `\n=== ${mod.label.toUpperCase()} (${rows.length} registros) ===\n`;
        }

        fullCsv += columns.map(c => escapeCsv(labels[c])).join(",") + "\n";

        for (const row of rows) {
          const r = row as Record<string, unknown>;
          fullCsv += columns.map(c => {
            const val = r[c];
            if (typeof val === "boolean") return val ? "Sim" : "Não";
            return escapeCsv(val);
          }).join(",") + "\n";
        }

        fullCsv += "\n";
      }

      const now = new Date().toISOString().slice(0, 10);
      const label = selectedModules.length === 1
        ? EXPORT_MODULES.find(m => m.key === selectedModules[0])?.label.replace(/\s/g, "_") || "modulo"
        : "completo";
      downloadCsv(`relatorio_${label}_${now}.csv`, fullCsv);
      toast.success(`Relatório exportado com ${selectedModules.length} módulo(s)!`);
      setExportOpen(false);
    } catch {
      toast.error("Erro ao exportar relatório");
    }
    setExporting(false);
  };

  const digitais = relatorios.filter(r => r.tipo === "digital");
  const digitalizados = relatorios.filter(r => r.tipo === "digitalizado");

  return (
    <>
      <PageHeader icon={FileDown} title="Relatórios" description="Relatórios digitais e documentos digitalizados" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{relatorios.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Monitor className="w-5 h-5 text-primary" /></div>
          <p className="text-2xl font-bold font-display text-primary">{digitais.length}</p>
          <p className="text-xs text-muted-foreground">Digitais</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><ScanLine className="w-5 h-5 text-accent" /></div>
          <p className="text-2xl font-bold font-display text-accent">{digitalizados.length}</p>
          <p className="text-xs text-muted-foreground">Digitalizados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{relatorios.filter(r => r.status === "arquivado").length}</p>
          <p className="text-xs text-muted-foreground">Arquivados</p>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Monitor className="w-8 h-8 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Relatórios Digitais</h3>
                <p className="text-xs text-muted-foreground mt-1">Para empresas médias e maiores com dispositivo eletrônico de registro.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <ScanLine className="w-8 h-8 text-accent mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Documentos Digitalizados</h3>
                <p className="text-xs text-muted-foreground mt-1">Para empresas menores com planilha em papel assinada e escaneada.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Relatórios</CardTitle>
          <div className="flex gap-2">
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> Exportar Dados</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Exportar Relatório CSV</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Selecione os módulos que deseja incluir no relatório exportado.</p>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={selectedModules.length === EXPORT_MODULES.length}
                    onCheckedChange={selectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="text-sm font-semibold cursor-pointer">
                    {selectedModules.length === EXPORT_MODULES.length ? "Desmarcar todos" : "Selecionar todos (Relatório Completo)"}
                  </Label>
                </div>
                <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto mt-1">
                  {EXPORT_MODULES.map(mod => (
                    <div key={mod.key} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedModules.includes(mod.key)}
                        onCheckedChange={() => toggleModule(mod.key)}
                        id={`mod-${mod.key}`}
                      />
                      <Label htmlFor={`mod-${mod.key}`} className="text-sm cursor-pointer">{mod.label}</Label>
                    </div>
                  ))}
                </div>
                <Button onClick={handleExport} className="w-full mt-2" disabled={exporting || selectedModules.length === 0}>
                  {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Exportar {selectedModules.length > 0 ? `(${selectedModules.length} módulo${selectedModules.length > 1 ? "s" : ""})` : ""}
                </Button>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Relatório</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Adicionar Relatório</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do relatório" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v: "digital" | "digitalizado") => setTipo(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">📊 Digital</SelectItem>
                          <SelectItem value="digitalizado">📄 Digitalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Módulo</Label>
                      <Select value={modulo} onValueChange={setModulo}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {MODULOS.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do relatório..." />
                  </div>
                  {tipo === "digitalizado" && (
                    <div>
                      <Label>Arquivo digitalizado (PDF, foto)</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setArquivo(e.target.files?.[0] || null)} />
                        <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Planilha preenchida em papel, assinada e escaneada/fotografada</p>
                    </div>
                  )}
                  {/* Assinatura Digital do RT — Decreto 12.031/2024, Art. 18 */}
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" /> Assinatura Digital do RT (Decreto 12.031/2024)
                      </p>
                      <Switch checked={rtAssinado} onCheckedChange={setRtAssinado} />
                    </div>
                    {rtAssinado && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Nome do RT</Label><Input value={rtNome} onChange={e => setRtNome(e.target.value)} placeholder="Dr(a). Nome Completo" /></div>
                        <div><Label>CRMV</Label><Input value={rtCrmv} onChange={e => setRtCrmv(e.target.value)} placeholder="CRMV-XX 00000" /></div>
                      </div>
                    )}
                    {rtAssinado && (
                      <p className="text-xs text-primary">
                        ✓ Ao salvar, o relatório será assinado digitalmente com data/hora e dados do RT, conferindo validade para fiscalizações remotas.
                      </p>
                    )}
                  </div>

                  <Button onClick={handleAdd} className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {rtAssinado ? "Salvar e Assinar Relatório" : "Salvar Relatório"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos ({relatorios.length})</TabsTrigger>
                <TabsTrigger value="digitais">Digitais ({digitais.length})</TabsTrigger>
                <TabsTrigger value="digitalizados">Digitalizados ({digitalizados.length})</TabsTrigger>
              </TabsList>
              {["todos", "digitais", "digitalizados"].map(tab => (
                <TabsContent key={tab} value={tab} className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tab === "todos" ? relatorios : tab === "digitais" ? digitais : digitalizados).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum relatório cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        (tab === "todos" ? relatorios : tab === "digitais" ? digitais : digitalizados).map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap">{r.data_geracao}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{r.titulo}</p>
                              <p className="text-xs text-muted-foreground">{r.descricao}</p>
                            </TableCell>
                            <TableCell>
                              <Badge className={r.tipo === "digital" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}>
                                {r.tipo === "digital" ? "Digital" : "Digitalizado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{r.modulo}</TableCell>
                            <TableCell>
                              {r.arquivo_nome ? (
                                <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                                  <a href={r.arquivo_url || "#"} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-3 h-3" /> {r.arquivo_nome}
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === "ativo" ? "default" : "secondary"}>
                                {r.status === "ativo" ? "Ativo" : "Arquivado"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  );
}
