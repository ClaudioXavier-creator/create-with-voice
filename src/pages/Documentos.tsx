import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Loader2, Wrench, Gauge, AlertCircle, ExternalLink, Upload, FolderOpen, Trash2 } from "lucide-react";
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
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

const POPS_OBRIGATORIOS = [
  { codigo: "POP-001", nome: "Qualificação de fornecedores e controle de matérias-primas, ingredientes e de embalagens", modulo: "/recebimento", moduloLabel: "Recebimento MP" },
  { codigo: "POP-002", nome: "Limpeza, higienização e manutenção de instalações, equipamentos e utensílios", modulo: "/higiene", moduloLabel: "Higiene / Sanitização" },
  { codigo: "POP-003", nome: "Higiene e saúde do pessoal", modulo: "/treinamentos", moduloLabel: "Treinamentos / RH" },
  { codigo: "POP-004", nome: "Potabilidade da água e higienização do reservatório", modulo: "/higiene", moduloLabel: "Controle de Água (POP-04)" },
  { codigo: "POP-005", nome: "Prevenção de contaminação cruzada", modulo: "/pcp", moduloLabel: "PCP / Sequenciamento" },
  { codigo: "POP-006", nome: "Manejo de resíduos", modulo: "/residuos", moduloLabel: "Resíduos / Efluentes" },
  { codigo: "POP-007", nome: "Programa de controle integrado de pragas", modulo: "/pragas", moduloLabel: "Controle de Pragas" },
  { codigo: "POP-008", nome: "Programa de rastreabilidade e recolhimento de produtos (recall)", modulo: "/rastreabilidade", moduloLabel: "Rastreabilidade" },
  { codigo: "POP-009", nome: "Procedimentos sobre o programa de autocontrole (PAC)", modulo: "/auditoria", moduloLabel: "Auditoria BPF" },
];


const TIPOS_EQUIPAMENTO = [
  { value: "balanca", label: "Balança" },
  { value: "termometro", label: "Termômetro" },
  { value: "higrometro", label: "Higrômetro" },
  { value: "medidor_umidade", label: "Medidor de Umidade" },
  { value: "manometro", label: "Manômetro" },
  { value: "outro", label: "Outro" },
];

const CATEGORIAS_ARQ = [
  { value: "pop", label: "POP" },
  { value: "it", label: "Instrução de Trabalho (IT)" },
  { value: "planilha", label: "Planilha" },
  { value: "manual", label: "Manual BPF" },
  { value: "certificado", label: "Certificado / Laudo" },
  { value: "outro", label: "Outro" },
];

interface DocRow {
  id: string; codigo: string; nome: string; versao: string | null;
  data_revisao: string | null; responsavel: string | null; status: string | null;
}

interface ArquivoBpf {
  id: string; titulo: string; categoria: string; descricao: string | null;
  arquivo_nome: string | null; arquivo_url: string | null; created_at: string;
}


interface CalibracaoRow {
  id: string; equipamento: string; codigo: string | null; tipo: string | null;
  localizacao: string | null; data_calibracao: string | null; proxima_calibracao: string | null;
  responsavel: string | null; certificado_numero: string | null; status: string | null;
  observacoes: string | null;
}

const statusBadge: Record<string, string> = {
  ativo: "bg-primary text-primary-foreground",
  em_revisao: "bg-yellow-500/20 text-yellow-700",
  obsoleto: "bg-muted text-muted-foreground",
};

const calibStatusBadge: Record<string, string> = {
  calibrado: "bg-primary text-primary-foreground",
  vencido: "bg-destructive text-destructive-foreground",
  em_calibracao: "bg-yellow-500/20 text-yellow-700",
  fora_de_uso: "bg-muted text-muted-foreground",
};

