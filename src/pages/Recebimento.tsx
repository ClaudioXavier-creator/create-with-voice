import { useState, useEffect } from "react";
import { Package, Plus, CheckCircle2, XCircle, Loader2, Search, FileText, Download, Truck, AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RecebimentoRow {
  id: string;
  data: string;
  fornecedor: string;
  materia_prima: string;
  lote: string | null;
  odor: string | null;
  umidade: string | null;
  insetos: string | null;
  aprovado: boolean | null;
  certificado_analise_numero: string | null;
  certificado_analise_url: string | null;
  certificado_analise_valido: boolean | null;
  validade: string | null;
  quantidade: string | null;
  unidade: string | null;
  temperatura: string | null;
  observacoes: string | null;
}

export default function Recebimento() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecebimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  // Form
  const [fornecedor, setFornecedor] = useState("");
  const [materiaPrima, setMateriaPrima] = useState("");
  const [lote, setLote] = useState("");
  const [odor, setOdor] = useState("normal");
  const [umidade, setUmidade] = useState("");
  const [insetos, setInsetos] = useState("ausente");
  const [temperatura, setTemperatura] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [validade, setValidade] = useState("");
  const [aprovado, setAprovado] = useState(true);
  const [certNumero, setCertNumero] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [certValido, setCertValido] = useState<boolean | null>(null);
  const [observacoes, setObservacoes] = useState("");

  // POP-05 Vehicle inspection
  const VISTORIA_ITENS = [
    "Carroceria limpa e seca",
    "Sem resíduos de cargas anteriores",
    "Sem odor estranho",
    "Lona/cobertura em bom estado",
    "Sem sinais de pragas",
    "Sem carga proibida anterior (proteína animal p/ ruminantes)",
    "Lacre íntegro",
    "Documentação de transporte completa",
  ];
  const [vistoriaVeiculo, setVistoriaVeiculo] = useState<Record<number, boolean | null>>({});
  const [placaVeiculo, setPlacaVeiculo] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("recebimento_mp")
      .select("*")
      .order("data", { ascending: false });
    if (!error && data) setItems(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const resetForm = () => {
    setFornecedor(""); setMateriaPrima(""); setLote(""); setOdor("normal");
    setUmidade(""); setInsetos("ausente"); setTemperatura(""); setQuantidade("");
    setUnidade("kg"); setValidade(""); setAprovado(true); setCertNumero("");
    setCertUrl(""); setCertValido(null); setObservacoes("");
    setVistoriaVeiculo({}); setPlacaVeiculo("");
  };

  const handleAdd = async () => {
    if (!fornecedor || !materiaPrima || !user) return;
    setSaving(true);

    // Build vehicle inspection obs
    let obsCompleta = observacoes;
    const vistoriaKeys = Object.keys(vistoriaVeiculo);
    if (vistoriaKeys.length > 0 || placaVeiculo) {
      const checkItems = VISTORIA_ITENS.map((item, i) => {
        const val = vistoriaVeiculo[i];
        return `${val === true ? "✅" : val === false ? "❌" : "⬜"} ${item}`;
      }).join("\n");
      const naoConformes = VISTORIA_ITENS.filter((_, i) => vistoriaVeiculo[i] === false).length;
      const vistoriaObs = `[VISTORIA VEÍCULO — POP-05 / IN 15/2009]\nPlaca: ${placaVeiculo || "N/I"}\n${checkItems}${naoConformes > 0 ? `\n⚠️ ${naoConformes} item(ns) não conforme(s)` : "\n✅ Veículo aprovado"}`;
      obsCompleta = vistoriaObs + (observacoes ? `\n\n${observacoes}` : "");
    }

    const { error } = await supabase.from("recebimento_mp").insert({
      user_id: user.id,
      fornecedor,
      materia_prima: materiaPrima,
      lote: lote || null,
      odor: odor || null,
      umidade: umidade || null,
      insetos: insetos || null,
      aprovado,
      certificado_analise_numero: certNumero || null,
      certificado_analise_url: certUrl || null,
      certificado_analise_valido: certValido,
      validade: validade || null,
      quantidade: quantidade || null,
      unidade: unidade || null,
      temperatura: temperatura || null,
      observacoes: obsCompleta || null,
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Recebimento registrado!");
      setOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ["Data", "Fornecedor", "Matéria-Prima", "Lote", "Quantidade", "Unidade", "Odor", "Umidade", "Temperatura", "Insetos", "Aprovado", "Cert. Análise Nº", "Cert. Válido", "Validade", "Observações"];
    const rows = items.map(r => [
      r.data, r.fornecedor, r.materia_prima, r.lote || "", r.quantidade || "", r.unidade || "",
      r.odor || "", r.umidade || "", r.temperatura || "", r.insetos || "",
      r.aprovado ? "Sim" : "Não", r.certificado_analise_numero || "",
      r.certificado_analise_valido === true ? "Sim" : r.certificado_analise_valido === false ? "Não" : "",
      r.validade || "", r.observacoes || "",
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `recebimento_mp_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const filtered = items.filter(r =>
    [r.fornecedor, r.materia_prima, r.lote].some(v => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  const totalAprovados = items.filter(r => r.aprovado).length;
  const totalReprovados = items.filter(r => r.aprovado === false).length;
  const comCertificado = items.filter(r => r.certificado_analise_numero).length;

  return (
    <>
      <PageHeader icon={Package} title="Recebimento de Matérias-Primas" description="Controle de qualidade no recebimento — IN 15/2009" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total recebimentos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{totalAprovados}</p>
          <p className="text-xs text-muted-foreground">Aprovados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{totalReprovados}</p>
          <p className="text-xs text-muted-foreground">Reprovados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{comCertificado}</p>
          <p className="text-xs text-muted-foreground">C/ Certificado</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Registros de Recebimento</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Recebimento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registrar Recebimento de MP</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fornecedor *</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
                    <div><Label>Matéria-Prima *</Label><Input value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Lote</Label><Input value={lote} onChange={e => setLote(e.target.value)} /></div>
                    <div><Label>Quantidade</Label><Input value={quantidade} onChange={e => setQuantidade(e.target.value)} /></div>
                    <div>
                      <Label>Unidade</Label>
                      <Select value={unidade} onValueChange={setUnidade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="ton">ton</SelectItem>
                          <SelectItem value="sacos">sacos</SelectItem>
                          <SelectItem value="litros">litros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Odor</Label>
                      <Select value={odor} onValueChange={setOdor}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alterado">Alterado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Umidade (%)</Label><Input value={umidade} onChange={e => setUmidade(e.target.value)} /></div>
                    <div><Label>Temperatura (°C)</Label><Input value={temperatura} onChange={e => setTemperatura(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Insetos</Label>
                      <Select value={insetos} onValueChange={setInsetos}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ausente">Ausente</SelectItem>
                          <SelectItem value="presente">Presente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Validade</Label><Input value={validade} onChange={e => setValidade(e.target.value)} placeholder="Ex: 12 meses" /></div>
                  </div>

                   {/* Certificado de Análise / Laudo de Conformidade */}
                   <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Laudo de Conformidade do Fornecedor (Art. 12 — Decreto 12.031/2024)</p>
                     <div className="grid grid-cols-2 gap-3">
                       <div><Label>Nº do Certificado / Laudo</Label><Input value={certNumero} onChange={e => setCertNumero(e.target.value)} placeholder="Ex: CA-2026-0321" /></div>
                       <div><Label>URL / Link do Laudo</Label><Input value={certUrl} onChange={e => setCertUrl(e.target.value)} placeholder="https://..." /></div>
                     </div>
                     <div>
                       <Label>Anexar Laudo (PDF, imagem)</Label>
                       <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file || !user) return;
                         const filePath = `${user.id}/laudos/${Date.now()}_${file.name}`;
                         const { error: uploadErr } = await supabase.storage.from("documentos_bpf").upload(filePath, file);
                         if (uploadErr) { toast.error("Erro no upload: " + uploadErr.message); return; }
                         const { data: urlData } = supabase.storage.from("documentos_bpf").getPublicUrl(filePath);
                         setCertUrl(urlData.publicUrl);
                         toast.success("Laudo anexado com sucesso!");
                       }} />
                       {certUrl && certUrl.startsWith("http") && (
                         <a href={certUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 inline-block">
                           📎 Ver laudo anexado
                         </a>
                       )}
                     </div>
                     <div className="flex items-center gap-3">
                       <Switch checked={certValido === true} onCheckedChange={(v) => setCertValido(v ? true : false)} />
                       <Label className="text-sm">Certificado conforme / válido</Label>
                     </div>
                   </div>

                   {/* POP-05 Vehicle Inspection */}
                   <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Vistoria de Veículo — POP-05 (IN 15/2009)</p>
                     <p className="text-[10px] text-muted-foreground">Avalie as condições do veículo de transporte antes de descarregar.</p>
                     <div><Label>Placa do Veículo</Label><Input value={placaVeiculo} onChange={e => setPlacaVeiculo(e.target.value)} placeholder="Ex: ABC-1234" /></div>
                     <div className="space-y-1.5">
                       {VISTORIA_ITENS.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-background border text-xs">
                           <div className="flex gap-1 shrink-0">
                             <button type="button" onClick={() => setVistoriaVeiculo(p => ({ ...p, [idx]: p[idx] === true ? null : true }))}
                               className={`w-6 h-6 rounded text-xs font-bold border ${vistoriaVeiculo[idx] === true ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 hover:border-primary/50"}`}>✓</button>
                             <button type="button" onClick={() => setVistoriaVeiculo(p => ({ ...p, [idx]: p[idx] === false ? null : false }))}
                               className={`w-6 h-6 rounded text-xs font-bold border ${vistoriaVeiculo[idx] === false ? "bg-destructive text-destructive-foreground border-destructive" : "border-muted-foreground/30 hover:border-destructive/50"}`}>✗</button>
                           </div>
                           <span className="leading-tight">{item}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={aprovado} onCheckedChange={setAprovado} />
                    <Label className="text-sm font-medium">Matéria-prima aprovada</Label>
                  </div>

                  <div><Label>Observações</Label><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} /></div>

                  <Button onClick={handleAdd} className="w-full" disabled={saving || !fornecedor || !materiaPrima}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Registrar Recebimento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar fornecedor, MP, lote..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum recebimento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Matéria-Prima</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Odor</TableHead>
                    <TableHead>Umidade</TableHead>
                    <TableHead>Insetos</TableHead>
                    <TableHead>Cert. Análise</TableHead>
                    <TableHead>Aprovado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data}</TableCell>
                      <TableCell>{r.fornecedor}</TableCell>
                      <TableCell>{r.materia_prima}</TableCell>
                      <TableCell className="font-mono text-sm">{r.lote || "—"}</TableCell>
                      <TableCell>{r.quantidade ? `${r.quantidade} ${r.unidade || ""}` : "—"}</TableCell>
                      <TableCell><Badge variant={r.odor === "normal" ? "default" : "destructive"}>{r.odor || "—"}</Badge></TableCell>
                      <TableCell>{r.umidade || "—"}</TableCell>
                      <TableCell><Badge variant={r.insetos === "ausente" ? "default" : "destructive"}>{r.insetos || "—"}</Badge></TableCell>
                      <TableCell>
                        {r.certificado_analise_numero ? (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span className="text-xs font-mono">{r.certificado_analise_numero}</span>
                            {r.certificado_analise_valido === true && <CheckCircle2 className="w-3 h-3 text-primary" />}
                            {r.certificado_analise_valido === false && <XCircle className="w-3 h-3 text-destructive" />}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{r.aprovado ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <XCircle className="w-5 h-5 text-destructive" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
