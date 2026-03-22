import { useState, useEffect, useRef } from "react";
import { Loader2, Printer, Download, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  produtoId: string;
  produtoNome: string;
}

interface RotuloData {
  id?: string;
  tipo_rotulo: string;
  nome_comercial: string;
  classificacao_label: string;
  especie_categoria: string;
  composicao_ingredientes: string;
  eventuais_substitutivos: string;
  niveis_garantia_texto: string;
  indicacoes_uso: string;
  modo_usar: string;
  precaucoes_restricoes: string;
  peso_liquido: string;
  prazo_validade: string;
  armazenamento: string;
  lote_placeholder: string;
  fabricacao_placeholder: string;
  registro_mapa: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  rt_nome: string;
  rt_crmv: string;
  sac_contato: string;
  largura_mm: number;
  altura_mm: number;
  exibir_tabela_consumo: boolean;
}

const EMPTY_ROTULO: RotuloData = {
  tipo_rotulo: "racao",
  nome_comercial: "", classificacao_label: "", especie_categoria: "",
  composicao_ingredientes: "", eventuais_substitutivos: "", niveis_garantia_texto: "",
  indicacoes_uso: "", modo_usar: "", precaucoes_restricoes: "",
  peso_liquido: "", prazo_validade: "", armazenamento: "",
  lote_placeholder: "LOTE: ___________",
  fabricacao_placeholder: "FAB: ___/___/______",
  registro_mapa: "", razao_social: "", cnpj: "", endereco: "",
  rt_nome: "", rt_crmv: "", sac_contato: "",
  largura_mm: 100, altura_mm: 75,
  exibir_tabela_consumo: false,
};

const CLASSIFICACAO_FULL: Record<string, string> = {
  racao: "RAÇÃO",
  suplemento: "SUPLEMENTO",
  premix: "PREMIX",
  nucleo: "NÚCLEO",
  aditivo: "ADITIVO",
  sal_mineral: "SAL MINERAL",
};

// ──── Reference values for 450kg bovine maintenance (NRC) ────
const VR_MACRO: { mineral: string; vr: number; unit: string; key: string }[] = [
  { mineral: "Cálcio", vr: 14, unit: "g/dia", key: "calcio" },
  { mineral: "Fósforo", vr: 11, unit: "g/dia", key: "fosforo" },
  { mineral: "Sódio", vr: 7, unit: "g/dia", key: "sodio" },
  { mineral: "Magnésio", vr: 9, unit: "g/dia", key: "magnesio" },
  { mineral: "Enxofre", vr: 13.5, unit: "g/dia", key: "enxofre" },
  { mineral: "Potássio", vr: 54, unit: "g/dia", key: "potassio" },
];

const VR_MICRO: { mineral: string; vr: number; unit: string; key: string }[] = [
  { mineral: "Cobalto", vr: 0.9, unit: "mg/dia", key: "cobalto" },
  { mineral: "Cobre", vr: 90, unit: "mg/dia", key: "cobre" },
  { mineral: "Iodo", vr: 4.5, unit: "mg/dia", key: "iodo" },
  { mineral: "Manganês", vr: 180, unit: "mg/dia", key: "manganes" },
  { mineral: "Selênio", vr: 0.9, unit: "mg/dia", key: "selenio" },
  { mineral: "Zinco", vr: 270, unit: "mg/dia", key: "zinco" },
  { mineral: "Ferro", vr: 450, unit: "mg/dia", key: "ferro" },
];

const VR_VITAMINAS: { mineral: string; vr: number; unit: string; key: string }[] = [
  { mineral: "Vitamina A", vr: 20000, unit: "UI/dia", key: "vitamina_a" },
  { mineral: "Vitamina D", vr: 2500, unit: "UI/dia", key: "vitamina_d" },
  { mineral: "Vitamina E", vr: 350, unit: "UI/dia", key: "vitamina_e" },
];

/** Checks if product type + species warrants a consumption table */
function shouldShowConsumptionTable(tipo: string, especie: string): boolean {
  const tiposValidos = ["sal_mineral", "suplemento"];
  const isBovino = especie.toLowerCase().includes("bovin");
  return tiposValidos.includes(tipo) && isBovino;
}