export default function Documentos() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoBpf[]>([]);
  const [calibracoes, setCalibracoes] = useState<CalibracaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // POP form
  const [popOpen, setPopOpen] = useState(false);
  const [popCodigo, setPopCodigo] = useState("");
  const [popNome, setPopNome] = useState("");
  const [popVersao, setPopVersao] = useState("01");
  const [popResponsavel, setPopResponsavel] = useState("");


  // Arquivo BPF form
  const [arqOpen, setArqOpen] = useState(false);
  const [arqTitulo, setArqTitulo] = useState("");
  const [arqCategoria, setArqCategoria] = useState("pop");
  const [arqDescricao, setArqDescricao] = useState("");
  const [arqFile, setArqFile] = useState<File | null>(null);
  const [arqFilterCat, setArqFilterCat] = useState("todos");


  const [calOpen, setCalOpen] = useState(false);
  const [calEquipamento, setCalEquipamento] = useState("");
  const [calCodigo, setCalCodigo] = useState("");
  const [calTipo, setCalTipo] = useState("balanca");
  const [calLocal, setCalLocal] = useState("");
  const [calData, setCalData] = useState("");
  const [calProxima, setCalProxima] = useState("");
  const [calResponsavel, setCalResponsavel] = useState("");
  const [calCertificado, setCalCertificado] = useState("");
  const [calObs, setCalObs] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [docsRes, calRes, arqRes] = await Promise.all([
      supabase.from("documentos").select("*").order("codigo"),
      supabase.from("calibracoes").select("*").order("proxima_calibracao"),
      supabase.from("arquivos_bpf").select("*").order("created_at", { ascending: false }),
    ]);
    if (docsRes.data) setDocs(docsRes.data);
    if (calRes.data) setCalibracoes(calRes.data as unknown as CalibracaoRow[]);
    if (arqRes.data) setArquivos(arqRes.data as unknown as ArquivoBpf[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddPop = async () => {
    if (!popCodigo || !popNome || !user) return;
    setSaving(true);
    const { error } = await supabase.from("documentos").insert({
      user_id: user.id, codigo: popCodigo, nome: popNome, versao: popVersao, responsavel: popResponsavel,
    });
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Documento salvo!"); setPopOpen(false); setPopCodigo(""); setPopNome(""); setPopVersao("01"); setPopResponsavel(""); fetchData(); }
    setSaving(false);
  };


  const handleAddCalibracao = async () => {
    if (!calEquipamento || !user) return;
    setSaving(true);
    const { error } = await supabase.from("calibracoes").insert({
      user_id: user.id, equipamento: calEquipamento, codigo: calCodigo, tipo: calTipo,
      localizacao: calLocal, data_calibracao: calData || null, proxima_calibracao: calProxima || null,
      responsavel: calResponsavel, certificado_numero: calCertificado, observacoes: calObs,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Calibração registrada!");
      setCalOpen(false);
      setCalEquipamento(""); setCalCodigo(""); setCalTipo("balanca"); setCalLocal("");
      setCalData(""); setCalProxima(""); setCalResponsavel(""); setCalCertificado(""); setCalObs("");
      fetchData();
    }
    setSaving(false);
  };

  const handleAddArquivo = async () => {
    if (!arqTitulo || !arqFile || !user) return;
    setSaving(true);
    let arquivo_url = "";
    let arquivo_nome = arqFile.name;
    // Upload para storage se disponível
    const path = `bpf/${empresaAtiva?.id || user.id}/${arqCategoria}/${Date.now()}_${arqFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("feed-bpf").upload(path, arqFile);
    if (!upErr) {
      const { data: urlData } = supabase.storage.from("feed-bpf").getPublicUrl(path);
      arquivo_url = urlData?.publicUrl || path;
    }
    const { error } = await supabase.from("arquivos_bpf").insert({
      user_id: user.id, titulo: arqTitulo, categoria: arqCategoria, descricao: arqDescricao,
      arquivo_nome, arquivo_url, empresa_id: empresaAtiva?.id || null,
    });
    if (error) toast.error("Erro ao salvar arquivo");
    else {
      toast.success("Arquivo BPF salvo!");
      setArqOpen(false); setArqTitulo(""); setArqCategoria("pop"); setArqDescricao(""); setArqFile(null);
      fetchData();
    }
    setSaving(false);
  };

  const handleDeleteArquivo = async (id: string) => {
    const { error } = await supabase.from("arquivos_bpf").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Arquivo excluído"); fetchData(); }
  };

  const filteredArquivos = arqFilterCat === "todos" ? arquivos : arquivos.filter(a => a.categoria === arqFilterCat);

  const tipoLabel = (tipo: string) => TIPOS_EQUIPAMENTO.find(t => t.value === tipo)?.label || tipo;

  const today = new Date().toISOString().split("T")[0];
  const calibVencidas = calibracoes.filter(c => c.proxima_calibracao && c.proxima_calibracao < today && c.status !== "fora_de_uso");
  const calibOk = calibracoes.filter(c => c.status === "calibrado" && (!c.proxima_calibracao || c.proxima_calibracao >= today));

  return (
    <>
      <PageHeader icon={FileText} title="Documentos, POPs e Calibração" description="POPs obrigatórios, Manual BPF, ITs, arquivos e gestão de calibração" />

      <Tabs defaultValue="pops" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="pops">POPs Obrigatórios</TabsTrigger>
          <TabsTrigger value="registrados">Docs Registrados ({docs.length})</TabsTrigger>
          <TabsTrigger value="arquivo_bpf" className="flex items-center gap-1">
            <FolderOpen className="w-4 h-4" /> Arquivo BPF ({arquivos.length})
          </TabsTrigger>
          <TabsTrigger value="calibracao" className="flex items-center gap-1">
            <Gauge className="w-4 h-4" /> Calibração ({calibracoes.length})
            {calibVencidas.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{calibVencidas.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: POPs */}
        <TabsContent value="pops">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">9 POPs Obrigatórios — IN nº 04/2007 / Decreto 12.031/2024</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Procedimentos operacionais padrão exigidos pelo MAPA para fábricas de alimentação animal</p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-40">Módulo Vinculado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {POPS_OBRIGATORIOS.map((p) => {
                    const registrado = docs.find(d => d.codigo === p.codigo);
                    return (
                      <TableRow key={p.codigo}>
                        <TableCell className="font-mono text-sm font-medium">{p.codigo}</TableCell>
                        <TableCell>
                          <p className="text-sm">{p.nome}</p>
                          {registrado && <span className="text-xs text-muted-foreground">v{registrado.versao} • {registrado.responsavel}</span>}
                        </TableCell>
                        <TableCell>
                          {registrado ? (
                            <Badge className={statusBadge[registrado.status || "ativo"]}>
                              {registrado.status === "em_revisao" ? "Em revisão" : registrado.status === "obsoleto" ? "Obsoleto" : "Ativo"}
                            </Badge>
                          ) : <Badge variant="outline" className="text-destructive border-destructive">Pendente</Badge>}
                        </TableCell>
                        <TableCell>
                          {p.modulo && (
                            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate(p.modulo)}>
                              <ExternalLink className="w-3 h-3" /> {p.moduloLabel}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Docs registrados */}
        <TabsContent value="registrados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Documentos Registrados</CardTitle>
              <Dialog open={popOpen} onOpenChange={setPopOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Documento</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Documento</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Código</Label>
                      <Select value={popCodigo} onValueChange={(v) => { setPopCodigo(v); const found = POPS_OBRIGATORIOS.find(p => p.codigo === v); if (found) setPopNome(found.nome); }}>
                        <SelectTrigger><SelectValue placeholder="Selecione ou digite" /></SelectTrigger>
                        <SelectContent>
                          {POPS_OBRIGATORIOS.map(p => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome.slice(0, 40)}...</SelectItem>)}
                          <SelectItem value="IT-001">IT-001 — Instrução de Trabalho</SelectItem>
                          <SelectItem value="MANUAL-BPF">MANUAL-BPF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Nome / Título</Label><Input value={popNome} onChange={e => setPopNome(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Versão</Label><Input value={popVersao} onChange={e => setPopVersao(e.target.value)} /></div>
                      <div><Label>Responsável</Label><Input value={popResponsavel} onChange={e => setPopResponsavel(e.target.value)} /></div>
                    </div>
                    <Button onClick={handleAddPop} className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              : docs.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum documento registrado</p>
              : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Versão</TableHead>
                    <TableHead>Revisão</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {docs.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm">{d.codigo}</TableCell>
                        <TableCell>{d.nome}</TableCell><TableCell>{d.versao}</TableCell>
                        <TableCell>{d.data_revisao}</TableCell><TableCell>{d.responsavel}</TableCell>
                        <TableCell><Badge className={statusBadge[d.status || "ativo"]}>{d.status === "em_revisao" ? "Em revisão" : d.status === "obsoleto" ? "Obsoleto" : "Ativo"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Calibração */}
        <TabsContent value="calibracao">
          {calibVencidas.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5 mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <h3 className="font-display font-semibold text-sm text-destructive">
                    {calibVencidas.length} equipamento(s) com calibração vencida!
                  </h3>
                </div>
                <div className="space-y-1">
                  {calibVencidas.map(c => (
                    <div key={c.id} className="text-xs flex items-center gap-2 p-1.5 rounded bg-background border border-destructive/20">
                      <Gauge className="w-3.5 h-3.5 text-destructive" />
                      <span className="font-medium">{c.equipamento}</span>
                      <span className="text-muted-foreground">({c.codigo})</span>
                      <span className="text-destructive">Vencida em {c.proxima_calibracao}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display">{calibracoes.length}</p>
              <p className="text-xs text-muted-foreground">Equipamentos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-primary">{calibOk.length}</p>
              <p className="text-xs text-muted-foreground">Calibrados OK</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-destructive">{calibVencidas.length}</p>
              <p className="text-xs text-muted-foreground">Vencidos</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Gestão de Calibração</CardTitle>
              <Dialog open={calOpen} onOpenChange={setCalOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Equipamento</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Calibração</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Equipamento *</Label><Input value={calEquipamento} onChange={e => setCalEquipamento(e.target.value)} placeholder="Ex: Balança Toledo 500kg" /></div>
                      <div><Label>Código / Patrimônio</Label><Input value={calCodigo} onChange={e => setCalCodigo(e.target.value)} placeholder="Ex: BAL-001" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Tipo</Label>
                        <Select value={calTipo} onValueChange={setCalTipo}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{TIPOS_EQUIPAMENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Localização</Label><Input value={calLocal} onChange={e => setCalLocal(e.target.value)} placeholder="Ex: Setor Mistura" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Data da Calibração</Label><Input type="date" value={calData} onChange={e => setCalData(e.target.value)} /></div>
                      <div><Label>Próxima Calibração</Label><Input type="date" value={calProxima} onChange={e => setCalProxima(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Responsável / Empresa</Label><Input value={calResponsavel} onChange={e => setCalResponsavel(e.target.value)} /></div>
                      <div><Label>Nº Certificado</Label><Input value={calCertificado} onChange={e => setCalCertificado(e.target.value)} /></div>
                    </div>
                    <div><Label>Observações</Label><Textarea value={calObs} onChange={e => setCalObs(e.target.value)} /></div>
                    <Button onClick={handleAddCalibracao} className="w-full" disabled={saving || !calEquipamento}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              : calibracoes.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum equipamento cadastrado</p>
              : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Equipamento</TableHead><TableHead>Código</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Local</TableHead><TableHead>Calibração</TableHead><TableHead>Próxima</TableHead>
                    <TableHead>Certificado</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {calibracoes.map(c => {
                      const vencido = c.proxima_calibracao && c.proxima_calibracao < today;
                      const displayStatus = vencido && c.status !== "fora_de_uso" ? "vencido" : (c.status || "calibrado");
                      return (
                        <TableRow key={c.id} className={vencido ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium text-sm">{c.equipamento}</TableCell>
                          <TableCell className="font-mono text-xs">{c.codigo || "—"}</TableCell>
                          <TableCell className="text-sm">{tipoLabel(c.tipo || "outro")}</TableCell>
                          <TableCell className="text-sm">{c.localizacao || "—"}</TableCell>
                          <TableCell className="text-sm">{c.data_calibracao || "—"}</TableCell>
                          <TableCell className={`text-sm ${vencido ? "text-destructive font-semibold" : ""}`}>{c.proxima_calibracao || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{c.certificado_numero || "—"}</TableCell>
                          <TableCell><Badge className={calibStatusBadge[displayStatus]}>{displayStatus === "calibrado" ? "Calibrado" : displayStatus === "vencido" ? "Vencido" : displayStatus === "em_calibracao" ? "Em calibração" : "Fora de uso"}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
