import { useState, useEffect } from "react";
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertTriangle, Factory, FlaskConical } from "lucide-react";
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

interface OrdemProd {
  id: string;
  numero_ordem: string;
  data_programada: string;
  produto: string;
  formula_nome: string;
  lote_produto: string | null;
  quantidade_programada: string | null;
  unidade: string | null;
  numero_batidas: number | null;
  peso_por_batida: string | null;
  prioridade: string | null;
  status: string | null;
  observacoes: string | null;
  tipo_ordem: string;
  ordem_origem_id: string | null;
  motivo_retrabalho: string | null;
  quantidade_sobra: string | null;
  destino_sobra: string | null;
}

interface FormulaItem {
  id: string;
  ordem_id: string;
  materia_prima: string;
  lote_mp: string | null;
  fornecedor: string | null;
  quantidade_formula: string | null;
  unidade: string | null;
  percentual: string | null;
}

interface Batida {
  id: string;
  ordem_id: string;
  numero_batida: number;
  operador: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  tempo_mistura_minutos: number | null;
  temperatura: string | null;
  status: string | null;
  observacoes: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  programada: { label: "Programada", className: "bg-muted text-muted-foreground" },
  em_producao: { label: "Em Produção", className: "bg-info/20 text-info" },
  concluida: { label: "Concluída", className: "bg-primary/20 text-primary" },
  cancelada: { label: "Cancelada", className: "bg-destructive/20 text-destructive" },
};

const prioridadeConfig: Record<string, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-primary/20 text-primary" },
  alta: { label: "Alta", className: "bg-yellow-500/20 text-yellow-700" },
  urgente: { label: "Urgente", className: "bg-destructive/20 text-destructive" },
};