/** Calculate nutrient amount per 100g of supplement from niveis_garantia (per kg) */
function calcQtdPer100g(niveisObj: Record<string, any>, key: string, refUnit: string): number | null {
  const nutrient = niveisObj[key];
  if (!nutrient || typeof nutrient !== "object") return null;

  // Get min value (or max if min unavailable)
  const rawVal = parseFloat(nutrient.min || nutrient.max || "0");
  if (!rawVal) return null;

  const nutUnit = (nutrient.unit || "").toLowerCase();

  // Nutrient is per kg, we want per 100g → divide by 10
  let valPer100g = rawVal / 10;

  // Convert units if needed (g/kg → g, mg/kg → mg)
  // If ref expects g/dia and nutrient is in mg/kg, convert mg→g
  if (refUnit.includes("g/dia") && nutUnit.includes("mg")) {
    valPer100g = valPer100g / 1000;
  }
  // If ref expects mg/dia and nutrient is in g/kg, convert g→mg
  if (refUnit.includes("mg/dia") && nutUnit.includes("g/")) {
    valPer100g = valPer100g * 1000;
  }

  return valPer100g;
}

/** Convert structured niveis_garantia JSON to IN 22 formatted text */
function formatNiveisIN22(niveisObj: Record<string, any>): string {
  const lines: string[] = [];
  Object.entries(niveisObj).forEach(([key, val]) => {
    if (key.startsWith("_")) return;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (typeof val === "object" && val !== null) {
      const { min, max, unit } = val as { min?: string; max?: string; unit?: string };
      const u = unit || "";
      if (min && max) {
        lines.push(`${label} (Mín.) ${min} ${u}; ${label} (Máx.) ${max} ${u}`);
      } else if (min) {
        lines.push(`${label} (Mín.) ${min} ${u}`);
      } else if (max) {
        lines.push(`${label} (Máx.) ${max} ${u}`);
      }
    } else if (val) {
      lines.push(`${label}: ${val}`);
    }
  });
  return lines.join("; ") + ".";
}

function extractFromProduto(prod: any): Partial<RotuloData> {
  const niveisObj = (prod.niveis_garantia as Record<string, any>) || {};
  const niveisText = formatNiveisIN22(niveisObj);
  const eventuais = niveisObj._eventuais_substitutos || "";
  const tipo = prod.classificacao || "racao";
  const classificacaoLabel = CLASSIFICACAO_FULL[tipo] || tipo.toUpperCase();
  const especie = `${prod.especie_alvo || ""}`.toUpperCase();
  const categoria = `${prod.categoria_animal || ""}`.toUpperCase();
  const especieCategoria = [especie, categoria].filter(Boolean).join(" – ");

  return {
    nome_comercial: prod.nome || "",
    tipo_rotulo: tipo,
    classificacao_label: `${classificacaoLabel} PARA ${especieCategoria}`,
    especie_categoria: especieCategoria,
    composicao_ingredientes: (prod.composicao || "").toUpperCase(),
    eventuais_substitutivos: eventuais,
    niveis_garantia_texto: niveisText,
    indicacoes_uso: prod.indicacoes || "",
    modo_usar: prod.modo_uso || "",
    precaucoes_restricoes: prod.precaucoes || "",
    peso_liquido: `${prod.peso_liquido || ""} ${prod.unidade_peso || "kg"}`.trim(),
    prazo_validade: `${prod.validade_meses || 6} meses a partir da data de fabricação`,
    armazenamento: prod.armazenamento || "",
    registro_mapa: prod.registro_mapa || "",
    exibir_tabela_consumo: shouldShowConsumptionTable(tipo, prod.especie_alvo || ""),
  };
}

