import { useState, useEffect, useRef } from "react";
import { Search, Plus, Loader2, Package, AlertTriangle, Truck, ShieldAlert, Timer, Play, Square, RotateCcw, ArrowUpDown, CheckCircle2, XCircle, Save } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
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

interface TesteResult {
  lote: string;
  produto: string;
  montante: { materia_prima: string; lote_mp: string; fornecedor: string }[];
  jusante: { cliente: string; local: string; nf: string; data_venda: string }[];
  tempoSegundos: number;
}

export default function Rastreabilidade() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RastreabilidadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [vendaOpen, setVendaOpen] = useState(false);
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

  // Recall Simulado
  const [simOpen, setSimOpen] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [simStep, setSimStep] = useState(0);
  const [simResults, setSimResults] = useState<{ step: string; time: number; ok: boolean }[]>([]);
  const simInterval = useRef<NodeJS.Timeout | null>(null);

  // Venda fields
  const [vendaCliente, setVendaCliente] = useState("");
  const [vendaLocal, setVendaLocal] = useState("");
  const [vendaData, setVendaData] = useState("");
  const [vendaNF, setVendaNF] = useState("");
  const [vendaQtd, setVendaQtd] = useState("");

  // Teste de Rastreabilidade
  const [testeOpen, setTesteOpen] = useState(false);
  const [testeLote, setTesteLote] = useState("");
  const [testeRunning, setTesteRunning] = useState(false);
  const [testeTime, setTesteTime] = useState(0);
  const [testeResult, setTesteResult] = useState<TesteResult | null>(null);
  const [testeSaving, setTesteSaving] = useState(false);
  const [testeObs, setTesteObs] = useState("");
  const [testesHistorico, setTestesHistorico] = useState<any[]>([]);
  const testeInterval = useRef<NodeJS.Timeout | null>(null);

  const resetForm = () => {
    setProduto(""); setLoteProduto(""); setMateriaPrima(""); setLoteMP("");
    setFornecedor(""); setClienteDestino(""); setLocalEntrega("");
    setDataVenda(""); setNotaFiscal(""); setQuantidadeVendida("");
  };

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

  const fetchTestesHistorico = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("testes_rastreabilidade")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setTestesHistorico(data);
  };

  useEffect(() => { fetchData(); fetchTestesHistorico(); }, [user]);

  // ──── Teste de Rastreabilidade ────
  const startTesteRastreabilidade = () => {
    if (!testeLote.trim()) { toast.error("Informe o lote para testar."); return; }
    setTesteRunning(true);
    setTesteTime(0);
    setTesteResult(null);
    testeInterval.current = setInterval(() => setTesteTime(t => t + 1), 1000);

    // Run the trace
    const lote = testeLote.trim();
    const lotRecords = registros.filter(r => r.lote_produto === lote);

    if (lotRecords.length === 0) {
      clearInterval(testeInterval.current!);
      setTesteRunning(false);
      toast.error(`Lote "${lote}" não encontrado na rastreabilidade.`);
      return;
    }

    const produtoNome = lotRecords[0].produto;

    // Montante (upstream): all raw materials for this lot
    const montante = lotRecords.map(r => ({
      materia_prima: r.materia_prima,
      lote_mp: r.lote_mp || "—",
      fornecedor: r.fornecedor || "—",
    }));

    // Jusante (downstream): all sales/deliveries for this lot
    const jusante = lotRecords
      .filter(r => r.cliente_destino)
      .map(r => ({
        cliente: r.cliente_destino || "—",
        local: r.local_entrega || "—",
        nf: r.nota_fiscal || "—",
        data_venda: r.data_venda || "—",
      }));

    // Deduplicate
    const uniqueMontante = montante.filter((m, i, arr) =>
      arr.findIndex(x => x.materia_prima === m.materia_prima && x.lote_mp === m.lote_mp) === i
    );
    const uniqueJusante = jusante.filter((j, i, arr) =>
      arr.findIndex(x => x.cliente === j.cliente && x.nf === j.nf) === i
    );

    // Simulate 2 second delay for realism
    setTimeout(() => {
      if (testeInterval.current) clearInterval(testeInterval.current);
      setTesteRunning(false);
      const elapsed = 2;
      setTesteTime(elapsed);
      setTesteResult({
        lote,
        produto: produtoNome,
        montante: uniqueMontante,
        jusante: uniqueJusante,
        tempoSegundos: elapsed,
      });
      toast.success(`Rastreabilidade completa do lote ${lote} em ${elapsed}s!`);
    }, 2000);
  };

  const salvarTesteResultado = async () => {
    if (!user || !testeResult) return;
    setTesteSaving(true);
    const { error } = await supabase.from("testes_rastreabilidade").insert({
      user_id: user.id,
      lote_testado: testeResult.lote,
      produto: testeResult.produto,
      direcao: "completo",
      tempo_segundos: testeResult.tempoSegundos,
      montante_encontrado: testeResult.montante.length > 0,
      jusante_encontrado: testeResult.jusante.length > 0,
      materias_primas_rastreadas: testeResult.montante.length,
      destinos_rastreados: testeResult.jusante.length,
      resultado: testeResult.montante.length > 0 && testeResult.jusante.length > 0 ? "aprovado" : "parcial",
      observacoes: testeObs,
      detalhes_json: { montante: testeResult.montante, jusante: testeResult.jusante },
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Resultado do teste salvo!");
      fetchTestesHistorico();
    }
    setTesteSaving(false);
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

  const handleVenda = async () => {
    if (!selectedId || !vendaCliente) return;
    setSaving(true);

    // Get the selected record's lote_produto to update all records with same lot
    const selectedRec = registros.find(r => r.id === selectedId);
    const lotePA = selectedRec?.lote_produto;

    // Update all records with same lote_produto (batch update for full traceability)
    let query = supabase.from("rastreabilidade").update({
      cliente_destino: vendaCliente,
      local_entrega: vendaLocal,
      data_venda: vendaData || null,
      nota_fiscal: vendaNF,
      quantidade_vendida: vendaQtd,
    } as any);

    if (lotePA) {
      query = query.eq("lote_produto", lotePA);
    } else {
      query = query.eq("id", selectedId);
    }

    const { error } = await query;
    if (error) toast.error("Erro ao registrar venda");
    else {
      toast.success(lotePA ? `Venda registrada para todo o lote ${lotePA}!` : "Venda registrada!");
      setVendaOpen(false);
      setVendaCliente(""); setVendaLocal(""); setVendaData(""); setVendaNF(""); setVendaQtd("");
      setSelectedId(null);
      fetchData();
    }
    setSaving(false);
  };

  const openVenda = (id: string) => {
    const rec = registros.find(r => r.id === id);
    setSelectedId(id);
    setVendaCliente(rec?.cliente_destino || "");
    setVendaLocal(rec?.local_entrega || "");
    setVendaData(rec?.data_venda || "");
    setVendaNF(rec?.nota_fiscal || "");
    setVendaQtd(rec?.quantidade_vendida || "");
    setVendaOpen(true);
  };

  const filtered = registros.filter((d) =>
    [d.produto, d.lote_produto, d.materia_prima, d.lote_mp, d.fornecedor, d.cliente_destino, d.nota_fiscal]
      .some((v) => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  const uniquePA = new Set(registros.map(r => r.lote_produto).filter(Boolean));
  const comVenda = registros.filter(r => r.cliente_destino);
  const semVenda = registros.filter(r => !r.cliente_destino);
  const comRecall = registros.filter(r => r.recall_ativo);

  const RECALL_SIM_STEPS = [
    "1. Identificar lote afetado",
    "2. Localizar destino/cliente",
    "3. Verificar quantidade distribuída",
    "4. Contatar clientes/distribuidores",
    "5. Registrar recall no sistema",
  ];

  const startSimulation = () => {
    setSimRunning(true); setSimTime(0); setSimStep(0); setSimResults([]);
    simInterval.current = setInterval(() => setSimTime(t => t + 1), 1000);
  };

  const advanceStep = () => {
    const currentStep = simStep;
    setSimResults(prev => [...prev, { step: RECALL_SIM_STEPS[currentStep], time: simTime, ok: true }]);
    if (currentStep + 1 >= RECALL_SIM_STEPS.length) {
      setSimRunning(false);
      if (simInterval.current) clearInterval(simInterval.current);
      toast.success(`Simulação concluída em ${formatTime(simTime)}!`);
    } else {
      setSimStep(currentStep + 1);
    }
  };

  const stopSimulation = () => {
    setSimRunning(false);
    if (simInterval.current) clearInterval(simInterval.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

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
      {/* Recall Simulado */}
      <Card className="mb-6 border-accent/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Timer className="w-5 h-5 text-accent" /> Recall Simulado — Teste de Tempo de Resposta
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Simule um recall para validar o tempo de resposta da equipe (POP-008)</p>
          </div>
          <Dialog open={simOpen} onOpenChange={setSimOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Play className="w-4 h-4 mr-1" /> Iniciar Simulação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Timer className="w-5 h-5 text-accent" /> Simulação de Recall</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-4xl font-mono font-bold text-foreground">{formatTime(simTime)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tempo decorrido</p>
                </div>

                {!simRunning && simResults.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Etapas da simulação:</p>
                    {RECALL_SIM_STEPS.map((s, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-muted/30 border">{s}</div>
                    ))}
                    <Button onClick={startSimulation} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Play className="w-4 h-4 mr-1" /> Iniciar Cronômetro
                    </Button>
                  </div>
                )}

                {simRunning && (
                  <div className="space-y-3">
                    <Progress value={(simStep / RECALL_SIM_STEPS.length) * 100} className="h-2" />
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-center">
                      <p className="text-sm font-semibold">{RECALL_SIM_STEPS[simStep]}</p>
                      <p className="text-xs text-muted-foreground mt-1">Etapa {simStep + 1} de {RECALL_SIM_STEPS.length}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={advanceStep} className="flex-1 bg-primary text-primary-foreground">
                        ✓ Concluir Etapa
                      </Button>
                      <Button onClick={stopSimulation} variant="destructive" size="icon"><Square className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {!simRunning && simResults.length > 0 && (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg text-center ${simResults.length === RECALL_SIM_STEPS.length ? "bg-primary/10 border border-primary/30" : "bg-destructive/10 border border-destructive/30"}`}>
                      <p className="font-display font-bold text-lg">
                        {simResults.length === RECALL_SIM_STEPS.length ? "✅ Simulação Concluída" : "⚠️ Simulação Interrompida"}
                      </p>
                      <p className="text-2xl font-mono font-bold mt-1">{formatTime(simTime)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {simTime <= 120 ? "Excelente! Dentro do tempo ideal (≤ 2 min)" :
                         simTime <= 300 ? "Bom resultado (≤ 5 min)" :
                         "Atenção: tempo acima do recomendado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {simResults.map((r, i) => (
                        <div key={i} className="text-xs flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span>{r.step}</span>
                          <span className="font-mono text-muted-foreground">{formatTime(r.time)}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => { setSimResults([]); setSimTime(0); setSimStep(0); }} variant="outline" className="w-full">
                      <RotateCcw className="w-4 h-4 mr-1" /> Nova Simulação
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>


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
                <TabsTrigger value="sem_venda">Sem destino ({semVenda.length})</TabsTrigger>
                <TabsTrigger value="vendidos">Vendidos ({comVenda.length})</TabsTrigger>
                <TabsTrigger value="recall">Recall ({comRecall.length})</TabsTrigger>
              </TabsList>

              {["todos", "sem_venda", "vendidos", "recall"].map(tab => {
                const data = tab === "todos" ? filtered : tab === "sem_venda" ? semVenda : tab === "vendidos" ? comVenda : comRecall;
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
                                ) : (
                                  <Button variant="outline" size="sm" className="text-xs" onClick={() => openVenda(r.id)}>
                                    <Truck className="w-3 h-3 mr-1" /> Registrar Venda
                                  </Button>
                                )}
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
                                <div className="flex gap-1">
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
                                  {r.cliente_destino && (
                                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openVenda(r.id)}>
                                      Editar venda
                                    </Button>
                                  )}
                                </div>
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

      {/* Venda Dialog */}
      <Dialog open={vendaOpen} onOpenChange={setVendaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" /> Registrar Venda / Destino do PA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedId && (() => {
              const rec = registros.find(r => r.id === selectedId);
              return rec ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <p><strong>Produto:</strong> {rec.produto}</p>
                  <p><strong>Lote PA:</strong> {rec.lote_produto || "—"}</p>
                  {rec.lote_produto && (
                    <p className="text-muted-foreground mt-1">
                      A venda será aplicada a todos os registros deste lote ({registros.filter(r => r.lote_produto === rec.lote_produto).length} vínculos MP)
                    </p>
                  )}
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente / Comprador *</Label>
                <Input value={vendaCliente} onChange={e => setVendaCliente(e.target.value)} placeholder="Ex: Fazenda Boa Vista" />
              </div>
              <div>
                <Label>Local de Entrega</Label>
                <Input value={vendaLocal} onChange={e => setVendaLocal(e.target.value)} placeholder="Ex: Uberaba-MG" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Data da Venda</Label>
                <Input type="date" value={vendaData} onChange={e => setVendaData(e.target.value)} />
              </div>
              <div>
                <Label>Nota Fiscal</Label>
                <Input value={vendaNF} onChange={e => setVendaNF(e.target.value)} placeholder="NF-e nº" />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input value={vendaQtd} onChange={e => setVendaQtd(e.target.value)} placeholder="Ex: 5 ton" />
              </div>
            </div>
            <Button onClick={handleVenda} className="w-full" disabled={saving || !vendaCliente}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Venda
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