export default function PCP() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemProd[]>([]);
  const [formulaItens, setFormulaItens] = useState<FormulaItem[]>([]);
  const [batidas, setBatidas] = useState<Batida[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedOrdem, setExpandedOrdem] = useState<string | null>(null);

  // Ordem form
  const [ordemOpen, setOrdemOpen] = useState(false);
  const [numOrdem, setNumOrdem] = useState("");
  const [produto, setProduto] = useState("");
  const [formulaNome, setFormulaNome] = useState("");
  const [lotePA, setLotePA] = useState("");
  const [qtdProgramada, setQtdProgramada] = useState("");
  const [numBatidas, setNumBatidas] = useState("1");
  const [pesoBatida, setPesoBatida] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [obsOrdem, setObsOrdem] = useState("");
  const [tipoOrdem, setTipoOrdem] = useState("normal");
  const [ordemOrigemId, setOrdemOrigemId] = useState("");
  const [motivoRetrabalho, setMotivoRetrabalho] = useState("");
  const [qtdSobra, setQtdSobra] = useState("");
  const [destinoSobra, setDestinoSobra] = useState("");

  // Formula item form
  const [itemOpen, setItemOpen] = useState(false);
  const [itemOrdemId, setItemOrdemId] = useState("");
  const [itemMP, setItemMP] = useState("");
  const [itemLoteMP, setItemLoteMP] = useState("");
  const [itemFornecedor, setItemFornecedor] = useState("");
  const [itemQtd, setItemQtd] = useState("");
  const [itemPerc, setItemPerc] = useState("");

  // Batida form
  const [batidaOpen, setBatidaOpen] = useState(false);
  const [batidaOrdemId, setBatidaOrdemId] = useState("");
  const [batidaNum, setBatidaNum] = useState("1");
  const [batidaOperador, setBatidaOperador] = useState("");
  const [batidaInicio, setBatidaInicio] = useState("");
  const [batidaFim, setBatidaFim] = useState("");
  const [batidaTempoMin, setBatidaTempoMin] = useState("");
  const [batidaTemp, setBatidaTemp] = useState("");
  const [batidaObs, setBatidaObs] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [ordensRes, itensRes, batidasRes] = await Promise.all([
      supabase.from("ordens_producao").select("*").order("data_programada", { ascending: false }),
      supabase.from("formula_itens").select("*").order("created_at"),
      supabase.from("batidas_producao").select("*").order("numero_batida"),
    ]);
    if (ordensRes.data) setOrdens(ordensRes.data as unknown as OrdemProd[]);
    if (itensRes.data) setFormulaItens(itensRes.data as unknown as FormulaItem[]);
    if (batidasRes.data) setBatidas(batidasRes.data as unknown as Batida[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddOrdem = async () => {
    if (!numOrdem || !produto || !user) return;
    setSaving(true);
    const { error } = await supabase.from("ordens_producao").insert({
      user_id: user.id,
      numero_ordem: numOrdem,
      produto,
      formula_nome: formulaNome,
      lote_produto: lotePA,
      quantidade_programada: qtdProgramada,
      numero_batidas: parseInt(numBatidas) || 1,
      peso_por_batida: pesoBatida,
      prioridade,
      observacoes: obsOrdem,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Ordem criada!");
      setOrdemOpen(false);
      setNumOrdem(""); setProduto(""); setFormulaNome(""); setLotePA(""); setQtdProgramada("");
      setNumBatidas("1"); setPesoBatida(""); setPrioridade("normal"); setObsOrdem("");
      fetchData();
    }
    setSaving(false);
  };

  const handleAddItem = async () => {
    if (!itemMP || !itemOrdemId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("formula_itens").insert({
      user_id: user.id,
      ordem_id: itemOrdemId,
      materia_prima: itemMP,
      lote_mp: itemLoteMP,
      fornecedor: itemFornecedor,
      quantidade_formula: itemQtd,
      percentual: itemPerc,
    } as any);
    if (error) toast.error("Erro ao salvar ingrediente");
    else {
      toast.success("Ingrediente adicionado!");
      setItemOpen(false);
      setItemMP(""); setItemLoteMP(""); setItemFornecedor(""); setItemQtd(""); setItemPerc("");
      fetchData();
    }
    setSaving(false);
  };

  const handleAddBatida = async () => {
    if (!batidaOrdemId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("batidas_producao").insert({
      user_id: user.id,
      ordem_id: batidaOrdemId,
      numero_batida: parseInt(batidaNum) || 1,
      operador: batidaOperador,
      hora_inicio: batidaInicio || null,
      hora_fim: batidaFim || null,
      tempo_mistura_minutos: batidaTempoMin ? parseInt(batidaTempoMin) : null,
      temperatura: batidaTemp,
      status: "concluida",
      observacoes: batidaObs,
    } as any);
    if (error) toast.error("Erro ao salvar batida");
    else {
      toast.success("Batida registrada!");
      setBatidaOpen(false);
      setBatidaNum("1"); setBatidaOperador(""); setBatidaInicio(""); setBatidaFim("");
      setBatidaTempoMin(""); setBatidaTemp(""); setBatidaObs("");
      fetchData();
    }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!user) return;
    const { error } = await supabase.from("ordens_producao").update({ status: newStatus } as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }

    // Auto-create rastreabilidade records when order is concluded
    if (newStatus === "concluida") {
      const ordem = ordens.find(o => o.id === id);
      const itens = formulaItens.filter(i => i.ordem_id === id);
      if (ordem && itens.length > 0) {
        const records = itens.map(item => ({
          user_id: user.id,
          produto: ordem.produto,
          lote_produto: ordem.lote_produto || "",
          materia_prima: item.materia_prima,
          lote_mp: item.lote_mp || "",
          fornecedor: item.fornecedor || "",
        }));
        const { error: rastError } = await supabase.from("rastreabilidade").insert(records as any);
        if (rastError) {
          toast.warning("Ordem concluída, mas erro ao vincular rastreabilidade: " + rastError.message);
        } else {
          toast.success(`Ordem concluída! ${records.length} vínculo(s) de rastreabilidade criados automaticamente.`);
          fetchData();
          return;
        }
      }
    }
    toast.success("Status atualizado!");
    fetchData();
  };

  const openAddItem = (ordemId: string) => { setItemOrdemId(ordemId); setItemOpen(true); };
  const openAddBatida = (ordemId: string) => {
    const existing = batidas.filter(b => b.ordem_id === ordemId);
    setBatidaOrdemId(ordemId);
    setBatidaNum(String(existing.length + 1));
    setBatidaOpen(true);
  };

  const programadas = ordens.filter(o => o.status === "programada").length;
  const emProducao = ordens.filter(o => o.status === "em_producao").length;
  const concluidas = ordens.filter(o => o.status === "concluida").length;

  if (loading) return (
    <>
      <PageHeader icon={ClipboardList} title="PCP — Ordens de Produção" description="Planejamento e controle de produção com fórmulas, batidas e rastreabilidade de lotes" />
      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
    </>
  );

  return (
    <>
      <PageHeader icon={ClipboardList} title="PCP — Ordens de Produção" description="Planejamento e controle de produção com fórmulas, batidas e rastreabilidade de lotes" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{ordens.length}</p>
          <p className="text-xs text-muted-foreground">Total ordens</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{programadas}</p>
          <p className="text-xs text-muted-foreground">Programadas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-info">{emProducao}</p>
          <p className="text-xs text-muted-foreground">Em produção</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{concluidas}</p>
          <p className="text-xs text-muted-foreground">Concluídas</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Ordens de Produção</CardTitle>
          <Dialog open={ordemOpen} onOpenChange={setOrdemOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Ordem</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova Ordem de Produção</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nº Ordem</Label>
                    <Input value={numOrdem} onChange={e => setNumOrdem(e.target.value)} placeholder="OP-001" />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Produto</Label>
                  <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovinos Confinamento 22%" />
                </div>
                <div>
                  <Label>Fórmula / Nome da Receita</Label>
                  <Input value={formulaNome} onChange={e => setFormulaNome(e.target.value)} placeholder="Ex: FORMULA-RC-22" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Lote do PA</Label>
                    <Input value={lotePA} onChange={e => setLotePA(e.target.value)} placeholder="Ex: L2026-0321" />
                  </div>
                  <div>
                    <Label>Quantidade Programada</Label>
                    <Input value={qtdProgramada} onChange={e => setQtdProgramada(e.target.value)} placeholder="Ex: 10000 kg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nº de Batidas</Label>
                    <Input type="number" value={numBatidas} onChange={e => setNumBatidas(e.target.value)} min="1" />
                  </div>
                  <div>
                    <Label>Peso por Batida (kg)</Label>
                    <Input value={pesoBatida} onChange={e => setPesoBatida(e.target.value)} placeholder="Ex: 2000" />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={obsOrdem} onChange={e => setObsOrdem(e.target.value)} placeholder="Observações..." />
                </div>
                <Button onClick={handleAddOrdem} className="w-full" disabled={saving || !numOrdem || !produto}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Ordem
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {ordens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma ordem de produção registrada</p>
          ) : (
            <div className="space-y-3">
              {ordens.map((o) => {
                const st = statusConfig[o.status || "programada"];
                const pr = prioridadeConfig[o.prioridade || "normal"];
                const itens = formulaItens.filter(i => i.ordem_id === o.id);
                const bats = batidas.filter(b => b.ordem_id === o.id);
                const isExpanded = expandedOrdem === o.id;

                return (
                  <div key={o.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedOrdem(isExpanded ? null : o.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div>
                          <p className="font-mono text-sm font-bold">{o.numero_ordem}</p>
                          <p className="text-xs text-muted-foreground">{o.data_programada}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{o.produto}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.formula_nome} {o.lote_produto && `• Lote: ${o.lote_produto}`}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={pr.className}>{pr.label}</Badge>
                          <Badge className={st.className}>{st.label}</Badge>
                          <span className="text-xs text-muted-foreground">{itens.length} ing. • {bats.length}/{o.numero_batidas} bat.</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-2 shrink-0" /> : <ChevronDown className="w-4 h-4 ml-2 shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t p-4 bg-muted/10">
                        <Tabs defaultValue="formula" className="space-y-3">
                          <div className="flex items-center justify-between">
                            <TabsList>
                              <TabsTrigger value="formula"><FlaskConical className="w-3 h-3 mr-1" /> Fórmula ({itens.length})</TabsTrigger>
                              <TabsTrigger value="batidas"><Factory className="w-3 h-3 mr-1" /> Batidas ({bats.length})</TabsTrigger>
                            </TabsList>
                            <div className="flex gap-2">
                              <Select value={o.status || "programada"} onValueChange={(v) => handleUpdateStatus(o.id, v)}>
                                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="programada">Programada</SelectItem>
                                  <SelectItem value="em_producao">Em Produção</SelectItem>
                                  <SelectItem value="concluida">Concluída</SelectItem>
                                  <SelectItem value="cancelada">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <TabsContent value="formula">
                            <div className="space-y-2">
                              {itens.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Matéria-Prima</TableHead>
                                      <TableHead>Lote MP</TableHead>
                                      <TableHead>Fornecedor</TableHead>
                                      <TableHead>Qtd (kg)</TableHead>
                                      <TableHead>%</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {itens.map(item => (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.materia_prima}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.lote_mp}</TableCell>
                                        <TableCell className="text-xs">{item.fornecedor}</TableCell>
                                        <TableCell>{item.quantidade_formula}</TableCell>
                                        <TableCell>{item.percentual}%</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">Nenhum ingrediente cadastrado</p>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openAddItem(o.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Adicionar Ingrediente
                              </Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="batidas">
                            <div className="space-y-2">
                              {bats.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Batida</TableHead>
                                      <TableHead>Operador</TableHead>
                                      <TableHead>Início</TableHead>
                                      <TableHead>Fim</TableHead>
                                      <TableHead>Tempo (min)</TableHead>
                                      <TableHead>Temp.</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Obs.</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {bats.map(b => (
                                      <TableRow key={b.id}>
                                        <TableCell className="font-bold">#{b.numero_batida}</TableCell>
                                        <TableCell>{b.operador}</TableCell>
                                        <TableCell className="font-mono text-xs">{b.hora_inicio || "—"}</TableCell>
                                        <TableCell className="font-mono text-xs">{b.hora_fim || "—"}</TableCell>
                                        <TableCell>{b.tempo_mistura_minutos ?? "—"}</TableCell>
                                        <TableCell>{b.temperatura || "—"}</TableCell>
                                        <TableCell>
                                          <Badge className={b.status === "concluida" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                                            {b.status === "concluida" ? "Concluída" : "Pendente"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[120px] truncate">{b.observacoes}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">Nenhuma batida registrada</p>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openAddBatida(o.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Registrar Batida
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {o.observacoes && (
                          <div className="mt-3 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                            <strong>Obs:</strong> {o.observacoes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Ingrediente */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Ingrediente à Fórmula</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Matéria-Prima</Label>
              <Input value={itemMP} onChange={e => setItemMP(e.target.value)} placeholder="Ex: Milho grão" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lote da MP</Label>
                <Input value={itemLoteMP} onChange={e => setItemLoteMP(e.target.value)} placeholder="Ex: LMP-2026-045" />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={itemFornecedor} onChange={e => setItemFornecedor(e.target.value)} placeholder="Nome do fornecedor" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade (kg)</Label>
                <Input value={itemQtd} onChange={e => setItemQtd(e.target.value)} placeholder="Ex: 500" />
              </div>
              <div>
                <Label>Percentual (%)</Label>
                <Input value={itemPerc} onChange={e => setItemPerc(e.target.value)} placeholder="Ex: 25" />
              </div>
            </div>
            <Button onClick={handleAddItem} className="w-full" disabled={saving || !itemMP}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Batida */}
      <Dialog open={batidaOpen} onOpenChange={setBatidaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Batida de Produção</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nº da Batida</Label>
                <Input type="number" value={batidaNum} onChange={e => setBatidaNum(e.target.value)} min="1" />
              </div>
              <div>
                <Label>Operador</Label>
                <Input value={batidaOperador} onChange={e => setBatidaOperador(e.target.value)} placeholder="Nome do operador" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora Início</Label>
                <Input type="time" value={batidaInicio} onChange={e => setBatidaInicio(e.target.value)} />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input type="time" value={batidaFim} onChange={e => setBatidaFim(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tempo Mistura (min)</Label>
                <Input type="number" value={batidaTempoMin} onChange={e => setBatidaTempoMin(e.target.value)} placeholder="Ex: 5" />
              </div>
              <div>
                <Label>Temperatura (°C)</Label>
                <Input value={batidaTemp} onChange={e => setBatidaTemp(e.target.value)} placeholder="Ex: 25" />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={batidaObs} onChange={e => setBatidaObs(e.target.value)} placeholder="Anotações da batida..." />
            </div>
            <Button onClick={handleAddBatida} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Batida
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
