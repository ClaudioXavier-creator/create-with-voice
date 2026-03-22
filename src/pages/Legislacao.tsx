import { useState, useEffect, useRef } from "react";
import { Scale, Sparkles, Loader2, RefreshCw, Bell, BookOpen, CheckCircle2, AlertTriangle, Info, Eye, Search, Upload, FileText, Trash2, ExternalLink, Plus, X, FolderOpen, Globe, Filter, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ──── Types ────

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

interface NormaDB {
  id: string;
  titulo: string;
  codigo: string | null;
  tipo: string | null;
  orgao: string | null;
  data_publicacao: string | null;
  resumo: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  tags: string[] | null;
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

const TIPO_NORMA_OPTIONS = [
  { value: "instrucao_normativa", label: "Instrução Normativa" },
  { value: "decreto", label: "Decreto" },
  { value: "lei", label: "Lei" },
  { value: "portaria", label: "Portaria" },
  { value: "resolucao", label: "Resolução" },
  { value: "nota_tecnica", label: "Nota Técnica" },
  { value: "outro", label: "Outro" },
];

const ORGAO_OPTIONS = ["MAPA", "ANVISA", "IBAMA", "MMA", "Presidência", "Outro"];

// ──── Main Component ────

export default function Legislacao() {
  const { user } = useAuth();

  // Alertas state
  const [loading, setLoading] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [alertas, setAlertas] = useState<AlertaDB[]>([]);
  const [alertasIA, setAlertasIA] = useState<Alerta[]>([]);
  const [resumoGeral, setResumoGeral] = useState("");
  const [resumoSistema, setResumoSistema] = useState<ResumoSistema | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaDB | Alerta | null>(null);
  const [fetchingDB, setFetchingDB] = useState(true);

  // Normas state
  const [normas, setNormas] = useState<NormaDB[]>([]);
  const [normasLoading, setNormasLoading] = useState(true);
  const [normaSearch, setNormaSearch] = useState("");
  const [normaDialogOpen, setNormaDialogOpen] = useState(false);
  const [savingNorma, setSavingNorma] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadRef = useRef<HTMLInputElement>(null);
  const [quickUploading, setQuickUploading] = useState(false);

  // Pesquisa SISLEGIS state
  const [pesquisaTermo, setPesquisaTermo] = useState("");
  const [pesquisaCategoria, setPesquisaCategoria] = useState("todas");
  const [pesquisaLoading, setPesquisaLoading] = useState(false);
  const [pesquisaResultados, setPesquisaResultados] = useState<any[]>([]);
  const [pesquisaResumo, setPesquisaResumo] = useState("");

  const [normaForm, setNormaForm] = useState({
    titulo: "",
    codigo: "",
    tipo: "instrucao_normativa",
    orgao: "MAPA",
    data_publicacao: "",
    resumo: "",
    arquivo_nome: "",
    arquivo_url: "",
    tags: "" as string,
  });

  // ──── Alertas logic ────

  const fetchAlertas = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("legislacao_alertas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAlertas(data as unknown as AlertaDB[]);
    setFetchingDB(false);
  };

  useEffect(() => { fetchAlertas(); fetchNormas(); }, [user]);

  const buscarAtualizacoes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("legislacao-ai", {
        body: { action: "buscar_atualizacoes" },
      });
      if (error) { toast.error("Erro ao buscar atualizações: " + error.message); setLoading(false); return; }
      if (data?.error) { toast.error(data.error); setLoading(false); return; }

      const result = data?.data;
      if (result?.alertas) {
        setAlertasIA(result.alertas);
        setResumoGeral(result.resumo_geral || "");
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
      if (error) { toast.error("Erro ao gerar resumo: " + error.message); setLoadingResumo(false); return; }
      if (data?.error) { toast.error(data.error); setLoadingResumo(false); return; }
      const result = data?.data;
      if (result) { setResumoSistema(result as ResumoSistema); toast.success("Resumo do sistema gerado!"); }
    } catch (err) { toast.error("Erro ao conectar com a IA"); console.error(err); }
    setLoadingResumo(false);
  };

  const marcarLido = async (id: string) => {
    await supabase.from("legislacao_alertas").update({ lido: true } as any).eq("id", id);
    fetchAlertas();
  };

  // ──── Normas logic ────

  const fetchNormas = async () => {
    if (!user) return;
    setNormasLoading(true);
    const { data } = await supabase
      .from("normas_legislacao")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNormas(data as unknown as NormaDB[]);
    setNormasLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingFile(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage.from("normas_legislacao").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar arquivo: " + error.message);
      setUploadingFile(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("normas_legislacao").getPublicUrl(path);

    setNormaForm(prev => ({
      ...prev,
      arquivo_nome: file.name,
      arquivo_url: urlData.publicUrl,
    }));
    toast.success("Arquivo enviado!");
    setUploadingFile(false);
  };

  const handleSaveNorma = async () => {
    if (!user || !normaForm.titulo.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }
    setSavingNorma(true);

    const payload = {
      user_id: user.id,
      titulo: normaForm.titulo,
      codigo: normaForm.codigo,
      tipo: normaForm.tipo,
      orgao: normaForm.orgao,
      data_publicacao: normaForm.data_publicacao || null,
      resumo: normaForm.resumo,
      arquivo_nome: normaForm.arquivo_nome,
      arquivo_url: normaForm.arquivo_url,
      tags: normaForm.tags ? normaForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };

    const { error } = await supabase.from("normas_legislacao").insert(payload as any);
    if (error) { toast.error("Erro: " + error.message); }
    else {
      toast.success("Norma salva com sucesso!");
      setNormaDialogOpen(false);
      resetNormaForm();
      fetchNormas();
    }
    setSavingNorma(false);
  };

  const handleDeleteNorma = async (id: string) => {
    const { error } = await supabase.from("normas_legislacao").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Norma excluída."); fetchNormas(); }
  };

  const resetNormaForm = () => {
    setNormaForm({ titulo: "", codigo: "", tipo: "instrucao_normativa", orgao: "MAPA", data_publicacao: "", resumo: "", arquivo_nome: "", arquivo_url: "", tags: "" });
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    setQuickUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      const safeName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("normas_legislacao").upload(path, file);
      if (uploadError) {
        toast.error(`Erro ao enviar "${file.name}": ${uploadError.message}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("normas_legislacao").getPublicUrl(path);
      const titulo = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const tipo = ext === "pdf" ? "instrucao_normativa" : "outro";

      const { error: insertError } = await supabase.from("normas_legislacao").insert({
        user_id: user.id,
        titulo,
        codigo: "",
        tipo,
        orgao: "MAPA",
        arquivo_nome: file.name,
        arquivo_url: urlData.publicUrl,
        tags: [],
      } as any);

      if (insertError) {
        toast.error(`Erro ao salvar "${file.name}": ${insertError.message}`);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) importado(s) com sucesso!`);
      fetchNormas();
    }
    setQuickUploading(false);
    if (quickUploadRef.current) quickUploadRef.current.value = "";
  };

  const filteredNormas = normas.filter(n => {
    if (!normaSearch) return true;
    const q = normaSearch.toLowerCase();
    return (
      n.titulo.toLowerCase().includes(q) ||
      (n.codigo || "").toLowerCase().includes(q) ||
      (n.orgao || "").toLowerCase().includes(q) ||
      (n.resumo || "").toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const naoLidos = alertas.filter(a => !a.lido).length;

  const tipoNormaLabel = (tipo: string) => TIPO_NORMA_OPTIONS.find(t => t.value === tipo)?.label || tipo;

  return (
    <>
      <PageHeader
        icon={Scale}
        title="Legislação & IA"
        description="Atualizações legislativas, biblioteca de normas e análise com IA"
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
          <p className="text-2xl font-bold font-display text-primary">{normas.length}</p>
          <p className="text-xs text-muted-foreground">Normas salvas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-info">{resumoSistema ? resumoSistema.modulos_implementados.length : "—"}</p>
          <p className="text-xs text-muted-foreground">Módulos analisados</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="normas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="normas">
            <BookOpen className="w-4 h-4 mr-1" />
            Biblioteca de Normas
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <Bell className="w-4 h-4 mr-1" />
            Alertas
            {naoLidos > 0 && <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">{naoLidos}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="resumo">
            <Sparkles className="w-4 h-4 mr-1" />
            Resumo IA
          </TabsTrigger>
        </TabsList>

        {/* ──── Tab: Biblioteca de Normas ──── */}
        <TabsContent value="normas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle className="font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Biblioteca de Normas e Legislações
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <input
                  ref={quickUploadRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  multiple
                  className="hidden"
                  onChange={handleQuickUpload}
                />
                <Button variant="outline" onClick={() => quickUploadRef.current?.click()} disabled={quickUploading}>
                  {quickUploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-1" />}
                  {quickUploading ? "Importando..." : "Importar do Dispositivo"}
                </Button>
                <Button onClick={() => { resetNormaForm(); setNormaDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Norma
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar normas por título, código, órgão ou tags..."
                  value={normaSearch}
                  onChange={(e) => setNormaSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {normasLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filteredNormas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{normaSearch ? "Nenhuma norma encontrada para esta pesquisa." : "Nenhuma norma cadastrada ainda."}</p>
                  <p className="text-sm mt-1">Clique em "Adicionar Norma" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Órgão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNormas.map((norma) => (
                      <TableRow key={norma.id}>
                        <TableCell className="font-mono text-xs font-medium">{norma.codigo || "—"}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-medium text-sm truncate">{norma.titulo}</p>
                          {norma.tags && norma.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {norma.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{tipoNormaLabel(norma.tipo || "")}</Badge></TableCell>
                        <TableCell className="text-xs">{norma.orgao}</TableCell>
                        <TableCell className="text-xs">{norma.data_publicacao || "—"}</TableCell>
                        <TableCell>
                          {norma.arquivo_url ? (
                            <a href={norma.arquivo_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                <span className="text-xs truncate max-w-[80px]">{norma.arquivo_nome || "Abrir"}</span>
                              </Button>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {norma.resumo && (
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAlerta({ titulo: norma.titulo, resumo: norma.resumo || "", fonte: norma.orgao || "", tipo: "nova_norma", relevancia: "media", data_aproximada: norma.data_publicacao || "" }); setDetailOpen(true); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteNorma(norma.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── Tab: Alertas ──── */}
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
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAlerta(alerta); setDetailOpen(true); }}>
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

        {/* ──── Tab: Resumo ──── */}
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
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Resumo Executivo
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{resumoSistema.resumo_executivo}</p>
                  </div>
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
                  {resumoSistema.recomendacoes?.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" /> Recomendações
                      </h3>
                      <ul className="space-y-2">
                        {resumoSistema.recomendacoes.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
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

      {/* ──── Detail Dialog (shared) ──── */}
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
                <p className="text-xs text-muted-foreground"><strong>Fonte:</strong> {(selectedAlerta as any).fonte}</p>
              )}
              {((selectedAlerta as any).data_publicacao || (selectedAlerta as any).data_aproximada) && (
                <p className="text-xs text-muted-foreground"><strong>Data:</strong> {(selectedAlerta as any).data_publicacao || (selectedAlerta as any).data_aproximada}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ──── Add Norma Dialog ──── */}
      <Dialog open={normaDialogOpen} onOpenChange={setNormaDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Norma / Legislação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Código</Label>
                <Input placeholder="Ex: IN 12/2004" value={normaForm.codigo} onChange={(e) => setNormaForm(prev => ({ ...prev, codigo: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Data de Publicação</Label>
                <Input type="date" value={normaForm.data_publicacao} onChange={(e) => setNormaForm(prev => ({ ...prev, data_publicacao: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Título *</Label>
              <Input placeholder="Ex: Instrução Normativa nº 12 – Suplementos para Bovinos" value={normaForm.titulo} onChange={(e) => setNormaForm(prev => ({ ...prev, titulo: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={normaForm.tipo} onValueChange={(v) => setNormaForm(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_NORMA_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Órgão</Label>
                <Select value={normaForm.orgao} onValueChange={(v) => setNormaForm(prev => ({ ...prev, orgao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORGAO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Resumo / Ementa</Label>
              <Textarea
                placeholder="Breve descrição do conteúdo da norma..."
                value={normaForm.resumo}
                onChange={(e) => setNormaForm(prev => ({ ...prev, resumo: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input placeholder="Ex: bovinos, suplemento, sal mineral, IN 12" value={normaForm.tags} onChange={(e) => setNormaForm(prev => ({ ...prev, tags: e.target.value }))} />
            </div>

            {/* File upload */}
            <div>
              <Label className="text-xs">Arquivo (PDF, DOCX, etc.)</Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileUpload} />
              <div className="flex gap-2 items-center mt-1">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                  {uploadingFile ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  {uploadingFile ? "Enviando..." : "Enviar do Computador"}
                </Button>
                {normaForm.arquivo_nome && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{normaForm.arquivo_nome}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setNormaForm(prev => ({ ...prev, arquivo_nome: "", arquivo_url: "" }))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* URL alternativa */}
            {!normaForm.arquivo_nome && (
              <div>
                <Label className="text-xs">Ou informe uma URL externa</Label>
                <Input placeholder="https://www.gov.br/..." value={normaForm.arquivo_url} onChange={(e) => setNormaForm(prev => ({ ...prev, arquivo_url: e.target.value, arquivo_nome: e.target.value ? "Link externo" : "" }))} />
              </div>
            )}

            <Button onClick={handleSaveNorma} disabled={savingNorma} className="w-full">
              {savingNorma ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Salvar Norma
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
