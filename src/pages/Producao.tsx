import { useState, useEffect } from "react";
import { Factory, Plus, Loader2, AlertTriangle, Trash2, Download } from "lucide-react";
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

interface ProdRow {
  id: string;
  data: string;
  produto: string;
  lote: string | null;
  operador: string | null;
  tempo_mistura: string | null;
  quantidade: string | null;
}

const TEMPO_MISTURA_MINIMO = 3; // minutos — padrão IN 04/2007

export default function Producao() {
  const { user } = useAuth();
  const [items, setItems] = useState<ProdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [produto, setProduto] = useState("");
  const [lote, setLote] = useState("");
  const [operador, setOperador] = useState("");
  const [tempoMistura, setTempoMistura] = useState("");
  const [quantidade, setQuantidade] = useState("");
  
  // Sobras / Vassoura
  const [houveSobra, setHouveSobra] = useState(false);
  const [qtdSobra, setQtdSobra] = useState("");
  const [destinoSobra, setDestinoSobra] = useState("reprocesso");
  const [obsSobra, setObsSobra] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("producao").select("*").order("data", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const tempoMisturaValido = () => {
    const min = parseFloat(tempoMistura);
    return !isNaN(min) && min >= TEMPO_MISTURA_MINIMO;
  };

  const handleAdd = async () => {
    if (!produto || !user) return;
    if (tempoMistura && !tempoMisturaValido()) {
      toast.error(`⚠️ Tempo de mistura mínimo: ${TEMPO_MISTURA_MINIMO} min para garantir homogeneidade (IN 04/2007).`);
      return;
    }
    setSaving(true);
    
    const obsCompleta = houveSobra 
      ? `[SOBRA/VASSOURA] Qtd: ${qtdSobra || "N/I"} kg | Destino: ${destinoSobra === "reprocesso" ? "Reprocesso" : destinoSobra === "descarte" ? "Descarte (resíduo)" : destinoSobra === "devolucao" ? "Devolução ao silo" : "Outro"} | ${obsSobra}`.trim()
      : "";
    
    // Contraprova
    const cpQtd = (document.getElementById("prod-cp-qtd") as HTMLInputElement)?.value || "";
    const cpLocal = (document.getElementById("prod-cp-local") as HTMLInputElement)?.value || "";
    const cpVal = (document.getElementById("prod-cp-val") as HTMLInputElement)?.value || "";
    const cpRetida = !!(cpQtd || cpLocal);
    
    let quantidadeFinal = quantidade ? `${quantidade}${obsCompleta ? ` | Sobra: ${qtdSobra || "?"} kg` : ""}` : "";
    if (cpRetida) {
      quantidadeFinal += ` | [CONTRAPROVA] ${cpQtd} em ${cpLocal}`;
    }

    const { error } = await supabase.from("producao").insert({
      user_id: user.id,
      produto,
      lote,
      operador,
      tempo_mistura: tempoMistura ? `${tempoMistura} min` : "",
      quantidade: quantidadeFinal,
      contraprova_retida: cpRetida,
      contraprova_local: cpLocal,
      contraprova_validade: cpVal,
      contraprova_quantidade: cpQtd,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Registro salvo!");
      setOpen(false);
      setProduto(""); setLote(""); setOperador(""); setTempoMistura(""); setQuantidade("");
      setHouveSobra(false); setQtdSobra(""); setDestinoSobra("reprocesso"); setObsSobra("");
      fetchData();
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ["Data", "Produto", "Lote", "Operador", "Tempo Mistura", "Quantidade"];
    const rows = items.map(r => [r.data, r.produto, r.lote || "", r.operador || "", r.tempo_mistura || "", r.quantidade || ""]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `producao_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <>
      <PageHeader icon={Factory} title="Controle de Produção" description="Registro de fabricação, tempo de mistura e sobras — IN 04/2007 e IN 15/2009" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total registros</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{new Set(items.map(i => i.lote).filter(Boolean)).size}</p>
          <p className="text-xs text-muted-foreground">Lotes produzidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{new Set(items.map(i => i.produto)).size}</p>
          <p className="text-xs text-muted-foreground">Produtos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{items.filter(i => i.quantidade?.includes("Sobra")).length}</p>
          <p className="text-xs text-muted-foreground">C/ Sobras</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Registros de Produção</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Novo Registro de Produção</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Produto *</Label>
                    <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovinos 22%" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Lote</Label>
                      <Input value={lote} onChange={e => setLote(e.target.value)} placeholder="Ex: L2026-0321" />
                    </div>
                    <div>
                      <Label>Operador</Label>
                      <Input value={operador} onChange={e => setOperador(e.target.value)} placeholder="Nome" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tempo de Mistura (min) *</Label>
                      <Input 
                        value={tempoMistura} 
                        onChange={e => setTempoMistura(e.target.value)} 
                        placeholder={`Mínimo ${TEMPO_MISTURA_MINIMO} min`}
                        type="number"
                        min={TEMPO_MISTURA_MINIMO}
                      />
                      {tempoMistura && !tempoMisturaValido() && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Abaixo do mínimo ({TEMPO_MISTURA_MINIMO} min) — risco de falta de homogeneidade
                        </p>
                      )}
                      {tempoMistura && tempoMisturaValido() && (
                        <p className="text-xs text-primary mt-1">✓ Tempo adequado para homogeneidade</p>
                      )}
                    </div>
                    <div>
                      <Label>Quantidade produzida (kg)</Label>
                      <Input value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Ex: 2000" />
                    </div>
                  </div>

                  {/* Sobras / Vassoura de produção — IN 15/2009 */}
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Sobras / Vassoura de Produção (IN 15/2009)
                      </p>
                      <Switch checked={houveSobra} onCheckedChange={setHouveSobra} />
                    </div>
                    {houveSobra && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Quantidade sobra (kg)</Label>
                            <Input value={qtdSobra} onChange={e => setQtdSobra(e.target.value)} placeholder="Ex: 50" />
                          </div>
                          <div>
                            <Label>Destino</Label>
                            <Select value={destinoSobra} onValueChange={setDestinoSobra}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reprocesso">Reprocesso (mesmo produto)</SelectItem>
                                <SelectItem value="descarte">Descarte como resíduo</SelectItem>
                                <SelectItem value="devolucao">Devolução ao silo</SelectItem>
                                <SelectItem value="outro">Outro destino</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Observações da sobra</Label>
                          <Input value={obsSobra} onChange={e => setObsSobra(e.target.value)} placeholder="Detalhes do reprocesso ou descarte" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Retenção de Amostra de Contraprova — IN 17/2017 */}
                  <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/10 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      🧪 Retenção de Amostra (Contraprova) — IN 17/2017
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Reter amostra testemunha de cada lote produzido pelo prazo de validade do produto + 30 dias para defesa em fiscalizações.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>Quantidade retida</Label><Input id="prod-cp-qtd" placeholder="Ex: 500g" /></div>
                      <div><Label>Local armazenamento</Label><Input id="prod-cp-local" placeholder="Ex: Sala de amostras" /></div>
                      <div><Label>Validade retenção</Label><Input id="prod-cp-val" placeholder="Ex: Validade +30 dias" /></div>
                    </div>
                  </div>

                  <Button onClick={handleAdd} className="w-full" disabled={saving || !produto}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum registro. Use também o módulo PCP para ordens detalhadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tempo Mistura</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                    <TableCell>{p.produto}</TableCell>
                    <TableCell className="font-mono text-sm">{p.lote}</TableCell>
                    <TableCell>{p.operador}</TableCell>
                    <TableCell>
                      {p.tempo_mistura ? (
                        <span className={parseFloat(p.tempo_mistura) < TEMPO_MISTURA_MINIMO ? "text-destructive font-medium" : ""}>
                          {p.tempo_mistura}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{p.quantidade || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p><strong>💡 Dica:</strong> Para registros detalhados com fórmulas, batidas e rastreabilidade de lotes, use o módulo <strong>PCP / Ordens de Produção</strong>.</p>
            <p><strong>⏱️ Homogeneidade:</strong> Tempo mínimo de mistura de {TEMPO_MISTURA_MINIMO} min conforme validação da IN 04/2007. Registros abaixo deste valor são sinalizados.</p>
            <p><strong>🧹 Sobras:</strong> Registre todas as sobras/vassouras e seu destino (reprocesso ou descarte) conforme IN 15/2009.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