// ──── Consumption table sub-component ────
function TabelaConsumo({ niveisObj }: { niveisObj: Record<string, any> }) {
  // PB and NDT consumption
  const consumoPB = niveisObj.consumo_pb;
  const consumoNDT = niveisObj.consumo_ndt;

  const renderRow = (ref: typeof VR_MACRO[0]) => {
    const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
    const pct = qtd !== null && ref.vr > 0 ? ((qtd / ref.vr) * 100) : null;
    return (
      <TableRow key={ref.key}>
        <TableCell className="py-1 text-xs">{ref.mineral}</TableCell>
        <TableCell className="py-1 text-xs text-center">{ref.vr}</TableCell>
        <TableCell className="py-1 text-xs text-center">{qtd !== null ? qtd.toFixed(2) : "--"}</TableCell>
        <TableCell className="py-1 text-xs text-center">{pct !== null ? pct.toFixed(2) : "--"}</TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-3">
      {/* PB / NDT row */}
      {(consumoPB || consumoNDT) && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-1 text-xs">Parâmetro</TableHead>
              <TableHead className="py-1 text-xs text-center">VR¹ (g/dia)</TableHead>
              <TableHead className="py-1 text-xs text-center">Qtd/100g Supl.</TableHead>
              <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumoPB && typeof consumoPB === "object" && (
              <TableRow>
                <TableCell className="py-1 text-xs">Consumo em PB</TableCell>
                <TableCell className="py-1 text-xs text-center">550</TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoPB.min || "0") ? (parseFloat(consumoPB.min) / 10).toFixed(1) : "--"}
                </TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoPB.min || "0") ? ((parseFloat(consumoPB.min) / 10 / 550) * 100).toFixed(2) : "--"}
                </TableCell>
              </TableRow>
            )}
            {consumoNDT && typeof consumoNDT === "object" && (
              <TableRow>
                <TableCell className="py-1 text-xs">Consumo em NDT</TableCell>
                <TableCell className="py-1 text-xs text-center">4000</TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoNDT.min || "0") ? (parseFloat(consumoNDT.min) / 10).toFixed(1) : "--"}
                </TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoNDT.min || "0") ? ((parseFloat(consumoNDT.min) / 10 / 4000) * 100).toFixed(2) : "--"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Macrominerais */}
      <div>
        <p className="text-xs font-bold mb-1">MACROMINERAIS (g/dia)</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-1 text-xs">Mineral</TableHead>
              <TableHead className="py-1 text-xs text-center">VR¹</TableHead>
              <TableHead className="py-1 text-xs text-center">Qtd/100g</TableHead>
              <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{VR_MACRO.map(renderRow)}</TableBody>
        </Table>
      </div>

      {/* Microminerais */}
      <div>
        <p className="text-xs font-bold mb-1">MICROMINERAIS (mg/dia)</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-1 text-xs">Mineral</TableHead>
              <TableHead className="py-1 text-xs text-center">VR¹</TableHead>
              <TableHead className="py-1 text-xs text-center">Qtd/100g</TableHead>
              <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{VR_MICRO.map(renderRow)}</TableBody>
        </Table>
      </div>

      {/* Vitaminas */}
      <div>
        <p className="text-xs font-bold mb-1">VITAMINAS (UI/dia)</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-1 text-xs">Vitamina</TableHead>
              <TableHead className="py-1 text-xs text-center">VR¹</TableHead>
              <TableHead className="py-1 text-xs text-center">Qtd/100g</TableHead>
              <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{VR_VITAMINAS.map(renderRow)}</TableBody>
        </Table>
      </div>

      <p className="text-[9px] text-muted-foreground italic">
        ¹ Valor diário de referência para manutenção de um animal de 450 kg de peso corporal (IN 12/2004 – MAPA).
      </p>
    </div>
  );
}

