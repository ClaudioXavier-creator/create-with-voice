import { useState, useEffect } from "react";
import { Search, Plus, Loader2, Package, AlertTriangle, Truck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RastreabilidadeRow {
  id: string;
  produto: string;
  lote_produto: string | null;
  materia_prima: string;
  lote_mp: string | null;
  fornecedor: string | null;
  cliente_destino: string | null;
  local_entrega: string | null;
  data_venda: string | null;
  nota_fiscal: string | null;
  quantidade_vendida: string | null;
  recall_ativo: boolean | null;
  recall_motivo: string | null;
  recall_data: string | null;
  recall_status: string | null;
}

export default function Rastreabilidade() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RastreabilidadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form fields
  const [produto, setProduto] = useState("");
  const [loteProduto, setLoteProduto] = useState("");
  const [materiaPrima, setMateriaPrima] = useState("");
  const [loteMP, setLoteMP] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [clienteDestino, setClienteDestino] = useState("");
  const [localEntrega, setLocalEntrega] = useState("");
  const [dataVenda, setDataVenda] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [quantidadeVendida, setQuantidadeVendida] = useState("");

  // Recall fields
  const [recallMotivo, setRecallMotivo] = useState("");
  const [recallData, setRecallData] = useState("");
  const [recallStatus, setRecallStatus] = useState("iniciado");

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("rastreabilidade")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar dados");
    else setRegistros((data as unknown as RastreabilidadeRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const resetForm = () => {
    setProduto(""); setLoteProduto(""); setMateriaPrima(""); setLoteMP("");
    setFornecedor(""); setClienteDestino(""); setLocalEntrega("");
    setDataVenda(""); setNotaFiscal(""); setQuantidadeVendida("");
  };

  const handleAdd = async () => {
    if (!produto || !materiaPrima || !user) return;
    setSaving(true);
    const { error } = await supabase.from("rastreabilidade").insert({
      user_id: user.id,
      produto,
      lote_produto: loteProduto,
      materia_prima: materiaPrima,
      lote_mp: loteMP,
      fornecedor,
      cliente_destino: clienteDestino,
      local_entrega: localEntrega,
      data_venda: dataVenda || null,
      nota_fiscal: notaFiscal,
      quantidade_vendida: quantidadeVendida,
    } as any);
    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Registro salvo!");
      setOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleRecall = async () => {
    if (!selectedId || !recallMotivo) return;
    setSaving(true);
    const { error } = await supabase.from("rastreabilidade").update({
      recall_ativo: true,
      recall_motivo: recallMotivo,
      recall_data: recallData || new Date().toISOString().split("T")[0],
      recall_status: recallStatus,
    } as any).eq("id", selectedId);
    if (error) {
      toast.error("Erro ao registrar recall");
    } else {
      toast.success("Recall registrado!");
      setRecallOpen(false);
      setRecallMotivo(""); setRecallData(""); setRecallStatus("iniciado");
      setSelectedId(null);
      fetchData();
    }
    setSaving(false);
  };

  const filtered = registros.filter((d) =>
    [d.produto, d.lote_produto, d.materia_prima, d.lote_mp, d.fornecedor, d.cliente_destino, d.nota_fiscal]
      .some((v) => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  const uniquePA = new Set(registros.map(r => r.lote_produto).filter(Boolean));
  const comVenda = registros.filter(r => r.cliente_destino);
  const comRecall = registros.filter(r => r.recall_ativo);

  return (
    <>
      <PageHeader icon={Search} title="Rastreabilidade" description="Cadeia completa: MP → PA → Venda/Entrega → Recall" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{registros.length}</p>
          <p className="text-xs text-muted-foreground">Vínculos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Package className="w-5 h-5 text-primary" /></div>
          <p className="text-2xl font-bold font-display text-primary">{uniquePA.size}</p>
          <p className="text-xs text-muted-foreground">Lotes PA</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Truck className="w-5 h-5 text-accent" /></div>
          <p className="text-2xl font-bold font-display text-accent">{comVenda.length}</p>
          <p className="text-xs text-muted-foreground">Com venda/entrega</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <p className="text-2xl font-bold font-display text-destructive">{comRecall.length}</p>
          <p className="text-xs text-muted-foreground">Em recall</p>
        </CardContent></Card>
      </div>

      {comRecall.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <h3 className="font-display font-semibold text-sm text-destructive">Produtos em Recall</h3>
            </div>
            <div className="space-y-2">
              {comRecall.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded bg-background border">
                  <div>
                    <span className="font-medium text-sm">{r.produto}</span>
                    <span className="text-xs text-muted-foreground ml-2">Lote: {r.lote_produto}</span>
                    <span className="text-xs text-muted-foreground ml-2">→ {r.cliente_destino || "N/I"}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {r.recall_status === "iniciado" ? "Iniciado" : r.recall_status === "em_andamento" ? "Em andamento" : "Concluído"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-display">Rastreabilidade Completa</CardTitle>
            <Input placeholder="Buscar por produto, lote, MP, fornecedor, cliente, NF..." value={busca} onChange={(e) => setBusca(e.target.value)} className="mt-2" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Registro de Rastreabilidade</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* MP Section */}
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs font-semibold text-accent mb-2">① Matéria-Prima (MP)</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Matéria-Prima *</Label>
                      <Input value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} placeholder="Ex: Milho grão" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Lote MP</Label>
                        <Input value={loteMP} onChange={e => setLoteMP(e.target.value)} placeholder="Ex: MC-2026-041" />
                      </div>
                      <div>
                        <Label>Fornecedor</Label>
                        <Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: AgroCorp" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PA Section */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-2">② Produto Acabado (PA)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Produto *</Label>
                      <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovino Engorda" required />
                    </div>
                    <div>
                      <Label>Lote do PA</Label>
                      <Input value={loteProduto} onChange={e => setLoteProduto(e.target.value)} placeholder="Ex: RBE-0320-01" />
                    </div>
                  </div>
                </div>

                {/* Venda/Entrega Section */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-semibold mb-2">③ Venda e Entrega</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Cliente / Comprador</Label>
                        <Input value={clienteDestino} onChange={e => setClienteDestino(e.target.value)} placeholder="Ex: Fazenda Boa Vista" />
                      </div>
                      <div>
                        <Label>Local de Entrega</Label>
                        <Input value={localEntrega} onChange={e => setLocalEntrega(e.target.value)} placeholder="Ex: Uberaba-MG" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Data da Venda</Label>
                        <Input type="date" value={dataVenda} onChange={e => setDataVenda(e.target.value)} />
                      </div>
                      <div>
                        <Label>Nota Fiscal</Label>
                        <Input value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} placeholder="NF-e nº" />
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input value={quantidadeVendida} onChange={e => setQuantidadeVendida(e.target.value)} placeholder="Ex: 5 ton" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAdd} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Registro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos ({filtered.length})</TabsTrigger>
                <TabsTrigger value="vendidos">Vendidos ({comVenda.length})</TabsTrigger>
                <TabsTrigger value="recall">Recall ({comRecall.length})</TabsTrigger>
              </TabsList>

              {["todos", "vendidos", "recall"].map(tab => {
                const data = tab === "todos" ? filtered : tab === "vendidos" ? comVenda : comRecall;
                return (
                  <TabsContent key={tab} value={tab} className="overflow-x-auto">
                    {data.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto / Lote PA</TableHead>
                            <TableHead>MP / Lote</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Cliente / Destino</TableHead>
                            <TableHead>NF / Data Venda</TableHead>
                            <TableHead>Recall</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.map((r) => (
                            <TableRow key={r.id} className={r.recall_ativo ? "bg-destructive/5" : ""}>
                              <TableCell>
                                <p className="font-medium text-sm">{r.produto}</p>
                                <Badge variant="outline" className="font-mono text-xs mt-1">{r.lote_produto || "—"}</Badge>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{r.materia_prima}</p>
                                <span className="font-mono text-xs text-muted-foreground">{r.lote_mp || "—"}</span>
                              </TableCell>
                              <TableCell className="text-sm">{r.fornecedor || "—"}</TableCell>
                              <TableCell>
                                {r.cliente_destino ? (
                                  <>
                                    <p className="text-sm font-medium">{r.cliente_destino}</p>
                                    <span className="text-xs text-muted-foreground">{r.local_entrega || ""}</span>
                                  </>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {r.nota_fiscal ? (
                                  <>
                                    <p className="text-xs font-mono">{r.nota_fiscal}</p>
                                    <span className="text-xs text-muted-foreground">{r.data_venda || ""}</span>
                                  </>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {r.recall_ativo ? (
                                  <Badge variant="destructive" className="text-xs">
                                    {r.recall_status === "concluido" ? "Concluído" : r.recall_status === "em_andamento" ? "Em andamento" : "Iniciado"}
                                  </Badge>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {!r.recall_ativo && r.cliente_destino && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive text-xs"
                                    onClick={() => { setSelectedId(r.id); setRecallOpen(true); }}
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Recall
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Recall Dialog */}
      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Registrar Recall / Recolhimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo do Recall *</Label>
              <Textarea value={recallMotivo} onChange={e => setRecallMotivo(e.target.value)} placeholder="Descreva o problema encontrado no produto..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data do Recall</Label>
                <Input type="date" value={recallData} onChange={e => setRecallData(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={recallStatus} onValueChange={setRecallStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciado">Iniciado</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleRecall} className="w-full" variant="destructive" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Recall
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
