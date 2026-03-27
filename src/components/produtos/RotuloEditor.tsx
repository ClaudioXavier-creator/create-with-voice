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
  largura_mm: 200, altura_mm: 100,
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

// ──── Reference values for 450kg bovine maintenance (NRC / IN 12/2004) ────
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

// ──── Example product data from uploaded DOCX models ────
const EXEMPLO_RACAO: { rotulo: Partial<RotuloData>; niveis: Record<string, any> } = {
  rotulo: {
    tipo_rotulo: "racao",
    nome_comercial: "RAÇÃO HGM LAC 24",
    classificacao_label: "RAÇÃO PARA VACAS EM LACTAÇÃO",
    especie_categoria: "BOVINOS – VACAS EM LACTAÇÃO",
    composicao_ingredientes: "Casca de soja, Milho integral moído (Espécie doadora do gene Agrobacterium thumefaciens, Bacillus thuringiensis, Streptomyces viridochromogenes, Zea mays), Farelo de Algodão (Espécie doadora do gene Agrobacterium thumefaciens, Bacillus thuringiensis, Streptomyces higroscópicos, Streptomyces viridochromogenes, Zea mays), farelo de soja (Espécie doadora do gene Agrobacterium thumefaciens, Arabidopsis thaliana, Bacillus thuringiensis, Streptomyces viridochromogenes), calcário calcitico, cloreto de sódio (sal comum), enxofre ventilado (flor de enxofre), fosfato bicálcico, iodato de cálcio, óxido de magnésio, selenito de sódio, sulfato de cobalto, sulfato de cobre, sulfato de manganês, sulfato de zinco, vitamina A, vitamina D3, vitamina E, BHT (hidróxido de tolueno butilado), monensina sódica.",
    eventuais_substitutivos: "DDG (Espécie doadora do gene Agrobacterium thumefaciens, Bacillus thuringiensis, Streptomyces viridochromogenes, Zea mays), milheto, sorgo integral moído, carbonato de cálcio, fosfato monobicálcico, iodato de potássio, monóxido de manganês, óxido de zinco, vitamina A/D3.",
    niveis_garantia_texto: "Umidade (Máx.) 130 g/Kg; Proteína Bruta (Mín.) 240 g/Kg; Extrato Etéreo (Mín.) 35 g/Kg; FDA (Máx.) 120 g/Kg; Matéria Fibrosa (Máx.) 80 g/Kg; Cálcio (Mín.) 8.000 mg/Kg; Cálcio (Máx.) 11 g/Kg; Enxofre (Mín.) 1.600 mg/Kg; Fósforo (Mín.) 4.800 mg/Kg; Cobalto (Mín.) 0,9 mg/Kg; Cobre (Mín.) 28,5 mg/Kg; Iodo (Mín.) 1,2 mg/Kg; Magnésio (Mín.) 4.500 mg/Kg; Manganês (Mín.) 47 mg/Kg; Monensina Sódica 30 mg/Kg; NDT (Mín.) 750 g/Kg; Selênio (Mín.) 0,70 mg/Kg; Sódio (Mín.) 2.100 mg/Kg; Vitamina A (Mín.) 6.600 U.I./Kg; Vitamina D3 (Mín.) 1.500 U.I./Kg; Vitamina E (Mín.) 30 U.I./Kg; Zinco (Mín.) 90 mg/Kg.",
    indicacoes_uso: "Ração para vacas leiteiras em todos os estágios da lactação.",
    modo_usar: "A ração já está pronta para o uso, ou seja, não é preciso ser misturada a outras matérias-primas; fornecer 1,0 kg de ração para cada 3 litros de leite produzidos ou de acordo com as recomendações de um técnico responsável.",
    precaucoes_restricoes: "Este produto contém Ionóforo: Não permitir que cavalos ou outros equídeos tenham acesso a rações contendo Monensina, pois a ingestão pode ser fatal.",
    armazenamento: "Conservar em local seco e arejado, afastado de piso e paredes e de preferência sobre estrados, evitar presença de insetos e roedores.",
    peso_liquido: "40 kg",
    prazo_validade: "6 meses a partir da data de fabricação",
    razao_social: "Agro Campo EIRELI-M. E.",
    cnpj: "10.957.552/0001-46",
    endereco: "AV. CAETANO LUIZ DE SOUZA S/N QDA 8 LT 06 – JARDIM SANTA FÉ – ABADIANIA GO – CEP: 72.940-000",
    registro_mapa: "",
    exibir_tabela_consumo: false,
  },
  niveis: {},
};