// ──── Consumption table for print preview (inline styles) ────
function TabelaConsumoPreview({ niveisObj }: { niveisObj: Record<string, any> }) {
  const cellStyle: React.CSSProperties = { border: "1px solid #333", padding: "2px 4px", fontSize: "7px", textAlign: "center" };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: "bold", background: "#e5e5e5" };
  const leftCell: React.CSSProperties = { ...cellStyle, textAlign: "left" };

  const renderRows = (refs: typeof VR_MACRO) => refs.map(ref => {
    const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
    const pct = qtd !== null && ref.vr > 0 ? ((qtd / ref.vr) * 100) : null;
    return (
      <tr key={ref.key}>
        <td style={leftCell}>{ref.mineral}</td>
        <td style={cellStyle}>{ref.vr}</td>
        <td style={cellStyle}>{qtd !== null ? qtd.toFixed(2) : "--"}</td>
        <td style={cellStyle}>{pct !== null ? pct.toFixed(2) : "--"}</td>
      </tr>
    );
  });

  return (
    <div style={{ marginTop: "6px" }}>
      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "6px 0 3px" }}>TABELA DE CONSUMO:</p>

      <p style={{ fontSize: "7px", fontWeight: "bold", margin: "4px 0 2px" }}>MACROMINERAIS (g/dia)</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <thead>
          <tr>
            <th style={headerStyle}>Mineral</th>
            <th style={headerStyle}>VR¹</th>
            <th style={headerStyle}>Qtd/100g</th>
            <th style={headerStyle}>% do VR</th>
          </tr>
        </thead>
        <tbody>{renderRows(VR_MACRO)}</tbody>
      </table>

      <p style={{ fontSize: "7px", fontWeight: "bold", margin: "4px 0 2px" }}>MICROMINERAIS (mg/dia)</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <thead>
          <tr>
            <th style={headerStyle}>Mineral</th>
            <th style={headerStyle}>VR¹</th>
            <th style={headerStyle}>Qtd/100g</th>
            <th style={headerStyle}>% do VR</th>
          </tr>
        </thead>
        <tbody>{renderRows(VR_MICRO)}</tbody>
      </table>

      <p style={{ fontSize: "7px", fontWeight: "bold", margin: "4px 0 2px" }}>VITAMINAS (UI/dia)</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <thead>
          <tr>
            <th style={headerStyle}>Vitamina</th>
            <th style={headerStyle}>VR¹</th>
            <th style={headerStyle}>Qtd/100g</th>
            <th style={headerStyle}>% do VR</th>
          </tr>
        </thead>
        <tbody>{renderRows(VR_VITAMINAS)}</tbody>
      </table>

      <p style={{ fontSize: "6px", fontStyle: "italic", margin: "2px 0" }}>
        ¹ Valor diário de referência para manutenção de um animal de 450 kg de peso corporal (IN 12/2004 – MAPA).
      </p>
    </div>
  );
}

