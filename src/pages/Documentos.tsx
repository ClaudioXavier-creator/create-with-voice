import { useState, useEffect } from "react";
import { FileText, Plus, Upload, Eye, FolderOpen, Loader2, BookOpen, ClipboardList, Wrench } from "lucide-react";
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
import { toast } from "sonner";

const POPS_OBRIGATORIOS = [
  { codigo: "POP-001", nome: "Qualificação de fornecedores e controle de matérias-primas, ingredientes e de embalagens" },
  { codigo: "POP-002", nome: "Limpeza, higienização e manutenção de instalações, equipamentos e utensílios" },
  { codigo: "POP-003", nome: "Higiene e saúde do pessoal" },
  { codigo: "POP-004", nome: "Potabilidade da água e higienização do reservatório" },
  { codigo: "POP-005", nome: "Prevenção de contaminação cruzada" },
  { codigo: "POP-006", nome: "Manejo de resíduos" },
  { codigo: "POP-007", nome: "Programa de controle integrado de pragas" },
  { codigo: "POP-008", nome: "Programa de rastreabilidade e recolhimento de produtos (recall)" },
  { codigo: "POP-009", nome: "Procedimentos sobre o programa de autocontrole (PAC)" },
];

const CATEGORIAS = [
  { value: "manual_bpf", label: "Manual BPF", icon: BookOpen },
  { value: "pop", label: "POP", icon: ClipboardList },
  { value: "it", label: "Instrução de Trabalho (IT)", icon: Wrench },
  { value: "planilha_preenchida", label: "Planilha Preenchida", icon: FileText },
  { value: "outro", label: "Outro Documento", icon: FolderOpen },
];

interface DocRow {
  id: string;
  codigo: string;
  nome: string;
  versao: string | null;
  data_revisao: string | null;
  responsavel: string | null;
  status: string | null;
}

interface ArquivoRow {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  created_at: string;
}

const statusBadge: Record<string, string> = {
  ativo: "bg-primary text-primary-foreground",
  em_revisao: "bg-yellow-500/20 text-yellow-700",
  obsoleto: "bg-muted text-muted-foreground",
};