const EXEMPLO_PROTEINADO: { rotulo: Partial<RotuloData>; niveis: Record<string, any> } = {
  rotulo: {
    tipo_rotulo: "suplemento",
    nome_comercial: "HGM PROT+ 300",
    classificacao_label: "SUPLEMENTO MINERAL PROTEICO DE PRONTO USO – BOVINOS DE CORTE",
    especie_categoria: "BOVINOS DE CORTE",
    composicao_ingredientes: "CALCÁRIO CALCÍTICO, CLORETO DE SÓDIO (SAL COMUM 9,60%), ENXOFRE VENTILADO (FLOR DE ENXOFRE), FARELO DE SOJA, FOSFATO BICÁLCICO, IODATO DE CÁLCIO, MILHO INTEGRAL MOÍDO, ÓXIDO DE MAGNÉSIO, SELENITO DE SÓDIO, SULFATO DE COBALTO, SULFATO DE COBRE, SULFATO DE MANGANÊS, SULFATO DE ZINCO, CAULIM MICRO, URÉIA PECUÁRIA, MONENSINA SÓDICA.",
    eventuais_substitutivos: "DDG, Farelo de Algodão, casca de soja, milheto, sorgo integral moído, carbonato de cálcio, fosfato monobicálcico, iodato de potássio, monóxido de manganês, óxido de zinco.",
    niveis_garantia_texto: "Cálcio (Mín.) 20,00 g; Cálcio (Máx.) 40,00 g; Cobalto (Mín.) 21,60 mg; Cobre (Mín.) 374,40 mg; Enxofre (Mín.) 4.176,00 mg; Flúor (Máx.) 120,00 mg; Fósforo (Mín.) 12,490 g; Iodo (Mín.) 24,00 mg; Magnésio (Mín.) 4.720,00 mg; Manganês (Mín.) 355,00 mg; Monensina 200,00 mg; Proteína Bruta (Mín.) 300,00 g; NNP Equiv. Proteína (Máx.) 225 g; NDT (Mín.) 450,00 g; Selênio (Mín.) 6,72 mg; Sódio (Mín.) 79,50 g; Zinco (Mín.) 1.200,00 mg.",
    indicacoes_uso: "PRODUTO DESTINADO À SUPLEMENTAÇÃO DE MINERAIS E PROTEÍNAS PARA BOVINOS DE CORTE NAS FASES DE CRIA, RECRIA E ENGORDA.",
    modo_usar: "ADAPTAÇÃO: 1 a 7 dias misturar com sal mineralizado sem uréia em partes iguais. Após 7 dias: servir puro. Fornecer à vontade em cocho coberto. Faixa recomendada: 100 g para cada 100 kg de peso corporal/dia.",
    precaucoes_restricoes: "CUIDADOS AO USAR PRODUTO COM URÉIA: Servir sempre em cochos cobertos, manter boa disponibilidade de pasto, não fornecer para animais em jejum, famintos e debilitados. RESTRIÇÃO: Não permitir que equídeos tenham acesso a produtos contendo monensina. A ingestão pode ser fatal.",
    armazenamento: "Conservar em local seco e arejado, afastado de piso e paredes.",
    peso_liquido: "30 kg",
    prazo_validade: "6 meses a partir da data de fabricação",
    razao_social: "Agro Campo EIRELI-M. E.",
    cnpj: "10.957.552/0001-46",
    endereco: "AV. CAETANO LUIZ DE SOUZA S/N QDA 8 LT 06 – JARDIM SANTA FÉ – ABADIANIA GO – CEP: 72.940-000",
    registro_mapa: "",
    exibir_tabela_consumo: true,
  },
  niveis: {
    calcio: { min: "20.00", max: "40.00", unit: "g/kg" },
    fosforo: { min: "12.49", unit: "g/kg" },
    sodio: { min: "79.50", unit: "g/kg" },
    magnesio: { min: "4.72", unit: "g/kg" },
    enxofre: { min: "4.176", unit: "g/kg" },
    cobalto: { min: "21.60", unit: "mg/kg" },
    cobre: { min: "374.40", unit: "mg/kg" },
    iodo: { min: "24.00", unit: "mg/kg" },
    manganes: { min: "355.00", unit: "mg/kg" },
    selenio: { min: "6.72", unit: "mg/kg" },
    zinco: { min: "1200.00", unit: "mg/kg" },
    consumo_pb: { min: "300" },
    consumo_ndt: { min: "450" },
  },
};

