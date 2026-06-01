import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Printer, Plus, Trash2, AlertTriangle, Lock } from "lucide-react";
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
import { printElement } from "@/utils/printUtils";
import { registrarAuditLog } from "@/utils/auditLog";


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
  tempo_mistura_padrao_minutos: number | null;
  tipo_embalagem: string | null;
  local_armazenamento: string | null;
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

interface LoteDisponivel {
  materia_prima: string;
  lote: string;
  fornecedor: string | null;
  data: string;
  status: string;
  saldo: number;
}

const VOLUMES_MISTURADOR = [500, 1000, 2000];

export default function FichaProducaoDigital({ ordemId, onClose }: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [lotes, setLotes] = useState<BatidaLote[]>([]);
  const [lotesDisp, setLotesDisp] = useState<LoteDisponivel[]>([]);
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
  const [tempoMisturaAlvo, setTempoMisturaAlvo] = useState("3");
  const [tipoEmb, setTipoEmb] = useState("");
  const [localArm, setLocalArm] = useState("");

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
      setTempoMisturaAlvo(o.tempo_mistura_padrao_minutos?.toString() || "3");
      setTipoEmb(o.tipo_embalagem || "");
      setLocalArm(o.local_armazenamento || "");

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

    // Carrega lotes de MP disponíveis (recebimentos aprovados e não esgotados)
    let recQ = supabase
      .from("recebimento_mp")
      .select("materia_prima, lote, fornecedor, data, status, saldo")
      .eq("aprovado", true)
      .neq("status", "esgotado")
      .not("lote", "is", null)
      .order("data", { ascending: true }) // FIFO order
      .limit(500);
    if (empresaAtiva) recQ = recQ.eq("empresa_id", empresaAtiva.id);
    const { data: recs } = await recQ;
    if (recs) setLotesDisp(recs.filter((r: any) => r.lote && r.lote.trim() !== "") as LoteDisponivel[]);

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
      tempo_mistura_padrao_minutos: parseInt(tempoMisturaAlvo) || 3,
      tipo_embalagem: tipoEmb,
      local_armazenamento: localArm,
    } as any).eq("id", ordemId);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Ficha atualizada!"); fetchData(); }
    setSaving(false);
  };

  const setLoteBatida = async (matPrima: string, batida: number, campo: "lote_mp" | "quantidade_kg", valor: string) => {
    if (!user) return;

    // Validação de Lote e Saldo (Mass Balance & FIFO)
    const loteInformado = campo === "lote_mp" ? valor : getValor(matPrima, batida, "lote_mp");
    const qtdInformada = campo === "quantidade_kg" ? parseFloat(valor) || 0 : parseFloat(getValor(matPrima, batida, "quantidade_kg")) || 0;

    if (loteInformado) {
      const infoLote = lotesDisp.find(l => 
        l.lote === loteInformado && 
        (l.materia_prima.toLowerCase() === matPrima.toLowerCase() || matPrima.toLowerCase().includes(l.materia_prima.toLowerCase()))
      );

      if (!infoLote) {
        const errorMsg = `ERRO CRÍTICO: Lote ${loteInformado} não encontrado para ${matPrima}. Produção bloqueada para esta batida.`;
        toast.error(errorMsg, { duration: 10000 });
        await registrarAuditLog({
          userId: user.id,
          empresaId: empresaAtiva?.id,
          tabela: "batida_lotes",
          acao: "editar",
          dadosNovos: { erro: "Lote não encontrado", materia_prima: matPrima, lote: loteInformado, batida, bloqueio_producao: true }
        });
        return; // Bloqueia a inserção/atualização
      } else {
        // Check FIFO
        if (infoLote.status === 'bloqueado') {
          const errorMsg = `BLOQUEIO FIFO: O lote ${loteInformado} está bloqueado. O lote anterior deve ser consumido primeiro.`;
          toast.error(errorMsg, { 
            duration: 10000,
            icon: <Lock className="w-5 h-5 text-red-500" />
          });
          await registrarAuditLog({
            userId: user.id,
            empresaId: empresaAtiva?.id,
            tabela: "batida_lotes",
            acao: "editar",
            dadosNovos: { erro: "Bloqueio FIFO", materia_prima: matPrima, lote: loteInformado, batida, bloqueio_producao: true }
          });
          return;
        }

        // Check Balance
        if (qtdInformada > infoLote.saldo) {
          const errorMsg = `ERRO DE CONSUMO: Saldo insuficiente no lote ${loteInformado}. Disponível: ${infoLote.saldo}kg. Tentativa: ${qtdInformada}kg.`;
          toast.error(errorMsg, { 
            duration: 10000,
            icon: <AlertTriangle className="w-5 h-5 text-red-600" />
          });
          await registrarAuditLog({
            userId: user.id,
            empresaId: empresaAtiva?.id,
            tabela: "batida_lotes",
            acao: "editar",
            dadosNovos: { 
              erro: "Saldo insuficiente", 
              materia_prima: matPrima, 
              lote: loteInformado, 
              batida, 
              saldo_disponivel: infoLote.saldo, 
              consumo_tentado: qtdInformada,
              bloqueio_producao: true 
            }
          });
          return;
        }
      }
    }

    const existente = lotes.find(l => l.materia_prima === matPrima && l.numero_batida === batida);
    if (existente) {
      const upd: any = { [campo]: campo === "quantidade_kg" ? parseFloat(valor) || 0 : valor };
      const { error } = await supabase.from("batida_lotes" as any).update(upd).eq("id", existente.id);
      if (!error) {
        await registrarAuditLog({
          userId: user.id,
          empresaId: empresaAtiva?.id,
          tabela: "batida_lotes",
          registroId: existente.id,
          acao: "editar",
          dadosAnteriores: existente,
          dadosNovos: { ...existente, ...upd }
        });
      }
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
      const { data: created, error } = await supabase.from("batida_lotes" as any).insert(novo).select().single();
      if (!error && created) {
        await registrarAuditLog({
          userId: user.id,
          empresaId: empresaAtiva?.id,
          tabela: "batida_lotes",
          registroId: (created as any).id,
          acao: "criar",
          dadosNovos: created as any
        });
      }
    }
    fetchData();
  };

  const getValor = (matPrima: string, batida: number, campo: "lote_mp" | "quantidade_kg"): string => {
    const l = lotes.find(x => x.materia_prima === matPrima && x.numero_batida === batida);
    if (!l) return "";
    return campo === "quantidade_kg" ? String(l.quantidade_kg || "") : (l.lote_mp || "");
  };

  const totalFormula = () => ingredientes.reduce((s, i) => s + Number(i.quantidade_kg), 0);

  const handlePrint = async () => {
    if (!printRef.current || !ordem) return;
    
    // Create a temporary element for printing to apply specific print styles
    const printContainer = document.createElement('div');
    printContainer.className = "print-only p-8 space-y-6";
    printContainer.style.backgroundColor = "white";
    printContainer.style.color = "black";
    
    // Header section
    const header = `
      <div class="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold uppercase">Ficha de Produção - PAC/BPF</h1>
          <p class="text-sm font-mono mt-1">Nº Ordem: <strong>${ordem.numero_ordem}</strong></p>
          <p class="text-sm">Data Programada: ${new Date(ordem.data_programada).toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold">${ordem.produto}</p>
          <p class="text-sm text-gray-600">Lote: ${ordem.lote_produto || '---'}</p>
        </div>
      </div>
    `;

    // Production Config section
    const config = `
      <div class="grid grid-cols-3 gap-4 border p-4 mb-6 rounded-md">
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">Volume Misturador</p>
          <p class="text-sm font-bold">${volumeMist} kg</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">Nº de Batidas</p>
          <p class="text-sm font-bold">${numBatidas}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">Total Programado</p>
          <p class="text-sm font-bold">${(volumeMist * numBatidas).toLocaleString('pt-BR')} kg</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">Qtd. Sacos</p>
          <p class="text-sm font-bold">${qtdSacos || '---'}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">Próximo Produto</p>
          <p class="text-sm font-bold">${proximoProd || '---'}</p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">Limpeza (Flushing)</p>
          <p class="text-sm font-bold">${necessitaFlush ? 'SIM (' + materialFlush + ')' : 'NÃO'}</p>
        </div>
      </div>
    `;

    // Table section (Ingredients and batches)
    const tot = totalFormula();
    const rows = ingredientes.map(ing => {
      const qtdPorBatida = tot > 0 ? (Number(ing.quantidade_kg) * volumeMist / tot) : 0;
      let batchCols = "";
      for (let i = 1; i <= numBatidas; i++) {
        const valLote = getValor(ing.materia_prima, i, "lote_mp");
        const valQtd = getValor(ing.materia_prima, i, "quantidade_kg");
        batchCols += `
          <td class="border p-2 text-center text-[10px]">
            <div class="border-b border-gray-200 pb-1 mb-1 font-mono">${valLote || '_________'}</div>
            <div>${valQtd ? Number(valQtd).toFixed(2) + ' kg' : '_________'}</div>
          </td>
        `;
      }
      return `
        <tr>
          <td class="border p-2 font-semibold text-xs">${ing.materia_prima}</td>
          <td class="border p-2 text-right text-xs">${Number(ing.quantidade_kg).toFixed(2)}</td>
          <td class="border p-2 text-right text-xs bg-gray-50">${qtdPorBatida.toFixed(2)}</td>
          ${batchCols}
        </tr>
      `;
    }).join("");

    const batchHeaders = Array.from({ length: numBatidas }, (_, i) => `<th class="border p-2 text-[10px]">Batida ${i + 1}</th>`).join("");

    const table = `
      <table class="w-full border-collapse border border-gray-800 mb-8">
        <thead>
          <tr class="bg-gray-100 text-xs">
            <th class="border p-2 text-left">Matéria-Prima</th>
            <th class="border p-2 text-right">Fórmula (kg)</th>
            <th class="border p-2 text-right">Por Batida (kg)</th>
            ${batchHeaders}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    // Footer section (Signatures)
    const footer = `
      <div class="grid grid-cols-2 gap-12 mt-12 pt-12">
        <div class="text-center border-t border-black pt-2">
          <p class="text-sm font-bold">Responsável Produção</p>
          <p class="text-xs text-gray-500">${verifResp || 'Assinatura / Nome'}</p>
        </div>
        <div class="text-center border-t border-black pt-2">
          <p class="text-sm font-bold">Data / Hora</p>
          <p class="text-xs text-gray-500">${verifData ? new Date(verifData).toLocaleDateString('pt-BR') : '____/____/____'}</p>
        </div>
      </div>
      <div class="mt-8 text-[10px] text-gray-400 text-center italic">
        Documento gerado pelo sistema Lovable - Módulo PCP / PAC
      </div>
    `;

    printContainer.innerHTML = header + config + table + footer;
    document.body.appendChild(printContainer);

    // Create a temporary ID and print
    const tempId = "temp-print-element";
    printContainer.id = tempId;
    
    printElement(tempId, { 
      title: `Ficha_Producao_${ordem.numero_ordem}`,
      landscape: numBatidas > 4
    });
    
    // Cleanup
    document.body.removeChild(printContainer);
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
                  // Lotes disponíveis (recebimento aprovado) que casam com esta MP — busca por nome contendo
                  const nomeMp = ing.materia_prima.toLowerCase().trim();
                  const lotesMp = lotesDisp.filter(l => {
                    const n = (l.materia_prima || "").toLowerCase().trim();
                    return n === nomeMp || n.includes(nomeMp) || nomeMp.includes(n);
                  });
                  const dlId = `lotes-${ing.id}`;
                  return (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">
                        {ing.materia_prima}
                        {lotesMp.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {lotesMp.filter(l => l.status === 'liberado').map(l => (
                              <Badge key={l.lote} variant="secondary" className="text-[9px] bg-green-100 text-green-700 hover:bg-green-100 py-0 h-4">
                                Lote Ativo: {l.lote} (Saldo: {l.saldo}kg)
                              </Badge>
                            ))}
                            <span className="text-[10px] text-muted-foreground">({lotesMp.length} lote{lotesMp.length > 1 ? "s" : ""} disp.)</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">{Number(ing.quantidade_kg).toFixed(2)}</TableCell>
                      {batidasArr.map(b => (
                        <TableCell key={b} className="p-1">
                          <Input
                            placeholder={lotesMp.length > 0 ? "Lote (sugerido)" : "Lote"}
                            className="h-7 text-xs mb-1"
                            list={dlId}
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
            {/* datalists para autocomplete dos lotes de MP por ingrediente */}
            {ingredientes.map(ing => {
              const nomeMp = ing.materia_prima.toLowerCase().trim();
              const lotesMp = lotesDisp.filter(l => {
                const n = (l.materia_prima || "").toLowerCase().trim();
                return n === nomeMp || n.includes(nomeMp) || nomeMp.includes(n);
              });
              if (lotesMp.length === 0) return null;
              // remove duplicatas de lote
              const unicos = Array.from(new Map(lotesMp.map(l => [l.lote, l])).values());
              return (
                <datalist key={ing.id} id={`lotes-${ing.id}`}>
                  {unicos.map(l => (
                    <option key={l.lote} value={l.lote}>
                      {l.fornecedor ? `${l.fornecedor} — ${l.data}` : l.data}
                    </option>
                  ))}
                </datalist>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Versão para impressão (oculta) */}
      {/* Versão para impressão (oculta) */}
      <div ref={printRef} className="hidden print:block bg-white text-black p-4" style={{ minWidth: "210mm" }}>
        <div className="border-[1.5pt] border-black p-4 mb-4">
          <div className="flex justify-between items-center border-b-[1.5pt] border-black pb-2 mb-4">
            <div className="text-lg font-bold">ORDEM DE PRODUÇÃO</div>
            <div className="text-right">
              <div className="text-sm font-bold">{empresaAtiva?.nome || "BPF DIGITAL"}</div>
              <div className="text-[10px] text-gray-500 italic">
                {empresaAtiva?.cnpj ? `CNPJ: ${empresaAtiva.cnpj}` : "Sistema de Gestão da Qualidade"}
              </div>
              {empresaAtiva?.responsavel_tecnico && (
                <div className="text-[10px] text-gray-500 uppercase">RT: {empresaAtiva.responsavel_tecnico}</div>
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">{ordem.produto}</h1>
            {ordem.lote_produto && <p className="text-sm font-bold text-primary mt-1">LOTE: {ordem.lote_produto}</p>}
            {ordem.formula_nome && <p className="text-[10px] font-mono mt-1 text-gray-600">Fórmula: {ordem.formula_nome}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-xs border border-gray-300 p-3 bg-gray-50 print-force-bg">
            <div><span className="font-bold">OP:</span> {ordem.numero_ordem}</div>
            <div><span className="font-bold">DATA:</span> {new Date(ordem.data_programada + "T00:00").toLocaleDateString("pt-BR")}</div>
            <div><span className="font-bold">SACOS:</span> {qtdSacos || "____"}</div>
            <div><span className="font-bold">MISTURADOR:</span> {volumeMist} kg</div>
            <div><span className="font-bold">BATIDAS:</span> {numBatidas}</div>
            <div><span className="font-bold">TOTAL OP:</span> {(volumeMist * numBatidas).toLocaleString("pt-BR")} kg</div>
          </div>

          <table className="w-full border-collapse border-[1pt] border-black text-[10px] mb-6">
            <thead>
              <tr className="bg-gray-100 print-force-bg">
                <th className="border border-black p-2 text-left">MATÉRIA-PRIMA</th>
                <th className="border border-black p-2 text-center">FÓRMULA (kg)</th>
                {batidasArr.map(b => (
                  <th key={b} className="border border-black p-2 text-center text-[9px]">
                    BATIDA {String(b).padStart(2, "0")}<br />Lote / Real
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredientes.map(ing => {
                const tot = totalFormula();
                const qtdPorBatida = tot > 0 ? (Number(ing.quantidade_kg) * volumeMist / tot).toFixed(2) : "0";
                return (
                  <tr key={ing.id} className="h-10">
                    <td className="border border-black p-2 font-medium">{ing.materia_prima}</td>
                    <td className="border border-black p-2 text-center">{Number(ing.quantidade_kg).toFixed(2)}</td>
                    {batidasArr.map(b => {
                      const lote = getValor(ing.materia_prima, b, "lote_mp");
                      const qtd = getValor(ing.materia_prima, b, "quantidade_kg") || qtdPorBatida;
                      return (
                        <td key={b} className="border border-black p-2 text-center text-[9px]">
                          {lote || "_______"}<br />{qtd} kg
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="font-bold bg-gray-50 print-force-bg">
                <td className="border border-black p-2">TOTAL DA BATIDA</td>
                <td className="border border-black p-2 text-center">{totalFormula().toFixed(2)}</td>
                {batidasArr.map(b => <td key={b} className="border border-black p-2 text-center">{volumeMist} kg</td>)}
              </tr>
            </tbody>
          </table>

          <div className="space-y-3 text-[10px] mb-8 p-3 border border-gray-200">
            <p className="flex gap-4">
              <strong>TEMPO DE MISTURA POR BATIDA:</strong>
              {batidasArr.slice(0, 5).map(b => <span key={b}>{String(b).padStart(2, "0")} (____ min)</span>)}
            </p>
            <div className="flex gap-10">
              <p><strong>INÍCIO:</strong> ____:____ hs</p>
              <p><strong>TÉRMINO:</strong> ____:____ hs</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-3">
              <p><strong>PRÓXIMO PRODUTO:</strong> {proximoProd || "________________________"}</p>
              <p><strong>LIMPEZA DE LINHA?</strong> {necessitaFlush ? " (X) Sim  ( ) Não" : " ( ) Sim  (X) Não"}</p>
              <p className="col-span-2"><strong>MATERIAL FLUSHING:</strong> {materialFlush || "________________________________________"}</p>
              <p><strong>VERIFICAÇÃO:</strong> {verifResp || "____________________"}</p>
              <p><strong>DATA:</strong> {verifData ? new Date(verifData + "T00:00").toLocaleDateString("pt-BR") : "____________"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-[9px] mt-12">
            <div className="border-t border-black pt-2">Responsável (Operador)</div>
            <div className="border-t border-black pt-2">Monitoria / Supervisão</div>
            <div className="border-t border-black pt-2">Responsável Técnico (CRMV)</div>
          </div>
        </div>
        <p className="text-[8px] text-gray-400 italic text-right mt-2">Documento gerado pelo Sistema BPF Digital — {new Date().toLocaleString("pt-BR")}</p>
      </div>

    </div>
  );
}
