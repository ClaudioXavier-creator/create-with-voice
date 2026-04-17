import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Printer, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface Props {
  ordemId: string;
  onClose?: () => void;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  produto: string;
  formula_id: string | null;
  formula_nome: string;
  lote_produto: string | null;
  quantidade_programada: string | null;
  numero_batidas: number | null;
  volume_misturador_kg: number | null;
  quantidade_sacos: number | null;
  data_programada: string;
  proximo_produto: string | null;
  necessita_flushing: boolean | null;
  material_flushing: string | null;
  verificacao_responsavel: string | null;
  verificacao_data: string | null;
}

interface Ingrediente {
  id: string;
  materia_prima: string;
  quantidade_kg: number;
  ordem: number;
}

interface BatidaLote {
  id: string;
  numero_batida: number;
  materia_prima: string;
  lote_mp: string;
  quantidade_kg: number;
}

const VOLUMES_MISTURADOR = [500, 1000, 2000];

export default function FichaProducaoDigital({ ordemId, onClose }: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [lotes, setLotes] = useState<BatidaLote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Header editáveis
  const [volumeMist, setVolumeMist] = useState<number>(500);
  const [numBatidas, setNumBatidas] = useState<number>(1);
  const [qtdSacos, setQtdSacos] = useState<string>("");
  const [proximoProd, setProximoProd] = useState("");
  const [necessitaFlush, setNecessitaFlush] = useState(false);
  const [materialFlush, setMaterialFlush] = useState("");
  const [verifResp, setVerifResp] = useState("");
  const [verifData, setVerifData] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!user || !ordemId) return;
    setLoading(true);
    const { data: ord } = await supabase.from("ordens_producao").select("*").eq("id", ordemId).single();
    if (ord) {
      const o = ord as unknown as Ordem;
      setOrdem(o);
      setVolumeMist(o.volume_misturador_kg || 500);
      setNumBatidas(o.numero_batidas || 1);
      setQtdSacos(o.quantidade_sacos?.toString() || "");
      setProximoProd(o.proximo_produto || "");
      setNecessitaFlush(!!o.necessita_flushing);
      setMaterialFlush(o.material_flushing || "");
      setVerifResp(o.verificacao_responsavel || "");
      setVerifData(o.verificacao_data || "");

      if (o.formula_id) {
        const { data: ings } = await supabase
          .from("formula_ingredientes" as any)
          .select("*")
          .eq("formula_id", o.formula_id)
          .order("ordem");
        if (ings) setIngredientes(ings as unknown as Ingrediente[]);
      }
    }
    const { data: lts } = await supabase.from("batida_lotes" as any).select("*").eq("ordem_id", ordemId);
    if (lts) setLotes(lts as unknown as BatidaLote[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, ordemId]);

  const handleSaveHeader = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("ordens_producao").update({
      volume_misturador_kg: volumeMist,
      numero_batidas: numBatidas,
      quantidade_sacos: qtdSacos ? parseInt(qtdSacos) : null,
      proximo_produto: proximoProd,
      necessita_flushing: necessitaFlush,
      material_flushing: materialFlush,
      verificacao_responsavel: verifResp,
      verificacao_data: verifData || null,
    } as any).eq("id", ordemId);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Ficha atualizada!"); fetchData(); }
    setSaving(false);
  };

  const setLoteBatida = async (matPrima: string, batida: number, campo: "lote_mp" | "quantidade_kg", valor: string) => {
    if (!user) return;
    const existente = lotes.find(l => l.materia_prima === matPrima && l.numero_batida === batida);
    if (existente) {
      const upd: any = { [campo]: campo === "quantidade_kg" ? parseFloat(valor) || 0 : valor };
      await supabase.from("batida_lotes" as any).update(upd).eq("id", existente.id);
    } else {
      const ing = ingredientes.find(i => i.materia_prima === matPrima);
      const qtdPadrao = ing ? (Number(ing.quantidade_kg) * volumeMist / totalFormula()) : 0;
      const novo: any = {
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        ordem_id: ordemId,
        numero_batida: batida,
        materia_prima: matPrima,
        lote_mp: campo === "lote_mp" ? valor : "",
        quantidade_kg: campo === "quantidade_kg" ? (parseFloat(valor) || 0) : qtdPadrao,
      };
      await supabase.from("batida_lotes" as any).insert(novo);
    }
    fetchData();
  };

  const getValor = (matPrima: string, batida: number, campo: "lote_mp" | "quantidade_kg"): string => {
    const l = lotes.find(x => x.materia_prima === matPrima && x.numero_batida === batida);
    if (!l) return "";
    return campo === "quantidade_kg" ? String(l.quantidade_kg || "") : (l.lote_mp || "");
  };

  const totalFormula = () => ingredientes.reduce((s, i) => s + Number(i.quantidade_kg), 0);

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Ficha de Produção - ${ordem?.numero_ordem}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
        h1 { font-size: 16px; text-align: center; margin: 0 0 6px; }
        h2 { font-size: 13px; margin: 12px 0 4px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; vertical-align: top; }
        th { background: #eee; font-size: 10px; }
        .header-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
        .header-info div { border: 1px solid #999; padding: 4px 6px; }
        .signature-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 30px; }
        .signature-row > div { border-top: 1px solid #000; padding-top: 4px; text-align: center; }
        .footer { margin-top: 14px; font-size: 10px; }
        @media print { body { padding: 10px; } }
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!ordem) return <p className="text-center py-8 text-muted-foreground">Ordem não encontrada</p>;

  const batidasArr = Array.from({ length: numBatidas }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Header configurável */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração da Ficha de Produção</CardTitle>
          {ordem.formula_nome && (
            <p className="text-xs font-mono text-muted-foreground mt-1">
              📋 Fórmula oficial: <span className="font-semibold text-foreground">{ordem.formula_nome}</span>
              {!ordem.formula_id && <span className="ml-2 text-yellow-600">(⚠️ não vinculada — vincule uma fórmula versionada na OP)</span>}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Volume do Misturador (kg)</Label>
              <Select value={String(volumeMist)} onValueChange={v => setVolumeMist(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOLUMES_MISTURADOR.map(v => <SelectItem key={v} value={String(v)}>{v} kg</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nº de Batidas</Label>
              <Input type="number" min={1} max={20} value={numBatidas} onChange={e => setNumBatidas(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Quantidade de Sacos</Label>
              <Input type="number" value={qtdSacos} onChange={e => setQtdSacos(e.target.value)} />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground">
                Total: <strong>{(volumeMist * numBatidas).toLocaleString("pt-BR")} kg</strong>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Próximo produto a produzir</Label>
              <Input value={proximoProd} onChange={e => setProximoProd(e.target.value)} placeholder="Ex: Ração Equinos" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="flush-chk" checked={necessitaFlush} onChange={e => setNecessitaFlush(e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="flush-chk">Necessita limpeza de linha (flushing)?</Label>
            </div>
          </div>
          {necessitaFlush && (
            <div>
              <Label>Material usado no flushing</Label>
              <Input value={materialFlush} onChange={e => setMaterialFlush(e.target.value)} placeholder="Ex: 200 kg de milho moído" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Verificação — Responsável</Label>
              <Input value={verifResp} onChange={e => setVerifResp(e.target.value)} />
            </div>
            <div>
              <Label>Data verificação</Label>
              <Input type="date" value={verifData} onChange={e => setVerifData(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveHeader} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-1" /> Salvar Configuração
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir Ficha (PDF)
            </Button>
            {onClose && <Button variant="ghost" onClick={onClose}>Fechar</Button>}
          </div>
        </CardContent>
      </Card>

      {ingredientes.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-sm text-muted-foreground">
            Esta OP não tem fórmula vinculada com ingredientes.<br />
            Vincule uma fórmula em "Editar Ordem" e cadastre seus ingredientes.
          </p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lotes das Matérias-Primas por Batida</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Matéria-Prima</TableHead>
                  <TableHead className="text-right">Fórmula (kg)</TableHead>
                  {batidasArr.map(b => (
                    <TableHead key={b} className="text-center min-w-[140px]">Batida {String(b).padStart(2, "0")}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientes.map(ing => {
                  const tot = totalFormula();
                  const qtdPorBatida = tot > 0 ? (Number(ing.quantidade_kg) * volumeMist / tot) : 0;
                  return (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">{ing.materia_prima}</TableCell>
                      <TableCell className="text-right text-xs">{Number(ing.quantidade_kg).toFixed(2)}</TableCell>
                      {batidasArr.map(b => (
                        <TableCell key={b} className="p-1">
                          <Input
                            placeholder="Lote"
                            className="h-7 text-xs mb-1"
                            defaultValue={getValor(ing.materia_prima, b, "lote_mp")}
                            onBlur={e => setLoteBatida(ing.materia_prima, b, "lote_mp", e.target.value)}
                          />
                          <Input
                            type="number"
                            step="0.001"
                            placeholder={qtdPorBatida.toFixed(2)}
                            className="h-7 text-xs"
                            defaultValue={getValor(ing.materia_prima, b, "quantidade_kg")}
                            onBlur={e => setLoteBatida(ing.materia_prima, b, "quantidade_kg", e.target.value)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                <TableRow className="font-bold bg-muted/40">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{totalFormula().toFixed(2)}</TableCell>
                  {batidasArr.map(b => (
                    <TableCell key={b} className="text-center text-xs">{volumeMist} kg</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Versão para impressão (oculta) */}
      <div ref={printRef} style={{ display: "none" }}>
        <h1>ORDEM DE PRODUÇÃO — FÓRMULA E INCLUSÃO DE MATÉRIAS-PRIMAS</h1>
        <h2 style={{ textAlign: "center" }}>{ordem.produto} {ordem.lote_produto ? `— LOTE: ${ordem.lote_produto}` : ""}</h2>
        {ordem.formula_nome && (
          <p style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11, margin: "0 0 8px" }}>
            <strong>Fórmula Oficial:</strong> {ordem.formula_nome}
          </p>
        )}
        <div className="header-info">
          <div><strong>OP:</strong> {ordem.numero_ordem}</div>
          <div><strong>Data:</strong> {new Date(ordem.data_programada + "T00:00").toLocaleDateString("pt-BR")}</div>
          <div><strong>Sacos:</strong> {qtdSacos || "____"}</div>
          <div><strong>Misturador:</strong> {volumeMist} kg</div>
          <div><strong>Batidas:</strong> {numBatidas}</div>
          <div><strong>Total:</strong> {(volumeMist * numBatidas).toLocaleString("pt-BR")} kg</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>MATÉRIA-PRIMA</th>
              <th>FÓRMULA (kg)</th>
              {batidasArr.map(b => <th key={b}>BATIDA {String(b).padStart(2, "0")}<br />Lote / kg</th>)}
            </tr>
          </thead>
          <tbody>
            {ingredientes.map(ing => {
              const tot = totalFormula();
              const qtdPorBatida = tot > 0 ? (Number(ing.quantidade_kg) * volumeMist / tot).toFixed(2) : "0";
              return (
                <tr key={ing.id}>
                  <td>{ing.materia_prima}</td>
                  <td>{Number(ing.quantidade_kg).toFixed(2)}</td>
                  {batidasArr.map(b => {
                    const lote = getValor(ing.materia_prima, b, "lote_mp");
                    const qtd = getValor(ing.materia_prima, b, "quantidade_kg") || qtdPorBatida;
                    return <td key={b}>{lote || "____"}<br />{qtd} kg</td>;
                  })}
                </tr>
              );
            })}
            <tr style={{ fontWeight: "bold" }}>
              <td>TOTAL</td>
              <td>{totalFormula().toFixed(2)}</td>
              {batidasArr.map(b => <td key={b}>{volumeMist} kg</td>)}
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 12 }}>
          <p><strong>Tempo de mistura por batida:</strong> 01 (___ min) &nbsp; 02 (___ min) &nbsp; 03 (___ min) &nbsp; 04 (___ min) &nbsp; 05 (___ min)</p>
          <p><strong>Início:</strong> ___:___ hs &nbsp;&nbsp; <strong>Término:</strong> ___:___ hs</p>
        </div>

        <table style={{ marginTop: 8 }}>
          <tbody>
            <tr>
              <td><strong>Próximo produto a produzir:</strong> {proximoProd || "________________________"}</td>
              <td><strong>Necessidade de limpeza de linha?</strong> {necessitaFlush ? "[ X ] Sim   [ ] Não" : "[ ] Sim   [ X ] Não"}</td>
            </tr>
            <tr>
              <td colSpan={2}><strong>Material usado no flushing:</strong> {materialFlush || "________________________________________"}</td>
            </tr>
            <tr>
              <td><strong>Verificação:</strong> {verifResp || "____________________"}</td>
              <td><strong>Data:</strong> {verifData ? new Date(verifData + "T00:00").toLocaleDateString("pt-BR") : "____________"}</td>
            </tr>
          </tbody>
        </table>

        <div className="signature-row">
          <div>Responsável (Operador)</div>
          <div>Monitoria / Supervisão</div>
          <div>Responsável Técnico (CRMV)</div>
        </div>

        <p className="footer">Documento gerado por BPF_Consult — {new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}