const EXEMPLO_SAL_MINERAL: { rotulo: Partial<RotuloData>; niveis: Record<string, any> } = {
  rotulo: {
    tipo_rotulo: "sal_mineral",
    nome_comercial: "SAL HGM 60",
    classificacao_label: "SUPLEMENTO MINERAL DE PRONTO USO PARA BOVINOS DE CORTE",
    especie_categoria: "BOVINOS DE CORTE",
    composicao_ingredientes: "CALCÁRIO CALCÍTICO, CLORETO DE SÓDIO (SAL COMUM), ENXOFRE VENTILADO (FLOR DE ENXOFRE), FOSFATO BICÁLCICO, IODATO DE CÁLCIO, ÓXIDO DE MAGNÉSIO, SULFATO DE ZINCO, SELENITO DE SÓDIO, SULFATO DE COBALTO, SULFATO DE COBRE, SULFATO DE MANGANÊS, CAULIM MICRO.",
    eventuais_substitutivos: "CARBONATO DE CÁLCIO, IODATO DE POTÁSSIO, MONÓXIDO DE MANGANÊS, ÓXIDO DE ZINCO.",
    niveis_garantia_texto: "Cálcio (Mín.) 120,00 g/kg; Cálcio (Máx.) 180,00 g/kg; Cobalto (Mín.) 54,00 mg/kg; Cobre (Mín.) 936,00 mg/kg; Enxofre (Mín.) 10,00 g/kg; Flúor (Máx.) 610,00 mg/kg; Fósforo (Mín.) 60,00 g/kg; Iodo (Mín.) 60,00 mg/kg; Magnésio (Mín.) 14,40 g/kg; Manganês (Mín.) 990,00 mg/kg; Selênio (Mín.) 16,80 mg/kg; Sódio (Mín.) 134,00 g/kg; Zinco (Mín.) 3.000,00 mg/kg.",
    indicacoes_uso: "Suplemento mineral pronto para uso para bovinos de corte.",
    modo_usar: "Fornecer Sal HGM 60 puro em cochos cobertos, com espaço satisfatório e sem interrupção do fornecimento. Consumo diário mínimo: 70g por 450kg de peso corporal.",
    precaucoes_restricoes: "Não há.",
    armazenamento: "Conservar em local seco e arejado, afastado de piso e paredes e de preferência sobre estrados, evitar presença de insetos e roedores.",
    peso_liquido: "30 kg",
    prazo_validade: "6 meses a partir da data de fabricação",
    razao_social: "Agro Campo EIRELI-M. E.",
    cnpj: "10.957.552/0001-46",
    endereco: "AV. CAETANO LUIZ DE SOUZA S/N QDA 8 LT 06 – JARDIM SANTA FÉ – ABADIANIA GO – CEP: 72.940-000",
    registro_mapa: "",
    exibir_tabela_consumo: true,
  },
  niveis: {
    calcio: { min: "120.00", max: "180.00", unit: "g/kg" },
    fosforo: { min: "60.00", unit: "g/kg" },
    sodio: { min: "134.00", unit: "g/kg" },
    magnesio: { min: "14.40", unit: "g/kg" },
    enxofre: { min: "10.00", unit: "g/kg" },
    cobalto: { min: "54.00", unit: "mg/kg" },
    cobre: { min: "936.00", unit: "mg/kg" },
    iodo: { min: "60.00", unit: "mg/kg" },
    manganes: { min: "990.00", unit: "mg/kg" },
    selenio: { min: "16.80", unit: "mg/kg" },
    zinco: { min: "3000.00", unit: "mg/kg" },
  },
};

function shouldShowConsumptionTable(tipo: string, especie: string): boolean {
  const tiposValidos = ["sal_mineral", "suplemento"];
  const isBovino = especie.toLowerCase().includes("bovin");
  return tiposValidos.includes(tipo) && isBovino;
}

function calcQtdPer100g(niveisObj: Record<string, any>, key: string, refUnit: string): number | null {
  const nutrient = niveisObj[key];
  if (!nutrient || typeof nutrient !== "object") return null;
  const rawVal = parseFloat(nutrient.min || nutrient.max || "0");
  if (!rawVal) return null;
  const nutUnit = (nutrient.unit || "").toLowerCase();
  let valPer100g = rawVal / 10;
  if (refUnit.includes("g/dia") && nutUnit.includes("mg")) valPer100g = valPer100g / 1000;
  if (refUnit.includes("mg/dia") && nutUnit.includes("g/")) valPer100g = valPer100g * 1000;
  return valPer100g;
}