export default function Documentos() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // POP form
  const [popOpen, setPopOpen] = useState(false);
  const [popCodigo, setPopCodigo] = useState("");
  const [popNome, setPopNome] = useState("");
  const [popVersao, setPopVersao] = useState("01");
  const [popResponsavel, setPopResponsavel] = useState("");

  // Arquivo form
  const [arqOpen, setArqOpen] = useState(false);
  const [arqCategoria, setArqCategoria] = useState("pop");
  const [arqTitulo, setArqTitulo] = useState("");
  const [arqDescricao, setArqDescricao] = useState("");
  const [arqFile, setArqFile] = useState<File | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const [docsRes, arqRes] = await Promise.all([
      supabase.from("documentos").select("*").order("codigo"),
      supabase.from("arquivos_bpf").select("*").order("created_at", { ascending: false }),
    ]);
    if (docsRes.data) setDocs(docsRes.data);
    if (arqRes.data) setArquivos(arqRes.data as unknown as ArquivoRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddPop = async () => {
    if (!popCodigo || !popNome || !user) return;
    setSaving(true);
    const { error } = await supabase.from("documentos").insert({
      user_id: user.id,
      codigo: popCodigo,
      nome: popNome,
      versao: popVersao,
      responsavel: popResponsavel,
    });
    if (error) toast.error("Erro ao salvar"); 
    else {
      toast.success("Documento salvo!");
      setPopOpen(false);
      setPopCodigo(""); setPopNome(""); setPopVersao("01"); setPopResponsavel("");
      fetchData();
    }
    setSaving(false);
  };

  const handleAddArquivo = async () => {
    if (!arqTitulo || !arqFile || !user) return;
    setSaving(true);
    const filePath = `${user.id}/${Date.now()}_${arqFile.name}`;
    const { error: uploadErr } = await supabase.storage.from("documentos_bpf").upload(filePath, arqFile);
    if (uploadErr) { toast.error("Erro no upload: " + uploadErr.message); setSaving(false); return; }
    const { data: urlData } = supabase.storage.from("documentos_bpf").getPublicUrl(filePath);

    const { error } = await supabase.from("arquivos_bpf").insert({
      user_id: user.id,
      categoria: arqCategoria,
      titulo: arqTitulo,
      descricao: arqDescricao,
      arquivo_nome: arqFile.name,
      arquivo_url: urlData.publicUrl,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Arquivo enviado!");
      setArqOpen(false);
      setArqTitulo(""); setArqDescricao(""); setArqFile(null); setArqCategoria("pop");
      fetchData();
    }
    setSaving(false);
  };

  const catLabel = (cat: string) => CATEGORIAS.find(c => c.value === cat)?.label || cat;

  return (
    <>
      <PageHeader icon={FileText} title="Documentos e POPs" description="POPs obrigatórios, Manual BPF, ITs e planilhas preenchidas" />

      <Tabs defaultValue="pops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pops">POPs Obrigatórios</TabsTrigger>
          <TabsTrigger value="registrados">Docs Registrados ({docs.length})</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivo BPF ({arquivos.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: 9 POPs obrigatórios */}
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
                          {registrado && (
                            <span className="text-xs text-muted-foreground">v{registrado.versao} • {registrado.responsavel}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {registrado ? (
                            <Badge className={statusBadge[registrado.status || "ativo"]}>
                              {registrado.status === "em_revisao" ? "Em revisão" : registrado.status === "obsoleto" ? "Obsoleto" : "Ativo"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive border-destructive">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <strong>Dica:</strong> Registre cada POP na aba "Docs Registrados" e envie o arquivo na aba "Arquivo BPF".
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Documentos registrados */}
        <TabsContent value="registrados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Documentos Registrados</CardTitle>
              <Dialog open={popOpen} onOpenChange={setPopOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Documento</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Documento</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Código</Label>
                      <Select value={popCodigo} onValueChange={(v) => {
                        setPopCodigo(v);
                        const found = POPS_OBRIGATORIOS.find(p => p.codigo === v);
                        if (found) setPopNome(found.nome);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Selecione ou digite" /></SelectTrigger>
                        <SelectContent>
                          {POPS_OBRIGATORIOS.map(p => (
                            <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome.slice(0, 40)}...</SelectItem>
                          ))}
                          <SelectItem value="IT-001">IT-001 — Instrução de Trabalho</SelectItem>
                          <SelectItem value="MANUAL-BPF">MANUAL-BPF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome / Título</Label>
                      <Input value={popNome} onChange={e => setPopNome(e.target.value)} placeholder="Nome do documento" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Versão</Label>
                        <Input value={popVersao} onChange={e => setPopVersao(e.target.value)} placeholder="01" />
                      </div>
                      <div>
                        <Label>Responsável</Label>
                        <Input value={popResponsavel} onChange={e => setPopResponsavel(e.target.value)} placeholder="Nome do responsável" />
                      </div>
                    </div>
                    <Button onClick={handleAddPop} className="w-full" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : docs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum documento registrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Revisão</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm">{d.codigo}</TableCell>
                        <TableCell>{d.nome}</TableCell>
                        <TableCell>{d.versao}</TableCell>
                        <TableCell>{d.data_revisao}</TableCell>
                        <TableCell>{d.responsavel}</TableCell>
                        <TableCell>
                          <Badge className={statusBadge[d.status || "ativo"]}>
                            {d.status === "em_revisao" ? "Em revisão" : d.status === "obsoleto" ? "Obsoleto" : "Ativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Arquivo BPF (uploads) */}
        <TabsContent value="arquivos">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-7 h-7 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-display font-semibold text-sm">Programa Digital</h3>
                    <p className="text-xs text-muted-foreground mt-1">Envie arquivos digitais: Manual BPF, POPs, ITs em PDF, Word etc.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-7 h-7 text-accent mt-1 shrink-0" />
                  <div>
                    <h3 className="font-display font-semibold text-sm">Programa Semi-Digital</h3>
                    <p className="text-xs text-muted-foreground mt-1">Envie planilhas preenchidas em papel, assinadas e digitalizadas (fotos/scan).</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Arquivo de Documentação BPF</CardTitle>
              <Dialog open={arqOpen} onOpenChange={setArqOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Upload className="w-4 h-4 mr-1" /> Enviar Arquivo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Enviar Documento ao Arquivo BPF</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={arqCategoria} onValueChange={setArqCategoria}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Título</Label>
                      <Input value={arqTitulo} onChange={e => setArqTitulo(e.target.value)} placeholder="Ex: POP-001 v03 - Qualificação de fornecedores" />
                    </div>
                    <div>
                      <Label>Descrição (opcional)</Label>
                      <Textarea value={arqDescricao} onChange={e => setArqDescricao(e.target.value)} placeholder="Observações sobre o documento..." />
                    </div>
                    <div>
                      <Label>Arquivo (PDF, Word, imagem)</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" onChange={e => setArqFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                    <Button onClick={handleAddArquivo} className="w-full" disabled={saving || !arqFile}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enviar Arquivo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : arquivos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum arquivo enviado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arquivos.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{catLabel(a.categoria)}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{a.titulo}</p>
                          {a.descricao && <p className="text-xs text-muted-foreground">{a.descricao}</p>}
                        </TableCell>
                        <TableCell>
                          {a.arquivo_url ? (
                            <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                              <a href={a.arquivo_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-3 h-3" /> {a.arquivo_nome}
                              </a>
                            </Button>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.created_at?.split("T")[0]}</TableCell>
                      </TableRow>
                    ))}
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