// ──── Main component ────
export default function RotuloEditor({ produtoId, produtoNome }: Props) {
  const { user } = useAuth();
  const [rotulo, setRotulo] = useState<RotuloData>({ ...EMPTY_ROTULO, nome_comercial: produtoNome });
  const [rotuloId, setRotuloId] = useState<string | null>(null);
  const [niveisObj, setNiveisObj] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadRotulo(); }, [produtoId]);

  async function loadRotulo() {
    setLoading(true);
    // Load product niveis_garantia for consumption table
    const { data: prod } = await supabase.from("produtos").select("niveis_garantia, classificacao, especie_alvo").eq("id", produtoId).single();
    if (prod) {
      setNiveisObj((prod.niveis_garantia as Record<string, any>) || {});
    }

    const { data } = await supabase
      .from("rotulos")
      .select("*")
      .eq("produto_id", produtoId)
      .maybeSingle();

    if (data) {
      setRotuloId(data.id);
      const autoTabela = prod ? shouldShowConsumptionTable(prod.classificacao, prod.especie_alvo || "") : false;
      setRotulo({
        tipo_rotulo: data.tipo_rotulo || "racao",
        nome_comercial: data.nome_comercial || produtoNome,
        classificacao_label: data.classificacao_label || "",
        especie_categoria: data.especie_categoria || "",
        composicao_ingredientes: data.composicao_ingredientes || "",
        eventuais_substitutivos: data.eventuais_substitutivos || "",
        niveis_garantia_texto: data.niveis_garantia_texto || "",
        indicacoes_uso: data.indicacoes_uso || "",
        modo_usar: data.modo_usar || "",
        precaucoes_restricoes: data.precaucoes_restricoes || "",
        peso_liquido: data.peso_liquido || "",
        prazo_validade: data.prazo_validade || "",
        armazenamento: data.armazenamento || "",
        lote_placeholder: data.lote_placeholder || "LOTE: ___________",
        fabricacao_placeholder: data.fabricacao_placeholder || "FAB: ___/___/______",
        registro_mapa: data.registro_mapa || "",
        razao_social: data.razao_social || "",
        cnpj: data.cnpj || "",
        endereco: data.endereco || "",
        rt_nome: data.rt_nome || "",
        rt_crmv: data.rt_crmv || "",
        sac_contato: data.sac_contato || "",
        largura_mm: data.largura_mm || 100,
        altura_mm: data.altura_mm || 75,
        exibir_tabela_consumo: autoTabela,
      });
    } else {
      await syncFromProduto(true);
    }
    setLoading(false);
  }

  async function syncFromProduto(silent = false) {
    setSyncing(true);
    const { data: prod } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
    if (prod) {
      const extracted = extractFromProduto(prod);
      setRotulo((prev) => ({ ...prev, ...extracted }));
      setNiveisObj((prod.niveis_garantia as Record<string, any>) || {});
      if (!silent) toast.success("Dados sincronizados do cadastro do produto!");
    }
    setSyncing(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const { exibir_tabela_consumo, ...rotuloToSave } = rotulo;
    const payload = {
      user_id: user.id,
      produto_id: produtoId,
      ...rotuloToSave,
    };

    const { error } = rotuloId
      ? await supabase.from("rotulos").update(payload).eq("id", rotuloId)
      : await supabase.from("rotulos").insert(payload).select("id").single().then(({ data, error }) => {
          if (data) setRotuloId(data.id);
          return { error };
        });

    if (error) toast.error("Erro: " + error.message);
    else toast.success("Rótulo salvo!");
    setSaving(false);
  }

  function generateZPL(): string {
    const w = rotulo.largura_mm;
    const h = rotulo.altura_mm;
    const dotsW = w * 8;
    const dotsH = h * 8;

    let zpl = `^XA\n^PW${dotsW}\n^LL${dotsH}\n^CF0,28\n`;
    let y = 30;
    const lineH = 32;
    const x = 20;

    zpl += `^FO${x},${y}^A0N,36,36^FD${rotulo.nome_comercial}^FS\n`;
    y += 44;
    zpl += `^FO${x},${y}^A0N,24,24^FD${rotulo.classificacao_label}^FS\n`;
    y += lineH;
    zpl += `^FO${x},${y}^GB${dotsW - 40},2,2^FS\n`;
    y += 10;

    const compShort = rotulo.composicao_ingredientes.substring(0, 120);
    zpl += `^FO${x},${y}^A0N,18,18^FB${dotsW - 40},3,,^FDCOMP: ${compShort}^FS\n`;
    y += 58;

    const niveisShort = rotulo.niveis_garantia_texto.substring(0, 200);
    zpl += `^FO${x},${y}^A0N,16,16^FB${dotsW - 40},5,,^FDNIVEIS DE GARANTIA POR KG: ${niveisShort}^FS\n`;
    y += 90;

    zpl += `^FO${x},${y}^GB${dotsW - 40},1,1^FS\n`;
    y += 8;
    zpl += `^FO${x},${y}^A0N,20,20^FDPESO LIQ: ${rotulo.peso_liquido}^FS\n`;
    zpl += `^FO${dotsW / 2},${y}^A0N,20,20^FDVAL: ${rotulo.prazo_validade}^FS\n`;
    y += 26;
    zpl += `^FO${x},${y}^A0N,20,20^FD${rotulo.lote_placeholder}^FS\n`;
    zpl += `^FO${dotsW / 2},${y}^A0N,20,20^FD${rotulo.fabricacao_placeholder}^FS\n`;
    y += 26;

    if (rotulo.registro_mapa) {
      zpl += `^FO${x},${y}^A0N,18,18^FDREG. MAPA: ${rotulo.registro_mapa}^FS\n`;
      y += 24;
    }

    zpl += `^FO${x},${y}^A0N,16,16^FD${rotulo.razao_social} - CNPJ: ${rotulo.cnpj}^FS\n`;
    y += 20;
    if (rotulo.endereco) {
      zpl += `^FO${x},${y}^A0N,14,14^FD${rotulo.endereco}^FS\n`;
      y += 18;
    }
    if (rotulo.rt_nome) {
      zpl += `^FO${x},${y}^A0N,16,16^FDRT: ${rotulo.rt_nome} - CRMV: ${rotulo.rt_crmv}^FS\n`;
      y += 20;
    }

    zpl += `^XZ`;
    return zpl;
  }

  function downloadZPL() {
    const zpl = generateZPL();
    const blob = new Blob([zpl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rotulo_${rotulo.nome_comercial.replace(/\s+/g, "_")}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo ZPL baixado para impressora Zebra!");
  }

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Rótulo - ${rotulo.nome_comercial}</title>
      <style>
        @page { size: ${rotulo.largura_mm}mm ${rotulo.altura_mm}mm; margin: 2mm; }
        body { font-family: Arial, sans-serif; font-size: 8pt; margin: 0; padding: 2mm; }
        .label { width: ${rotulo.largura_mm - 4}mm; }
        h2 { font-size: 12pt; margin: 0 0 2mm; }
        h3 { font-size: 9pt; margin: 2mm 0 1mm; }
        p { margin: 0.5mm 0; font-size: 7pt; line-height: 1.3; }
        .small { font-size: 6pt; }
        hr { border: none; border-top: 0.5pt solid #000; margin: 1.5mm 0; }
        .row { display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
        th, td { border: 1px solid #333; padding: 1px 3px; font-size: 6pt; text-align: center; }
        th { background: #e5e5e5; font-weight: bold; }
        td:first-child { text-align: left; }
      </style></head><body>
      <div class="label">${el.innerHTML}</div>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  const updateField = (field: keyof RotuloData, value: any) => {
    setRotulo((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => syncFromProduto()} disabled={syncing}>
          {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Sincronizar do Produto
        </Button>
      </div>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Visualizar Rótulo</TabsTrigger>
          {rotulo.exibir_tabela_consumo && <TabsTrigger value="tabela">Tabela de Consumo</TabsTrigger>}
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Identificação */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Identificação do Produto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome Comercial</Label><Input value={rotulo.nome_comercial} onChange={(e) => updateField("nome_comercial", e.target.value)} /></div>
                <div>
                  <Label className="text-xs">Tipo de Rótulo (IN 22)</Label>
                  <Select value={rotulo.tipo_rotulo} onValueChange={(v) => updateField("tipo_rotulo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="racao">Ração</SelectItem>
                      <SelectItem value="suplemento">Suplemento</SelectItem>
                      <SelectItem value="premix">Premix</SelectItem>
                      <SelectItem value="nucleo">Núcleo</SelectItem>
                      <SelectItem value="aditivo">Aditivo</SelectItem>
                      <SelectItem value="sal_mineral">Sal Mineral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Classificação</Label><Input value={rotulo.classificacao_label} onChange={(e) => updateField("classificacao_label", e.target.value)} placeholder="Ex: RAÇÃO PARA BOVINOS DE CORTE" /></div>
                <div><Label className="text-xs">Espécie / Categoria</Label><Input value={rotulo.especie_categoria} onChange={(e) => updateField("especie_categoria", e.target.value)} /></div>
                <div><Label className="text-xs">Peso Líquido</Label><Input value={rotulo.peso_liquido} onChange={(e) => updateField("peso_liquido", e.target.value)} /></div>
                <div><Label className="text-xs">Prazo de Validade</Label><Input value={rotulo.prazo_validade} onChange={(e) => updateField("prazo_validade", e.target.value)} /></div>
                <div><Label className="text-xs">Registro MAPA</Label><Input value={rotulo.registro_mapa} onChange={(e) => updateField("registro_mapa", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Composição e Garantias */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Composição e Garantias</h3>
              <div>
                <Label className="text-xs">Composição Básica (Ingredientes)</Label>
                <Textarea value={rotulo.composicao_ingredientes} onChange={(e) => updateField("composicao_ingredientes", e.target.value)} rows={3} />
              </div>
              <div>
                <Label className="text-xs">Eventuais Substitutivos</Label>
                <Textarea value={rotulo.eventuais_substitutivos} onChange={(e) => updateField("eventuais_substitutivos", e.target.value)} rows={2} placeholder="Ingredientes que podem substituir os da composição básica..." />
              </div>
              <div>
                <Label className="text-xs">Níveis de Garantia por kg do Produto</Label>
                <Textarea value={rotulo.niveis_garantia_texto} onChange={(e) => updateField("niveis_garantia_texto", e.target.value)} rows={5} placeholder="Gerado automaticamente ao sincronizar do produto" />
                <p className="text-[10px] text-muted-foreground mt-1">Formato IN 22: Nutriente (Mín./Máx.) valor unidade. Editável manualmente.</p>
              </div>
            </CardContent>
          </Card>

          {/* Uso e Precauções */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Uso e Precauções</h3>
              <div><Label className="text-xs">Indicações de Uso</Label><Textarea value={rotulo.indicacoes_uso} onChange={(e) => updateField("indicacoes_uso", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Modo de Usar</Label><Textarea value={rotulo.modo_usar} onChange={(e) => updateField("modo_usar", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Precauções / Restrições</Label><Textarea value={rotulo.precaucoes_restricoes} onChange={(e) => updateField("precaucoes_restricoes", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Armazenamento</Label><Input value={rotulo.armazenamento} onChange={(e) => updateField("armazenamento", e.target.value)} /></div>
            </CardContent>
          </Card>

          {/* Fabricante */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Dados do Fabricante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Razão Social</Label><Input value={rotulo.razao_social} onChange={(e) => updateField("razao_social", e.target.value)} /></div>
                <div><Label className="text-xs">CNPJ</Label><Input value={rotulo.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} /></div>
                <div className="md:col-span-2"><Label className="text-xs">Endereço</Label><Input value={rotulo.endereco} onChange={(e) => updateField("endereco", e.target.value)} /></div>
                <div><Label className="text-xs">RT (Nome)</Label><Input value={rotulo.rt_nome} onChange={(e) => updateField("rt_nome", e.target.value)} /></div>
                <div><Label className="text-xs">CRMV</Label><Input value={rotulo.rt_crmv} onChange={(e) => updateField("rt_crmv", e.target.value)} /></div>
                <div><Label className="text-xs">SAC / Contato</Label><Input value={rotulo.sac_contato} onChange={(e) => updateField("sac_contato", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Consumo toggle */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Tabela de Consumo (Bovinos)</h3>
              <div className="flex items-center gap-3">
                <Switch
                  checked={rotulo.exibir_tabela_consumo}
                  onCheckedChange={(v) => updateField("exibir_tabela_consumo", v)}
                />
                <Label className="text-xs">
                  Exibir tabela de consumo por 100g de suplemento no rótulo
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Ativado automaticamente para Sal Mineral e Suplementos de Bovinos. Mostra macro e microminerais com valores de referência (VR) para 450 kg de peso corporal.
              </p>
            </CardContent>
          </Card>

          {/* Dimensões */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Dimensões da Etiqueta (Zebra ZD220)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Largura (mm)</Label><Input type="number" value={rotulo.largura_mm} onChange={(e) => updateField("largura_mm", parseInt(e.target.value) || 100)} /></div>
                <div><Label className="text-xs">Altura (mm)</Label><Input type="number" value={rotulo.altura_mm} onChange={(e) => updateField("altura_mm", parseInt(e.target.value) || 75)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Padrão ZD220: 100x75mm (203 dpi).</p>
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar Rótulo
            </Button>
            <Button variant="outline" onClick={downloadZPL}>
              <Download className="w-4 h-4 mr-1" /> Exportar ZPL (Zebra)
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir Rótulo
            </Button>
          </div>
        </TabsContent>

        {/* Consumption Table Tab */}
        {rotulo.exibir_tabela_consumo && (
          <TabsContent value="tabela">
            <Card>
              <CardHeader><CardTitle className="text-sm">Tabela de Consumo por 100g de Suplemento</CardTitle></CardHeader>
              <CardContent>
                <TabelaConsumo niveisObj={niveisObj} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader><CardTitle className="text-sm">Pré-visualização do Rótulo (IN 22)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={downloadZPL}>
                  <Download className="w-4 h-4 mr-1" /> ZPL (Zebra)
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" /> Imprimir
                </Button>
              </div>

              <div className="border-2 border-foreground bg-background mx-auto" style={{ maxWidth: "700px", fontFamily: "Arial, sans-serif" }} ref={printRef}>
                {/* Header */}
                <div style={{ display: "flex", borderBottom: "2px solid black" }}>
                  <div style={{ flex: 1, padding: "8px 12px", borderRight: "2px solid black" }}>
                    <p style={{ fontSize: "10px", textAlign: "center", marginBottom: "4px", fontWeight: "bold" }}>
                      {rotulo.classificacao_label || "CLASSIFICAÇÃO DO PRODUTO"}
                    </p>
                    <h2 style={{ fontSize: "18px", fontWeight: "bold", textAlign: "center", margin: "4px 0" }}>
                      {rotulo.nome_comercial || "NOME DO PRODUTO"}
                    </h2>
                  </div>
                  <div style={{ width: "200px", padding: "6px 8px", fontSize: "8px", lineHeight: "1.5" }}>
                    <p style={{ fontWeight: "bold", fontSize: "9px", margin: "0 0 2px" }}>Fabricado por:</p>
                    <p style={{ margin: 0 }}>{rotulo.razao_social}</p>
                    <p style={{ margin: 0 }}>{rotulo.endereco}</p>
                    <p style={{ margin: 0 }}>CNPJ: {rotulo.cnpj}</p>
                    <p style={{ margin: 0, fontWeight: "bold" }}>INDÚSTRIA BRASILEIRA</p>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "8px 12px" }}>
                  {rotulo.composicao_ingredientes && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>COMPOSIÇÃO BÁSICA:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.composicao_ingredientes}</p>
                    </>
                  )}

                  {rotulo.eventuais_substitutivos && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>EVENTUAIS SUBSTITUTIVOS:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.eventuais_substitutivos}</p>
                    </>
                  )}

                  {rotulo.niveis_garantia_texto && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>NÍVEIS DE GARANTIA POR KG DO PRODUTO:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.niveis_garantia_texto}</p>
                    </>
                  )}

                  {rotulo.indicacoes_uso && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>INDICAÇÕES DE USO:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.indicacoes_uso}</p>
                    </>
                  )}

                  {rotulo.modo_usar && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>MODO DE USAR:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.modo_usar}</p>
                    </>
                  )}

                  {rotulo.precaucoes_restricoes && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>RESTRIÇÕES E OUTRAS RECOMENDAÇÕES:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.precaucoes_restricoes}</p>
                    </>
                  )}

                  {rotulo.armazenamento && (
                    <>
                      <p style={{ fontSize: "8px", fontWeight: "bold", margin: "4px 0 2px" }}>CONDIÇÕES DE CONSERVAÇÃO:</p>
                      <p style={{ fontSize: "7.5px", lineHeight: "1.4", margin: "0 0 4px" }}>{rotulo.armazenamento}</p>
                    </>
                  )}

                  {/* Consumption Table in preview */}
                  {rotulo.exibir_tabela_consumo && (
                    <TabelaConsumoPreview niveisObj={niveisObj} />
                  )}

                  <hr style={{ borderTop: "1px solid black", margin: "6px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: "4px" }}>
                    <span><strong>PESO LÍQ:</strong> {rotulo.peso_liquido}</span>
                    <span><strong>VALIDADE:</strong> {rotulo.prazo_validade}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: "4px" }}>
                    <span>{rotulo.lote_placeholder}</span>
                    <span>{rotulo.fabricacao_placeholder}</span>
                  </div>

                  {rotulo.registro_mapa && <p style={{ fontSize: "7.5px", marginTop: "4px" }}><strong>Registro no MAPA Nº:</strong> {rotulo.registro_mapa}</p>}

                  <hr style={{ borderTop: "1px solid black", margin: "6px 0" }} />

                  <div style={{ textAlign: "center", fontSize: "8px" }}>
                    <p style={{ fontWeight: "bold", margin: "2px 0" }}>INDÚSTRIA BRASILEIRA</p>
                    {rotulo.registro_mapa
                      ? <p style={{ margin: "2px 0" }}>Produto Registrado no Ministério da Agricultura, Pecuária e Abastecimento.</p>
                      : <p style={{ margin: "2px 0" }}>Produto Isento de Registro no Ministério da Agricultura, Pecuária e Abastecimento.</p>
                    }
                  </div>

                  {rotulo.rt_nome && (
                    <p style={{ fontSize: "7px", textAlign: "center", marginTop: "4px" }}>
                      RT: {rotulo.rt_nome} — CRMV: {rotulo.rt_crmv}
                    </p>
                  )}
                  {rotulo.sac_contato && <p style={{ fontSize: "7px", textAlign: "center" }}>SAC: {rotulo.sac_contato}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
