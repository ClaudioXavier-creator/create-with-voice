import { useState, useEffect } from "react";
import { Package, Plus, CheckCircle2, XCircle, Loader2, Search, FileText, Download, Truck, AlertTriangle, ShieldAlert } from "lucide-react";
import { registrarAuditLog } from "@/utils/auditLog";
import { gerarHashIntegridade, adicionarRodapeIntegridade } from "@/utils/integridade";
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

  // Registro do Produto no MAPA — IN 15/2009
  const [registroMapaProduto, setRegistroMapaProduto] = useState("");
  const [registroMapaIsento, setRegistroMapaIsento] = useState(false);

  // Segregação de Origem Animal — IN 15/2009
  const [contemOrigemAnimal, setContemOrigemAnimal] = useState(false);
  const [tipoOrigemAnimal, setTipoOrigemAnimal] = useState("");
  const [destinoEspecie, setDestinoEspecie] = useState("");

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
  const [lacreNumero, setLacreNumero] = useState("");
  const [lacreIntegro, setLacreIntegro] = useState("");
  const [condicoesTransporte, setCondicoesTransporte] = useState("");

  // Temperatura do Veículo e Integridade da Carga — IN 04/2007 (Origem Animal)
  const [temperaturaVeiculo, setTemperaturaVeiculo] = useState("");
  const [integridadeCarga, setIntegridadeCarga] = useState("");
  const [cargaOrigemAnimal, setCargaOrigemAnimal] = useState(false);

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
    setVistoriaVeiculo({}); setPlacaVeiculo(""); setLacreNumero(""); setLacreIntegro(""); setCondicoesTransporte("");
    setContemOrigemAnimal(false); setTipoOrigemAnimal(""); setDestinoEspecie("");
    setRegistroMapaProduto(""); setRegistroMapaIsento(false);
    setTemperaturaVeiculo(""); setIntegridadeCarga(""); setCargaOrigemAnimal(false);
  };

  const handleAdd = async () => {
    if (!fornecedor || !materiaPrima || !user) return;
    setSaving(true);

    // Build vehicle inspection obs
    let obsCompleta = observacoes;
    const vistoriaKeys = Object.keys(vistoriaVeiculo);
    if (vistoriaKeys.length > 0 || placaVeiculo || lacreNumero) {
      const checkItems = VISTORIA_ITENS.map((item, i) => {
        const val = vistoriaVeiculo[i];
        return `${val === true ? "✅" : val === false ? "❌" : "⬜"} ${item}`;
      }).join("\n");
      const naoConformes = VISTORIA_ITENS.filter((_, i) => vistoriaVeiculo[i] === false).length;
      const lacreInfo = `Lacre Nº: ${lacreNumero || "N/I"} | Status: ${lacreIntegro === "integro" ? "Íntegro" : lacreIntegro === "violado" ? "VIOLADO ⚠️" : lacreIntegro === "sem_lacre" ? "Sem lacre ⚠️" : "N/I"}`;
      const transporteInfo = `Condições Transporte: ${condicoesTransporte === "adequado" ? "Adequado" : condicoesTransporte === "parcial" ? "Parcialmente adequado ⚠️" : condicoesTransporte === "inadequado" ? "INADEQUADO ⚠️" : "N/I"}`;
      const vistoriaObs = `[VISTORIA VEÍCULO — POP-01 / IN 15/2009]\nPlaca: ${placaVeiculo || "N/I"}\n${lacreInfo}\n${transporteInfo}\n${checkItems}${naoConformes > 0 ? `\n⚠️ ${naoConformes} item(ns) não conforme(s)` : "\n✅ Veículo aprovado"}`;
      obsCompleta = vistoriaObs + (observacoes ? `\n\n${observacoes}` : "");
    }

    // Temperatura do Veículo e Integridade da Carga — IN 04/2007
    if (cargaOrigemAnimal || temperaturaVeiculo || integridadeCarga) {
      const tempVeicObs = `[INSPEÇÃO CARGA ORIGEM ANIMAL — IN 04/2007]\nTemperatura do veículo: ${temperaturaVeiculo ? temperaturaVeiculo + " °C" : "N/I"}\nIntegridade da carga: ${integridadeCarga === "integra" ? "Íntegra" : integridadeCarga === "parcial" ? "Parcialmente comprometida ⚠️" : integridadeCarga === "comprometida" ? "COMPROMETIDA ❌" : "N/I"}${cargaOrigemAnimal ? "\n⚠️ Produto de ORIGEM ANIMAL — verificação obrigatória" : ""}`;
      obsCompleta = (obsCompleta ? obsCompleta + "\n\n" : "") + tempVeicObs;
    }

    // Registro MAPA do Produto — IN 15/2009
    if (registroMapaProduto || registroMapaIsento) {
      const regObs = `[REGISTRO MAPA DO PRODUTO — IN 15/2009]\n${registroMapaIsento ? "Produto ISENTO de registro no MAPA" : `Nº Registro: ${registroMapaProduto}`}`;
      obsCompleta = (obsCompleta ? obsCompleta + "\n\n" : "") + regObs;
    }

    // Segregação Origem Animal
    if (contemOrigemAnimal) {
      const segregObs = `[SEGREGAÇÃO ORIGEM ANIMAL — IN 15/2009]\nTipo: ${tipoOrigemAnimal || "N/I"}\nEspécie destino: ${destinoEspecie || "N/I"}${destinoEspecie === "bovinos" ? "\n⚠️ ALERTA EEB: Proteína animal proibida para ruminantes!" : ""}`;
      obsCompleta = (obsCompleta ? obsCompleta + "\n\n" : "") + segregObs;
    }

    // Contraprova
    const cpQtd = (document.getElementById("cp-qtd") as HTMLInputElement)?.value || "";
    const cpLocal = (document.getElementById("cp-local") as HTMLInputElement)?.value || "";
    const cpVal = (document.getElementById("cp-val") as HTMLInputElement)?.value || "";
    const cpRetida = !!(cpQtd || cpLocal);
    if (cpRetida) {
      const cpObs = `[CONTRAPROVA — IN 17/2017]\nQuantidade: ${cpQtd || "N/I"} | Local: ${cpLocal || "N/I"} | Validade retenção: ${cpVal || "N/I"}`;
      obsCompleta = (obsCompleta ? obsCompleta + "\n\n" : "") + cpObs;
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
      contraprova_retida: cpRetida,
      contraprova_local: cpLocal,
      contraprova_validade: cpVal,
      contraprova_quantidade: cpQtd,
      // Campos persistidos no DB — IN 15/2009 & IN 04/2007
      registro_mapa_produto: registroMapaIsento ? "ISENTO" : (registroMapaProduto || ""),
      registro_mapa_isento: registroMapaIsento,
      temperatura_veiculo: temperaturaVeiculo || "",
      integridade_carga: integridadeCarga !== "comprometida",
      integridade_observacoes: integridadeCarga === "comprometida" ? "Carga comprometida — NC obrigatória" : (integridadeCarga === "parcial" ? "Parcialmente comprometida" : ""),
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Recebimento registrado!");
      registrarAuditLog({
        userId: user.id, tabela: "recebimento_mp", acao: "criar",
        dadosNovos: { fornecedor, materia_prima: materiaPrima, lote, aprovado, registro_mapa_produto: registroMapaIsento ? "ISENTO" : registroMapaProduto },
      });
      setOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const exportCSV = async () => {
    const headers = ["Data", "Fornecedor", "Matéria-Prima", "Lote", "Quantidade", "Unidade", "Odor", "Umidade", "Temperatura", "Insetos", "Aprovado", "Cert. Análise Nº", "Cert. Válido", "Validade", "Observações"];
    const rows = items.map(r => [
      r.data, r.fornecedor, r.materia_prima, r.lote || "", r.quantidade || "", r.unidade || "",
      r.odor || "", r.umidade || "", r.temperatura || "", r.insetos || "",
      r.aprovado ? "Sim" : "Não", r.certificado_analise_numero || "",
      r.certificado_analise_valido === true ? "Sim" : r.certificado_analise_valido === false ? "Não" : "",
      r.validade || "", r.observacoes || "",
    ]);
    let csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const nomeArquivo = `recebimento_mp_${new Date().toISOString().split("T")[0]}.csv`;
    const hash = await gerarHashIntegridade(csv);
    csv = adicionarRodapeIntegridade(csv, hash, user?.email || "sistema", nomeArquivo);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
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

                   {/* POP-01 / POP-05 Vehicle Inspection & Transport */}
                   <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Vistoria de Veículo e Transporte — POP-01 / IN 15/2009</p>
                     <p className="text-[10px] text-muted-foreground">Confira lacres, condições de transporte e estado do veículo antes de descarregar.</p>
                     <div className="grid grid-cols-2 gap-3">
                       <div><Label>Placa do Veículo</Label><Input value={placaVeiculo} onChange={e => setPlacaVeiculo(e.target.value)} placeholder="Ex: ABC-1234" /></div>
                       <div><Label>Nº do Lacre</Label><Input value={lacreNumero} onChange={e => setLacreNumero(e.target.value)} placeholder="Ex: LAC-00456" /></div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>Lacre Íntegro?</Label>
                         <Select value={lacreIntegro} onValueChange={setLacreIntegro}>
                           <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="integro">✅ Íntegro</SelectItem>
                             <SelectItem value="violado">❌ Violado</SelectItem>
                             <SelectItem value="sem_lacre">⚠️ Sem lacre</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <Label>Condições do Transporte</Label>
                         <Select value={condicoesTransporte} onValueChange={setCondicoesTransporte}>
                           <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="adequado">✅ Adequado</SelectItem>
                             <SelectItem value="parcial">⚠️ Parcialmente adequado</SelectItem>
                             <SelectItem value="inadequado">❌ Inadequado</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                     {(lacreIntegro === "violado" || condicoesTransporte === "inadequado") && (
                       <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                         <p className="text-xs text-destructive font-bold">⚠️ Atenção: Lacre violado ou transporte inadequado. Considerar rejeição da carga (POP-01 / IN 15/2009).</p>
                       </div>
                     )}
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

                   {/* Temperatura do Veículo e Integridade da Carga — IN 04/2007 */}
                   <div className="p-3 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-900/10 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                       🌡️ Temperatura do Veículo e Integridade da Carga — IN 04/2007
                     </p>
                     <p className="text-[10px] text-muted-foreground">
                       Para produtos de origem animal, registre a temperatura do baú/carroceria e avalie a integridade da carga na descarga.
                     </p>
                     <div className="flex items-center gap-2 mb-2">
                       <input type="checkbox" checked={cargaOrigemAnimal} onChange={e => setCargaOrigemAnimal(e.target.checked)} className="h-4 w-4" />
                       <Label className="text-sm">Produto de origem animal (verificação obrigatória)</Label>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>Temperatura do Veículo (°C)</Label>
                         <Input value={temperaturaVeiculo} onChange={e => setTemperaturaVeiculo(e.target.value)} placeholder="Ex: 5.2" type="number" step="0.1" />
                         {cargaOrigemAnimal && temperaturaVeiculo && parseFloat(temperaturaVeiculo) > 10 && (
                           <p className="text-xs text-destructive mt-1">⚠️ Temperatura acima do recomendado para produtos de origem animal (&le; 10°C)</p>
                         )}
                       </div>
                       <div>
                         <Label>Integridade da Carga</Label>
                         <Select value={integridadeCarga} onValueChange={setIntegridadeCarga}>
                           <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="integra">✅ Íntegra — embalagens intactas</SelectItem>
                             <SelectItem value="parcial">⚠️ Parcialmente comprometida</SelectItem>
                             <SelectItem value="comprometida">❌ Comprometida — avarias visíveis</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                     {(integridadeCarga === "comprometida" || (cargaOrigemAnimal && temperaturaVeiculo && parseFloat(temperaturaVeiculo) > 10)) && (
                       <div className="p-2 rounded border border-destructive/30 bg-destructive/10">
                         <p className="text-xs text-destructive font-semibold">⚠️ Atenção: Considerar rejeição da carga. Registrar não conformidade (IN 04/2007).</p>
                       </div>
                     )}
                   </div>

                   <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2">
                       <FileText className="w-4 h-4" /> Registro do Produto no MAPA — IN 15/2009
                     </p>
                     <p className="text-[10px] text-muted-foreground">
                       Exigido para ingredientes de alimentação animal. Informe o nº de registro ou marque como isento.
                     </p>
                     <div className="flex items-center gap-2">
                       <input type="checkbox" checked={registroMapaIsento} onChange={e => { setRegistroMapaIsento(e.target.checked); if (e.target.checked) setRegistroMapaProduto(""); }} className="h-4 w-4" />
                       <Label className="text-sm">Produto isento de registro no MAPA</Label>
                     </div>
                     {!registroMapaIsento && (
                       <div>
                         <Label>Nº Registro do Produto no MAPA</Label>
                         <Input value={registroMapaProduto} onChange={e => setRegistroMapaProduto(e.target.value)} placeholder="Ex: BR 1234567890" />
                       </div>
                     )}
                   </div>

                   {/* Segregação Origem Animal — IN 15/2009 */}
                   <div className="p-3 rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-900/20 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                       <ShieldAlert className="w-4 h-4" /> Segregação de Origem Animal — IN 15/2009
                     </p>
                     <p className="text-[10px] text-muted-foreground">
                       Identifique matérias-primas de origem animal para garantir segregação e prevenir contaminação cruzada com ruminantes (prevenção EEB).
                     </p>
                     <div className="flex items-center gap-2">
                       <input type="checkbox" checked={contemOrigemAnimal} onChange={e => setContemOrigemAnimal(e.target.checked)} className="h-4 w-4" />
                       <Label className="text-sm">Contém ingrediente de origem animal</Label>
                     </div>
                     {contemOrigemAnimal && (
                       <div className="space-y-2">
                         <div>
                           <Label>Tipo de Origem Animal</Label>
                           <Select value={tipoOrigemAnimal} onValueChange={setTipoOrigemAnimal}>
                             <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="farinha_carne_ossos">Farinha de Carne e Ossos</SelectItem>
                               <SelectItem value="farinha_penas">Farinha de Penas</SelectItem>
                               <SelectItem value="farinha_sangue">Farinha de Sangue</SelectItem>
                               <SelectItem value="farinha_peixe">Farinha de Peixe</SelectItem>
                               <SelectItem value="sebo_gordura">Sebo / Gordura Animal</SelectItem>
                               <SelectItem value="outro">Outro</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>Espécie de Destino do Produto Final</Label>
                           <Select value={destinoEspecie} onValueChange={setDestinoEspecie}>
                             <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="bovinos">Bovinos</SelectItem>
                               <SelectItem value="suinos">Suínos</SelectItem>
                               <SelectItem value="aves">Aves</SelectItem>
                               <SelectItem value="equinos">Equinos</SelectItem>
                               <SelectItem value="peixes">Peixes / Aquicultura</SelectItem>
                               <SelectItem value="pets">Pets (Cães e Gatos)</SelectItem>
                               <SelectItem value="multiespecie">Multiespécie</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         {destinoEspecie === "bovinos" && (
                           <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                             <p className="text-xs text-destructive font-bold flex items-center gap-1">
                               <AlertTriangle className="w-4 h-4" /> ALERTA EEB: Uso de proteína animal de ruminantes é PROIBIDO para bovinos!
                             </p>
                             <p className="text-[10px] text-destructive/80 mt-1">
                               Esta matéria-prima deve ser segregada e armazenada separadamente. Necessita limpeza de linha antes da produção para bovinos.
                             </p>
                           </div>
                         )}
                       </div>
                     )}
                   </div>

                   {/* Retenção de Amostra de Contraprova — IN 17/2017 */}
                   <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                     <p className="text-sm font-semibold flex items-center gap-2">
                       <ShieldAlert className="w-4 h-4" /> Retenção de Amostra (Contraprova) — IN 17/2017
                     </p>
                     <p className="text-[10px] text-muted-foreground">
                       Obrigatório reter amostras testemunha para defesa em casos de fiscalização do MAPA.
                     </p>
                     <div className="flex items-center gap-3">
                       <Switch checked={(window as any).__cpRetida ?? false} onCheckedChange={v => { (window as any).__cpRetida = v; setObservacoes(prev => prev); }} />
                       <Label className="text-sm">Amostra de contraprova retida</Label>
                     </div>
                     <div className="grid grid-cols-3 gap-3">
                       <div><Label>Quantidade retida</Label><Input id="cp-qtd" placeholder="Ex: 500g" /></div>
                       <div><Label>Local armazenamento</Label><Input id="cp-local" placeholder="Ex: Sala de amostras" /></div>
                       <div><Label>Validade da retenção</Label><Input id="cp-val" placeholder="Ex: 6 meses" /></div>
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