function formatNiveisIN22(niveisObj: Record<string, any>): string {
  const lines: string[] = [];
  Object.entries(niveisObj).forEach(([key, val]) => {
    if (key.startsWith("_") || key === "consumo_pb" || key === "consumo_ndt") return;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (typeof val === "object" && val !== null) {
      const { min, max, unit } = val as { min?: string; max?: string; unit?: string };
      const u = unit || "";
      if (min && max) lines.push(`${label} (Mín.) ${min} ${u}; ${label} (Máx.) ${max} ${u}`);
      else if (min) lines.push(`${label} (Mín.) ${min} ${u}`);
      else if (max) lines.push(`${label} (Máx.) ${max} ${u}`);
    } else if (val) lines.push(`${label}: ${val}`);
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

// ──── Consumption table UI sub-component ────
function TabelaConsumo({ niveisObj }: { niveisObj: Record<string, any> }) {
  const consumoPB = niveisObj.consumo_pb;
  const consumoNDT = niveisObj.consumo_ndt;

  const renderRow = (ref: typeof VR_MACRO[0]) => {
    const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
    const pct = qtd !== null && ref.vr > 0 ? ((qtd / ref.vr) * 100) : null;
    return (
      <TableRow key={ref.key}>
        <TableCell className="py-1 text-xs">{ref.mineral}</TableCell>
        <TableCell className="py-1 text-xs text-center">{ref.vr}</TableCell>
        <TableCell className="py-1 text-xs text-center">{qtd !== null ? qtd.toFixed(2) : "–"}</TableCell>
        <TableCell className="py-1 text-xs text-center">{pct !== null ? pct.toFixed(2) : "–"}</TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-3">
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
                  {parseFloat(consumoPB.min || "0") ? (parseFloat(consumoPB.min) / 10).toFixed(1) : "–"}
                </TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoPB.min || "0") ? ((parseFloat(consumoPB.min) / 10 / 550) * 100).toFixed(2) : "–"}
                </TableCell>
              </TableRow>
            )}
            {consumoNDT && typeof consumoNDT === "object" && (
              <TableRow>
                <TableCell className="py-1 text-xs">Consumo em NDT</TableCell>
                <TableCell className="py-1 text-xs text-center">4000</TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoNDT.min || "0") ? (parseFloat(consumoNDT.min) / 10).toFixed(1) : "–"}
                </TableCell>
                <TableCell className="py-1 text-xs text-center">
                  {parseFloat(consumoNDT.min || "0") ? ((parseFloat(consumoNDT.min) / 10 / 4000) * 100).toFixed(2) : "–"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <div>
        <p className="text-xs font-bold mb-1">MACROMINERAIS (g/dia)</p>
        <Table><TableHeader><TableRow>
          <TableHead className="py-1 text-xs">Mineral</TableHead>
          <TableHead className="py-1 text-xs text-center">VR¹</TableHead>
          <TableHead className="py-1 text-xs text-center">Qtd/100g</TableHead>
          <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
        </TableRow></TableHeader><TableBody>{VR_MACRO.map(renderRow)}</TableBody></Table>
      </div>
      <div>
        <p className="text-xs font-bold mb-1">MICROMINERAIS (mg/dia)</p>
        <Table><TableHeader><TableRow>
          <TableHead className="py-1 text-xs">Mineral</TableHead>
          <TableHead className="py-1 text-xs text-center">VR¹</TableHead>
          <TableHead className="py-1 text-xs text-center">Qtd/100g</TableHead>
          <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
        </TableRow></TableHeader><TableBody>{VR_MICRO.map(renderRow)}</TableBody></Table>
      </div>
      <div>
        <p className="text-xs font-bold mb-1">VITAMINAS (UI/dia)</p>
        <Table><TableHeader><TableRow>
          <TableHead className="py-1 text-xs">Vitamina</TableHead>
          <TableHead className="py-1 text-xs text-center">VR¹</TableHead>
          <TableHead className="py-1 text-xs text-center">Qtd/100g</TableHead>
          <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
        </TableRow></TableHeader><TableBody>{VR_VITAMINAS.map(renderRow)}</TableBody></Table>
      </div>
      <p className="text-[9px] text-muted-foreground italic">
        ¹ Valor diário de referência para manutenção de um animal de 450 kg de peso corporal (IN 12/2004 – MAPA).
      </p>
    </div>
  );
}

// ──── Build print-ready HTML for the label ────
function buildPrintHTML(rotulo: RotuloData, niveisObj: Record<string, any>): string {
  const hasTable = rotulo.exibir_tabela_consumo;

  // Helper: build consumption table HTML
  const buildTableHTML = () => {
    const cellS = 'border:1px solid #333;padding:1px 3px;font-size:6.5pt;text-align:center;';
    const headerS = cellS + 'font-weight:bold;background:#e5e5e5;';
    const leftS = cellS + 'text-align:left;';

    const renderRows = (refs: typeof VR_MACRO) => refs.map(ref => {
      const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
      const pct = qtd !== null && ref.vr > 0 ? ((qtd / ref.vr) * 100) : null;
      return `<tr><td style="${leftS}">${ref.mineral}</td><td style="${cellS}">${ref.vr}</td><td style="${cellS}">${qtd !== null ? qtd.toFixed(2) : '–'}</td><td style="${cellS}">${pct !== null ? pct.toFixed(2) : '–'}</td></tr>`;
    }).join('');

    const consumoPB = niveisObj.consumo_pb;
    const consumoNDT = niveisObj.consumo_ndt;
    let pbNdtRows = '';
    if (consumoPB && typeof consumoPB === 'object' && parseFloat(consumoPB.min || '0')) {
      const v = parseFloat(consumoPB.min) / 10;
      pbNdtRows += `<tr><td style="${leftS}">Consumo em PB (g/dia)</td><td style="${cellS}" colspan="3">${v.toFixed(0)}</td></tr>`;
    }
    if (consumoNDT && typeof consumoNDT === 'object' && parseFloat(consumoNDT.min || '0')) {
      const v = parseFloat(consumoNDT.min) / 10;
      pbNdtRows += `<tr><td style="${leftS}">Consumo em NDT (g/dia)</td><td style="${cellS}" colspan="3">${v.toFixed(0)}</td></tr>`;
    }

    return `
      <div style="padding:4px;">
        <p style="font-size:9pt;font-weight:bold;text-align:center;margin:0 0 4px;">TABELA VALOR DE REFERÊNCIA</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:3px;">
          <thead><tr>
            <th style="${headerS}">GARANTIA</th>
            <th style="${headerS}">VALOR REFERÊNCIA (VR)¹</th>
            <th style="${headerS}">QUANTIDADE POR 100 G DE SUPLEMENTO</th>
            <th style="${headerS}">QUANTIDADE % DO VR POR 100 G SUPLEMENTO</th>
          </tr></thead>
          <tbody>${pbNdtRows}</tbody>
        </table>
        <p style="font-size:6.5pt;font-weight:bold;margin:3px 0 1px;">MACROMINERAIS (g/dia)</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:2px;">
          <tbody>${renderRows(VR_MACRO)}</tbody>
        </table>
        <p style="font-size:6.5pt;font-weight:bold;margin:3px 0 1px;">MICROMINERAIS (mg/dia)</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:2px;">
          <tbody>${renderRows(VR_MICRO)}</tbody>
        </table>
        <p style="font-size:6.5pt;font-weight:bold;margin:3px 0 1px;">VITAMINAS (UI/dia)</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:2px;">
          <tbody>${renderRows(VR_VITAMINAS)}</tbody>
        </table>
        <p style="font-size:5.5pt;font-style:italic;margin:2px 0 0;">¹ Valor diário de referência para manutenção de um animal de 450 kg de peso corporal</p>
      </div>
    `;
  };

  // Helper: build section
  const section = (title: string, content: string) => {
    if (!content) return '';
    return `<p style="font-size:7pt;font-weight:bold;margin:3px 0 1px;">${title}</p><p style="font-size:6.5pt;line-height:1.35;margin:0 0 2px;text-align:justify;">${content}</p>`;
  };

  const bodyContent = `
    ${section('COMPOSIÇÃO BÁSICA:', rotulo.composicao_ingredientes)}
    ${section('EVENTUAIS SUBSTITUTIVOS:', rotulo.eventuais_substitutivos)}
    ${section('NÍVEIS DE GARANTIA POR KG DO PRODUTO:', rotulo.niveis_garantia_texto)}
    ${section('INDICAÇÕES DE USO:', rotulo.indicacoes_uso)}
    ${section('MODO DE USAR:', rotulo.modo_usar)}
    ${section('RESTRIÇÕES E OUTRAS RECOMENDAÇÕES:', rotulo.precaucoes_restricoes)}
    ${section('CONDIÇÕES DE CONSERVAÇÃO:', rotulo.armazenamento)}
  `;

  const footerCenter = `
    <div style="text-align:center;font-size:7pt;margin-top:4px;border-top:1px solid #000;padding-top:3px;">
      <p style="font-weight:bold;margin:1px 0;">INDÚSTRIA BRASILEIRA</p>
      <p style="margin:1px 0;">${rotulo.registro_mapa
        ? 'Produto Registrado no Ministério da Agricultura, Pecuária e Abastecimento.'
        : 'Produto Isento de Registro no Ministério da Agricultura, Pecuária e Abastecimento.'
      }</p>
    </div>
  `;

  const leftColumnWidth = hasTable ? '55%' : '100%';

  return `
    <div style="width:${rotulo.largura_mm - 4}mm;font-family:Arial,Helvetica,sans-serif;border:2px solid #000;box-sizing:border-box;">
      <!-- HEADER -->
      <div style="display:flex;border-bottom:2px solid #000;">
        <div style="flex:1;padding:4px 8px;border-right:1px solid #000;">
          <p style="font-size:7.5pt;text-align:center;margin:0 0 2px;font-weight:bold;">${rotulo.classificacao_label}</p>
          <p style="font-size:16pt;font-weight:bold;text-align:center;margin:2px 0;">${rotulo.nome_comercial}</p>
        </div>
        <div style="width:35%;padding:4px 6px;font-size:6.5pt;line-height:1.5;">
          <p style="font-weight:bold;font-size:7pt;margin:0 0 1px;">Fabricado por:</p>
          <p style="margin:0;">${rotulo.razao_social}</p>
          <p style="margin:0;">${rotulo.endereco}</p>
          <p style="margin:0;">CNPJ: ${rotulo.cnpj}</p>
          <p style="margin:0;font-weight:bold;">INDÚSTRIA BRASILEIRA</p>
        </div>
      </div>

      <!-- BODY -->
      <div style="display:flex;">
        <!-- Left column: text content -->
        <div style="width:${leftColumnWidth};padding:4px 8px;${hasTable ? 'border-right:1px solid #000;' : ''}">
          ${bodyContent}

          <div style="border-top:0.5pt solid #000;margin-top:3px;padding-top:2px;font-size:6.5pt;">
            <div style="display:flex;justify-content:space-between;margin-bottom:1px;">
              <span><strong>PESO LÍQ:</strong> ${rotulo.peso_liquido}</span>
              <span><strong>VALIDADE:</strong> ${rotulo.prazo_validade}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:1px;">
              <span>${rotulo.lote_placeholder}</span>
              <span>${rotulo.fabricacao_placeholder}</span>
            </div>
            ${rotulo.registro_mapa ? `<p style="margin:1px 0;"><strong>Registro MAPA Nº:</strong> ${rotulo.registro_mapa}</p>` : ''}
            ${rotulo.rt_nome ? `<p style="margin:1px 0;">RT: ${rotulo.rt_nome} – CRMV: ${rotulo.rt_crmv}</p>` : ''}
            ${rotulo.sac_contato ? `<p style="margin:1px 0;">SAC: ${rotulo.sac_contato}</p>` : ''}
          </div>

          ${footerCenter}
        </div>

        ${hasTable ? `
          <!-- Right column: consumption table -->
          <div style="width:45%;">
            ${buildTableHTML()}
          </div>
        ` : ''}
      </div>
    </div>
  `;
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
    const { data: prod } = await supabase.from("produtos").select("niveis_garantia, classificacao, especie_alvo").eq("id", produtoId).single();
    if (prod) setNiveisObj((prod.niveis_garantia as Record<string, any>) || {});

    const { data } = await supabase.from("rotulos").select("*").eq("produto_id", produtoId).maybeSingle();

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
        largura_mm: data.largura_mm || 200,
        altura_mm: data.altura_mm || 100,
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
    const payload = { user_id: user.id, produto_id: produtoId, ...rotuloToSave };

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
    const hasTable = rotulo.exibir_tabela_consumo;
    const textColW = hasTable ? Math.floor(dotsW * 0.55) : dotsW;
    const tableColX = textColW + 10;
    const x = 20;
    const maxFB = textColW - 40;

    const lines: string[] = [];
    let y = 20;

    const addLine = (text: string, fontH: number, fontW: number, maxLines = 1, customX = x, customFB = maxFB) => {
      if (!text) return;
      if (maxLines > 1) {
        lines.push(`^FO${customX},${y}^A0N,${fontH},${fontW}^FB${customFB},${maxLines},,^FD${text}^FS`);
        y += fontH * maxLines + 2;
      } else {
        lines.push(`^FO${customX},${y}^A0N,${fontH},${fontW}^FD${text}^FS`);
        y += fontH + 4;
      }
    };

    const addSep = () => { lines.push(`^FO${x},${y}^GB${maxFB},1,1^FS`); y += 6; };

    const addSection = (title: string, content: string, contentLines = 3) => {
      if (!content) return;
      addLine(title, 16, 16);
      y -= 2;
      addLine(content, 14, 14, contentLines);
    };

    // ── Header (full width) ──
    // Classification + Name on left, Manufacturer on right
    lines.push(`^FO${x},${y}^A0N,16,16^FB${textColW - 40},1,,^FD${rotulo.classificacao_label}^FS`);
    // Manufacturer block at right
    const mfX = hasTable ? tableColX : Math.floor(dotsW * 0.65);
    lines.push(`^FO${mfX},${y}^A0N,14,14^FDFabricado por:^FS`);
    y += 18;
    lines.push(`^FO${x},${y}^A0N,28,28^FB${textColW - 40},1,,^FD${rotulo.nome_comercial}^FS`);
    lines.push(`^FO${mfX},${y}^A0N,12,12^FD${rotulo.razao_social}^FS`);
    y += 16;
    lines.push(`^FO${mfX},${y}^A0N,12,12^FD${rotulo.endereco}^FS`);
    y += 14;
    lines.push(`^FO${mfX},${y}^A0N,12,12^FDCNPJ: ${rotulo.cnpj}^FS`);
    y += 14;
    lines.push(`^FO${mfX},${y}^A0N,12,12^FDINDUSTRIA BRASILEIRA^FS`);
    y = 90; // normalize after header

    // Separator across full width
    lines.push(`^FO${x},${y}^GB${dotsW - 40},2,2^FS`);
    y += 8;

    // ── Body (left column) ──
    addSection("COMPOSICAO BASICA:", rotulo.composicao_ingredientes, 4);
    addSection("EVENTUAIS SUBSTITUTIVOS:", rotulo.eventuais_substitutivos, 2);
    addSection("NIVEIS DE GARANTIA POR KG DO PRODUTO:", rotulo.niveis_garantia_texto, 5);
    addSection("INDICACOES DE USO:", rotulo.indicacoes_uso, 2);
    addSection("MODO DE USAR:", rotulo.modo_usar, 3);
    addSection("RESTRICOES E OUTRAS RECOMENDACOES:", rotulo.precaucoes_restricoes, 2);
    if (rotulo.armazenamento) addSection("CONDICOES DE CONSERVACAO:", rotulo.armazenamento, 1);

    addSep();

    // Peso / Validade
    lines.push(`^FO${x},${y}^A0N,14,14^FDPESO LIQ: ${rotulo.peso_liquido}^FS`);
    lines.push(`^FO${Math.floor(textColW / 2)},${y}^A0N,14,14^FDVAL: ${rotulo.prazo_validade}^FS`);
    y += 18;
    lines.push(`^FO${x},${y}^A0N,14,14^FD${rotulo.lote_placeholder}^FS`);
    lines.push(`^FO${Math.floor(textColW / 2)},${y}^A0N,14,14^FD${rotulo.fabricacao_placeholder}^FS`);
    y += 18;
    if (rotulo.registro_mapa) { addLine(`REG. MAPA: ${rotulo.registro_mapa}`, 14, 14); }
    if (rotulo.rt_nome) { addLine(`RT: ${rotulo.rt_nome} - CRMV: ${rotulo.rt_crmv}`, 12, 12); }
    if (rotulo.sac_contato) { addLine(`SAC: ${rotulo.sac_contato}`, 12, 12); }

    addSep();
    addLine("INDUSTRIA BRASILEIRA", 14, 14);
    addLine(rotulo.registro_mapa ? "Produto Registrado no MAPA" : "Produto Isento de Registro no MAPA", 12, 12);

    // ── Right column: consumption table (ZPL grid) ──
    if (hasTable) {
      const tX = tableColX;
      const tW = dotsW - tableColX - 20;
      let tY = 96;
      const colW = [Math.floor(tW * 0.28), Math.floor(tW * 0.24), Math.floor(tW * 0.24), Math.floor(tW * 0.24)];

      // Table title
      lines.push(`^FO${tX},${tY}^A0N,16,16^FB${tW},1,,^FDTABELA VALOR DE REFERENCIA^FS`);
      tY += 20;

      // Header row
      const headers = ["GARANTIA", "VR¹", "QTD/100G", "% VR"];
      let cx = tX;
      headers.forEach((h, i) => {
        lines.push(`^FO${cx},${tY}^A0N,12,10^FB${colW[i]},1,,^FD${h}^FS`);
        cx += colW[i];
      });
      tY += 16;
      lines.push(`^FO${tX},${tY}^GB${tW},1,1^FS`);
      tY += 4;

      // PB / NDT
      const consumoPB = niveisObj.consumo_pb;
      const consumoNDT = niveisObj.consumo_ndt;
      if (consumoPB && typeof consumoPB === "object" && parseFloat(consumoPB.min || "0")) {
        const v = (parseFloat(consumoPB.min) / 10).toFixed(0);
        lines.push(`^FO${tX},${tY}^A0N,11,10^FDConsumo PB (g/dia)^FS`);
        lines.push(`^FO${tX + colW[0]},${tY}^A0N,11,10^FD550^FS`);
        lines.push(`^FO${tX + colW[0] + colW[1]},${tY}^A0N,11,10^FD${v}^FS`);
        tY += 14;
      }
      if (consumoNDT && typeof consumoNDT === "object" && parseFloat(consumoNDT.min || "0")) {
        const v = (parseFloat(consumoNDT.min) / 10).toFixed(0);
        lines.push(`^FO${tX},${tY}^A0N,11,10^FDConsumo NDT (g/dia)^FS`);
        lines.push(`^FO${tX + colW[0]},${tY}^A0N,11,10^FD4000^FS`);
        lines.push(`^FO${tX + colW[0] + colW[1]},${tY}^A0N,11,10^FD${v}^FS`);
        tY += 14;
      }

      // Macro/Micro/Vitaminas
      const allGroups = [
        { label: "MACROMINERAIS (g/dia)", refs: VR_MACRO },
        { label: "MICROMINERAIS (mg/dia)", refs: VR_MICRO },
        { label: "VITAMINAS (UI/dia)", refs: VR_VITAMINAS },
      ];

      allGroups.forEach(grp => {
        tY += 4;
        lines.push(`^FO${tX},${tY}^A0N,12,10^FD${grp.label}^FS`);
        tY += 14;
        grp.refs.forEach(ref => {
          const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
          const pct = qtd !== null && ref.vr > 0 ? ((qtd / ref.vr) * 100) : null;
          let cx2 = tX;
          lines.push(`^FO${cx2},${tY}^A0N,11,10^FD${ref.mineral}^FS`);
          cx2 += colW[0];
          lines.push(`^FO${cx2},${tY}^A0N,11,10^FD${ref.vr}^FS`);
          cx2 += colW[1];
          lines.push(`^FO${cx2},${tY}^A0N,11,10^FD${qtd !== null ? qtd.toFixed(2) : '--'}^FS`);
          cx2 += colW[2];
          lines.push(`^FO${cx2},${tY}^A0N,11,10^FD${pct !== null ? pct.toFixed(2) : '--'}^FS`);
          tY += 13;
        });
      });

      tY += 4;
      lines.push(`^FO${tX},${tY}^A0N,10,9^FB${tW},2,,^FD1: VR para manutencao de animal de 450 kg^FS`);
    }

    const finalH = Math.max(dotsH, y + 20);
    let zpl = `^XA\n^PW${dotsW}\n^LL${finalH}\n^CF0,16\n`;
    zpl += lines.join("\n") + "\n^XZ";
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
    const html = buildPrintHTML(rotulo, niveisObj);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Rótulo – ${rotulo.nome_comercial}</title>
      <style>
        @page { size: ${rotulo.largura_mm}mm ${rotulo.altura_mm}mm; margin: 2mm; }
        body { margin: 0; padding: 0; }
      </style></head><body>
      ${html}
      <script>window.print();window.close();<\/script>
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
                <Switch checked={rotulo.exibir_tabela_consumo} onCheckedChange={(v) => updateField("exibir_tabela_consumo", v)} />
                <Label className="text-xs">Exibir tabela de consumo por 100g de suplemento no rótulo</Label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Ativado automaticamente para Sal Mineral e Suplementos de Bovinos (IN 12/2004 – MAPA). Mostra macro e microminerais com VR para 450 kg.
              </p>
            </CardContent>
          </Card>

          {/* Dimensões */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Dimensões da Etiqueta</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Largura (mm)</Label><Input type="number" value={rotulo.largura_mm} onChange={(e) => updateField("largura_mm", parseInt(e.target.value) || 200)} /></div>
                <div><Label className="text-xs">Altura (mm)</Label><Input type="number" value={rotulo.altura_mm} onChange={(e) => updateField("altura_mm", parseInt(e.target.value) || 100)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Padrão: 200x100mm (horizontal, conforme modelo IN 22).</p>
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
            <CardHeader><CardTitle className="text-sm">Pré-visualização do Rótulo (IN 22 – Layout Horizontal)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={downloadZPL}>
                  <Download className="w-4 h-4 mr-1" /> ZPL (Zebra)
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" /> Imprimir
                </Button>
              </div>

              <div className="overflow-auto">
                <div
                  ref={printRef}
                  style={{ maxWidth: "900px", fontFamily: "Arial, sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: buildPrintHTML(rotulo, niveisObj) }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
