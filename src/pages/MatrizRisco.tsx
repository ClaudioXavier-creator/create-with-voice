import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, AlertTriangle, ClipboardCheck, Sparkles, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import QuestionarioRisco from "@/components/risco/QuestionarioRisco";

const DEFAULT_PRODUCTS = [
  "EQUINOS",
  "FARELÃO",
  "OVINOS E CAPRINOS",
  "BOVINOS S. URÉIA/C.IONÓFORO",
  "BOVINOS C.URÉIA /COM IONÓFORO",
  "PROTEINADO SEM URÉIA/COM IONÓFORO",
  "PROTEINADO COM URÉIA/COM IONÓFORO",
  "SAL MINERAL",
  "SAL MINERAL C. URÉIA",
  "SAL MINERAL C.URÉIA /IONÓFORO",
  "AVES DE CORTE",
  "AVES DE POSTURA",
  "SUÍNOS",
];

// Default sensitivity values from the uploaded spreadsheet
const DEFAULT_SENSITIVITY: Record<string, Record<string, boolean>> = {
  "EQUINOS": {},
  "FARELÃO": {},
  "OVINOS E CAPRINOS": { "EQUINOS": true, "FARELÃO": true },
  "BOVINOS S. URÉIA/C.IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "BOVINOS C.URÉIA /COM IONÓFORO": true, "SAL MINERAL": true },
  "BOVINOS C.URÉIA /COM IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS C.URÉIA /COM IONÓFORO": true, "PROTEINADO SEM URÉIA/COM IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "PROTEINADO SEM URÉIA/COM IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "BOVINOS C.URÉIA /COM IONÓFORO": true, "SAL MINERAL": true },
  "PROTEINADO COM URÉIA/COM IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS S. URÉIA/C.IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "SAL MINERAL": { "OVINOS E CAPRINOS": true },
  "SAL MINERAL C. URÉIA": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS S. URÉIA/C.IONÓFORO": true, "PROTEINADO SEM URÉIA/COM IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "SAL MINERAL C.URÉIA /IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS S. URÉIA/C.IONÓFORO": true, "PROTEINADO SEM URÉIA/COM IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "AVES DE CORTE": { "EQUINOS": true, "FARELÃO": true },
  "AVES DE POSTURA": { "EQUINOS": true, "FARELÃO": true },
  "SUÍNOS": { "EQUINOS": true, "FARELÃO": true },
};

const ETAPAS_COMUNS = [
  "Recebimento de matérias-primas",
  "Armazenamento de MP",
  "Moagem / Pré-moagem",
  "Dosagem e Pesagem",
  "Mistura",
  "Peletização / Extrusão",
  "Resfriamento",
  "Ensaque / Embalagem",
  "Armazenamento de Produto Acabado",
  "Expedição / Transporte",
  "Limpeza de Linha (Flushing)",
  "Água de Processo",
  "Manutenção de Equipamentos",
];

const PERIGOS_SUGERIDOS: Record<string, Array<{ perigo: string; tipo: string; prob: string; sev: string; medida: string }>> = {
  "Recebimento de matérias-primas": [
    { perigo: "Micotoxinas (aflatoxinas, fumonisinas) em milho, farelo de soja", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Certificado de análise do fornecedor + amostragem/análise laboratorial periódica" },
    { perigo: "Salmonella spp. em farelos e farinhas de origem animal", tipo: "Biológico", prob: "Alta", sev: "Alta", medida: "Qualificação de fornecedor + análise microbiológica + certificado sanitário" },
    { perigo: "Resíduos de pesticidas/agrotóxicos em grãos", tipo: "Químico", prob: "Baixa", sev: "Alta", medida: "Certificado do fornecedor + monitoramento conforme IN 13/2004" },
    { perigo: "Material estranho (pedras, madeira, plástico)", tipo: "Físico", prob: "Média", sev: "Média", medida: "Inspeção visual no recebimento + peneiras na descarga" },
    { perigo: "MP fora de especificação (umidade, rancidez, cor anormal)", tipo: "Químico", prob: "Média", sev: "Média", medida: "Checklist de recebimento (odor, cor, umidade, temperatura)" },
    { perigo: "Dioxinas em gorduras/óleos reciclados", tipo: "Químico", prob: "Baixa", sev: "Alta", medida: "Uso apenas de fornecedores com certificação + laudo de dioxinas" },
  ],
  "Armazenamento de MP": [
    { perigo: "Contaminação cruzada entre ureia e ingredientes sem ureia", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Segregação física + sinalização + área exclusiva para ureia" },
    { perigo: "Desenvolvimento de fungos por umidade elevada", tipo: "Biológico", prob: "Média", sev: "Média", medida: "Controle de temperatura e umidade + FIFO + ventilação" },
    { perigo: "Contaminação por pragas (roedores, insetos)", tipo: "Biológico", prob: "Média", sev: "Média", medida: "Programa de controle integrado de pragas + estrados/paletes" },
    { perigo: "Contaminação cruzada entre ionóforos e produtos para equinos", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Armazenamento segregado + identificação visual + procedimento operacional" },
  ],
  "Moagem / Pré-moagem": [
    { perigo: "Fragmentos metálicos por desgaste de martelos/peneiras", tipo: "Físico", prob: "Média", sev: "Média", medida: "Ímãs de proteção + peneiras + manutenção preventiva dos moinhos" },
    { perigo: "Poeira excessiva gerando risco de explosão", tipo: "Físico", prob: "Baixa", sev: "Alta", medida: "Sistema de exaustão + aterramento + manutenção preventiva" },
    { perigo: "Granulometria inadequada comprometendo mistura", tipo: "Físico", prob: "Média", sev: "Média", medida: "Controle periódico de granulometria + troca de peneiras" },
  ],
  "Dosagem e Pesagem": [
    { perigo: "Dosagem incorreta de ureia (risco de intoxicação)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Dupla conferência de pesagem + formulação impressa + treinamento" },
    { perigo: "Erro na dosagem de premix/medicamento veterinário", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Balança calibrada + conferência de lote e quantidade + registro" },
    { perigo: "Dosagem incorreta de ionóforos (monensina, salinomicina, lasalocida)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Procedimento específico + dupla conferência + balanças aferidas" },
    { perigo: "Troca/inversão de matéria-prima (ex: calcário por ureia)", tipo: "Químico", prob: "Baixa", sev: "Alta", medida: "Identificação clara de cada silo/recipiente + conferência visual" },
  ],
  "Mistura": [
    { perigo: "Contaminação cruzada com monensina em ração sem monensina (risco para equinos)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Matriz de sensibilidade + sequenciamento + validação de limpeza" },
    { perigo: "Mistura não homogênea (sub/sobre dosagem no saco)", tipo: "Químico", prob: "Média", sev: "Média", medida: "Tempo de mistura padronizado + teste de homogeneidade (CV<10%)" },
    { perigo: "Carry-over de aditivos medicamentosos entre bateladas", tipo: "Químico", prob: "Alta", sev: "Alta", medida: "Flushing entre produções sensíveis + análise de carry-over" },
    { perigo: "Resíduos de limpeza química no misturador", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Enxágue adequado + validação de limpeza + registro" },
  ],
  "Peletização / Extrusão": [
    { perigo: "Temperatura insuficiente para eliminação de Salmonella", tipo: "Biológico", prob: "Média", sev: "Alta", medida: "Monitoramento de temperatura (>80°C) + registro contínuo" },
    { perigo: "Fragmentos metálicos da matriz/rolos", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Inspeção periódica da matriz + detector de metais pós-peletização" },
  ],
  "Resfriamento": [
    { perigo: "Recontaminação microbiológica por ar contaminado", tipo: "Biológico", prob: "Baixa", sev: "Média", medida: "Filtros no resfriador + manutenção + análise microbiológica periódica" },
    { perigo: "Umidade residual elevada favorecendo fungos", tipo: "Biológico", prob: "Média", sev: "Média", medida: "Controle de temperatura de saída (<5°C acima da ambiente) + umidade" },
  ],
  "Ensaque / Embalagem": [
    { perigo: "Embalagem danificada permitindo contaminação", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Inspeção visual + teste de integridade + armazenamento correto de embalagens" },
    { perigo: "Erro na rotulagem (produto, lote, validade)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Conferência de rótulo vs. ordem de produção + dupla verificação" },
    { perigo: "Fragmento de costura/grampo na embalagem", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Manutenção da costureira + inspeção visual" },
  ],
  "Armazenamento de Produto Acabado": [
    { perigo: "Deterioração por umidade/temperatura inadequada", tipo: "Biológico", prob: "Baixa", sev: "Média", medida: "Controle de temperatura e umidade do armazém + FIFO" },
    { perigo: "Mistura de lotes / produtos diferentes", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Identificação clara + áreas demarcadas + rastreabilidade" },
  ],
  "Expedição / Transporte": [
    { perigo: "Contaminação cruzada no veículo de transporte", tipo: "Químico", prob: "Média", sev: "Média", medida: "Inspeção do veículo + registro de cargas anteriores + limpeza" },
    { perigo: "Exposição ao sol/chuva durante carga", tipo: "Físico", prob: "Baixa", sev: "Baixa", medida: "Doca coberta + lona adequada" },
  ],
  "Limpeza de Linha (Flushing)": [
    { perigo: "Flushing insuficiente (carry-over acima do aceitável)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Quantidade de flushing validada + análise periódica de carry-over" },
    { perigo: "Destino inadequado do material de flushing", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Procedimento definido para destino do flushing + registro" },
  ],
  "Água de Processo": [
    { perigo: "Água fora dos padrões de potabilidade", tipo: "Biológico", prob: "Baixa", sev: "Média", medida: "Análise periódica de potabilidade + cloração + registro" },
    { perigo: "Contaminação por metais pesados na água", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Análise anual de metais pesados + tratamento" },
  ],
  "Manutenção de Equipamentos": [
    { perigo: "Lubrificantes contaminando o produto", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Uso de lubrificantes food-grade + manutenção preventiva + registro" },
    { perigo: "Peças soltas/parafusos caindo no produto", tipo: "Físico", prob: "Baixa", sev: "Alta", medida: "Check-list pós-manutenção + detector de metais + ímãs" },
  ],
};

const DEFAULT_RISKS = Object.entries(PERIGOS_SUGERIDOS).flatMap(([etapa, perigos]) =>
  perigos.map(p => ({
    etapa_processo: etapa,
    perigo_identificado: p.perigo,
    tipo_perigo: p.tipo,
    probabilidade: p.prob,
    severidade: p.sev,
    nivel_risco: calcRisk(p.prob, p.sev),
    medidas_controle: p.medida,
  }))
);

function calcRisk(prob: string, sev: string): string {
  const pMap: Record<string, number> = { "Baixa": 1, "Média": 2, "Alta": 3 };
  const score = (pMap[prob] || 2) * (pMap[sev] || 2);
  if (score >= 6) return "Alto";
  if (score >= 3) return "Médio";
  return "Baixo";
}

function riskColor(nivel: string) {
  if (nivel === "Alto") return "bg-destructive/20 text-destructive font-bold";
  if (nivel === "Médio") return "bg-yellow-100 text-yellow-800 font-semibold dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
}

export default function MatrizRisco() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [tab, setTab] = useState("questionario");

  // Sensitivity state
  const [products, setProducts] = useState<string[]>(DEFAULT_PRODUCTS);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [sensLoaded, setSensLoaded] = useState(false);
  const [newProduct, setNewProduct] = useState("");

  // Risk state
  const [risks, setRisks] = useState<Array<{
    id?: string;
    etapa_processo: string;
    perigo_identificado: string;
    tipo_perigo: string;
    probabilidade: string;
    severidade: string;
    nivel_risco: string;
    medidas_controle: string;
  }>>([]);
  const [riskLoaded, setRiskLoaded] = useState(false);

  // Load sensitivity data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("matriz_sensibilidade")
        .select("*")
        .eq("user_id", user.id);
      if (data && data.length > 0) {
        const m: Record<string, Record<string, boolean>> = {};
        const prods = new Set<string>();
        data.forEach((r: any) => {
          prods.add(r.produto_anterior);
          prods.add(r.produto_seguinte);
          if (!m[r.produto_anterior]) m[r.produto_anterior] = {};
          m[r.produto_anterior][r.produto_seguinte] = r.requer_flushing;
        });
        setProducts(Array.from(prods));
        setMatrix(m);
      } else {
        setMatrix(DEFAULT_SENSITIVITY);
      }
      setSensLoaded(true);
    })();
  }, [user]);

  // Load risk data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("matriz_risco")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (data && data.length > 0) {
        setRisks(data);
      } else {
        setRisks(DEFAULT_RISKS);
      }
      setRiskLoaded(true);
    })();
  }, [user]);

  const toggleCell = (row: string, col: string) => {
    setMatrix(prev => {
      const copy = { ...prev };
      if (!copy[row]) copy[row] = {};
      copy[row] = { ...copy[row], [col]: !copy[row][col] };
      return copy;
    });
  };

  const addProduct = () => {
    const name = newProduct.trim().toUpperCase();
    if (!name || products.includes(name)) return;
    setProducts(prev => [...prev, name]);
    setNewProduct("");
  };

  const removeProduct = (p: string) => {
    setProducts(prev => prev.filter(x => x !== p));
    setMatrix(prev => {
      const copy = { ...prev };
      delete copy[p];
      Object.keys(copy).forEach(k => {
        if (copy[k][p] !== undefined) {
          copy[k] = { ...copy[k] };
          delete copy[k][p];
        }
      });
      return copy;
    });
  };

  const saveSensitivity = async () => {
    if (!user) return;
    // Delete existing and re-insert
    await supabase.from("matriz_sensibilidade").delete().eq("user_id", user.id);
    const rows: any[] = [];
    products.forEach(row => {
      products.forEach(col => {
        rows.push({
          user_id: user.id, empresa_id: empresaAtiva?.id || null,
          produto_anterior: row,
          produto_seguinte: col,
          requer_flushing: matrix[row]?.[col] || false,
        });
      });
    });
    if (rows.length > 0) {
      const { error } = await supabase.from("matriz_sensibilidade").insert(rows);
      if (error) { toast.error("Erro ao salvar"); return; }
    }
    toast.success("Matriz de sensibilidade salva!");
  };

  const saveRisks = async () => {
    if (!user) return;
    await supabase.from("matriz_risco").delete().eq("user_id", user.id);
    const rows = risks.map(r => ({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      etapa_processo: r.etapa_processo,
      perigo_identificado: r.perigo_identificado,
      tipo_perigo: r.tipo_perigo,
      probabilidade: r.probabilidade,
      severidade: r.severidade,
      nivel_risco: r.nivel_risco,
      medidas_controle: r.medidas_controle,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("matriz_risco").insert(rows);
      if (error) { toast.error("Erro ao salvar"); return; }
    }
    toast.success("Matriz de risco salva!");
  };

  const addRiskRow = () => {
    setRisks(prev => [...prev, {
      etapa_processo: "",
      perigo_identificado: "",
      tipo_perigo: "Químico",
      probabilidade: "Média",
      severidade: "Média",
      nivel_risco: "Médio",
      medidas_controle: "",
    }]);
  };

  const updateRisk = (idx: number, field: string, value: string) => {
    setRisks(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === "probabilidade" || field === "severidade") {
        const p = field === "probabilidade" ? value : copy[idx].probabilidade;
        const s = field === "severidade" ? value : copy[idx].severidade;
        copy[idx].nivel_risco = calcRisk(p, s);
      }
      return copy;
    });
  };

  const removeRisk = (idx: number) => {
    setRisks(prev => prev.filter((_, i) => i !== idx));
  };

  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null);

  const sugerirIA = async (idx: number) => {
    const r = risks[idx];
    if (!r.etapa_processo || !r.perigo_identificado) {
      toast.error("Preencha a etapa e o perigo antes de pedir sugestão.");
      return;
    }
    setAiLoadingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("classificar-risco", {
        body: {
          etapa_processo: r.etapa_processo,
          perigo_identificado: r.perigo_identificado,
          tipo_perigo: r.tipo_perigo,
        },
      });
      if (error) { toast.error("Erro ao classificar: " + error.message); setAiLoadingIdx(null); return; }
      if (data?.error) { toast.error(data.error); setAiLoadingIdx(null); return; }
      const result = data?.data;
      if (result) {
        setRisks(prev => {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            probabilidade: result.probabilidade || copy[idx].probabilidade,
            severidade: result.severidade || copy[idx].severidade,
            nivel_risco: result.nivel_risco || calcRisk(result.probabilidade, result.severidade),
            medidas_controle: result.medidas_controle || copy[idx].medidas_controle,
          };
          return copy;
        });
        toast.success("Classificação sugerida pela IA!", {
          description: result.justificativa,
        });
      }
    } catch { toast.error("Erro ao conectar com IA"); }
    setAiLoadingIdx(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Matriz de Sensibilidade e Risco" description="Sequenciamento de produção e análise de perigos APPCC" icon={AlertTriangle}
        orientacaoModuloId="matriz-risco" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="questionario">Questionário de Risco</TabsTrigger>
          <TabsTrigger value="sensibilidade">Matriz de Sensibilidade</TabsTrigger>
          <TabsTrigger value="risco">Matriz de Risco</TabsTrigger>
        </TabsList>

        <TabsContent value="questionario">
          <QuestionarioRisco onSave={(perguntas) => {
            // Save to localStorage for persistence
            localStorage.setItem("questionario_risco", JSON.stringify(perguntas));
          }} savedData={(() => {
            try {
              const saved = localStorage.getItem("questionario_risco");
              return saved ? JSON.parse(saved) : undefined;
            } catch { return undefined; }
          })()} />
        </TabsContent>

        <TabsContent value="sensibilidade">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Sequenciamento de Produção — Flushing Necessário</CardTitle>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Novo produto..."
                  value={newProduct}
                  onChange={e => setNewProduct(e.target.value)}
                  className="w-48"
                  onKeyDown={e => e.key === "Enter" && addProduct()}
                />
                <Button size="sm" onClick={addProduct}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                <Button size="sm" onClick={saveSensitivity}><Save className="w-4 h-4 mr-1" />Salvar</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              <div className="text-xs text-muted-foreground mb-2">
                Linhas = Última Produção | Colunas = Próxima Produção. Clique na célula para alternar SIM/NÃO.
              </div>
              {sensLoaded && (
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse w-max">
                    <thead>
                      <tr>
                        <th className="border border-border p-1.5 bg-muted font-bold sticky left-0 z-10 min-w-[180px]">ÚLTIMA \ PRÓXIMA</th>
                        {products.map(p => (
                          <th key={p} className="border border-border p-1 bg-muted font-medium min-w-[80px] max-w-[120px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="leading-tight text-center">{p}</span>
                              <button onClick={() => removeProduct(p)} className="text-destructive/60 hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(row => (
                        <tr key={row}>
                          <td className="border border-border p-1.5 font-medium bg-muted sticky left-0 z-10">{row}</td>
                          {products.map(col => {
                            const val = matrix[row]?.[col] || false;
                            return (
                              <td
                                key={col}
                                onClick={() => toggleCell(row, col)}
                                className={`border border-border p-1 text-center cursor-pointer select-none transition-colors ${
                                  val
                                    ? "bg-destructive/20 text-destructive font-bold hover:bg-destructive/30"
                                    : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                }`}
                              >
                                {val ? "SIM" : "NÃO"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-destructive/20 border border-destructive/30 rounded" /> SIM — Flushing necessário</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-50 border border-green-300 rounded dark:bg-green-900/20" /> NÃO — Sem necessidade</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risco">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Análise de Perigos e Pontos Críticos de Controle — APPCC</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addRiskRow}><Plus className="w-4 h-4 mr-1" />Linha em Branco</Button>
                  <Button size="sm" onClick={saveRisks}><Save className="w-4 h-4 mr-1" />Salvar</Button>
                </div>
              </div>
              <div className="bg-muted/60 rounded-lg p-4 text-sm space-y-2 border">
                <p className="font-semibold text-foreground">📋 Como preencher esta Matriz de Risco:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  <li><strong>Etapa do Processo:</strong> Selecione a etapa da produção onde o perigo pode ocorrer.</li>
                  <li><strong>Perigo Identificado:</strong> Descreva o perigo específico (químico, biológico ou físico).</li>
                  <li><strong>Probabilidade:</strong> Chance de ocorrência — Baixa (raro), Média (pode ocorrer), Alta (frequente).</li>
                  <li><strong>Severidade:</strong> Impacto se ocorrer — Baixa (menor), Média (moderado), Alta (grave/letal).</li>
                  <li><strong>Nível de Risco:</strong> Calculado automaticamente (Prob × Sev). Riscos <span className="text-destructive font-bold">Altos</span> exigem ação imediata.</li>
                  <li><strong>Medidas de Controle:</strong> Ações preventivas para eliminar ou reduzir o perigo a níveis aceitáveis.</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 <strong>Dica:</strong> A tabela já vem preenchida com os perigos mais comuns em fábricas de nutrição animal. Revise cada item, ajuste probabilidade e severidade conforme a realidade da sua fábrica, e adicione novos itens se necessário.
                </p>
              </div>
              {/* Quick-add from suggestions */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-muted-foreground">Adicionar perigos sugeridos por etapa:</span>
                {ETAPAS_COMUNS.map(etapa => {
                  const sugCount = PERIGOS_SUGERIDOS[etapa]?.length || 0;
                  const alreadyHas = risks.some(r => r.etapa_processo === etapa);
                  return (
                    <Button
                      key={etapa}
                      size="sm"
                      variant={alreadyHas ? "outline" : "secondary"}
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        const sugeridos = PERIGOS_SUGERIDOS[etapa] || [];
                        const novos = sugeridos
                          .filter(s => !risks.some(r => r.etapa_processo === etapa && r.perigo_identificado === s.perigo))
                          .map(s => ({
                            etapa_processo: etapa,
                            perigo_identificado: s.perigo,
                            tipo_perigo: s.tipo,
                            probabilidade: s.prob,
                            severidade: s.sev,
                            nivel_risco: calcRisk(s.prob, s.sev),
                            medidas_controle: s.medida,
                          }));
                        if (novos.length === 0) {
                          toast.info(`Todos os perigos de "${etapa}" já estão na lista`);
                          return;
                        }
                        setRisks(prev => [...prev, ...novos]);
                        toast.success(`${novos.length} perigo(s) adicionado(s) para "${etapa}"`);
                      }}
                    >
                      {etapa.split("/")[0].trim().substring(0, 20)} ({sugCount})
                    </Button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Alto: {risks.filter(r => r.nivel_risco === "Alto").length}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Médio: {risks.filter(r => r.nivel_risco === "Médio").length}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300">
                  Baixo: {risks.filter(r => r.nivel_risco === "Baixo").length}
                </span>
                <span className="text-muted-foreground ml-2">Total: {risks.length} perigos</span>
              </div>

              {riskLoaded && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Etapa do Processo</TableHead>
                      <TableHead className="min-w-[200px]">Perigo Identificado</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Probabilidade</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Nível Risco</TableHead>
                      <TableHead className="min-w-[200px]">Medidas de Controle</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {risks.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={r.etapa_processo} onValueChange={v => updateRisk(idx, "etapa_processo", v)}>
                            <SelectTrigger className="text-xs h-8 w-[160px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              {ETAPAS_COMUNS.map(e => (
                                <SelectItem key={e} value={e}>{e}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input value={r.perigo_identificado} onChange={e => updateRisk(idx, "perigo_identificado", e.target.value)} className="text-xs h-8" />
                        </TableCell>
                        <TableCell>
                          <Select value={r.tipo_perigo} onValueChange={v => updateRisk(idx, "tipo_perigo", v)}>
                            <SelectTrigger className="text-xs h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Químico">Químico</SelectItem>
                              <SelectItem value="Biológico">Biológico</SelectItem>
                              <SelectItem value="Físico">Físico</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={r.probabilidade} onValueChange={v => updateRisk(idx, "probabilidade", v)}>
                            <SelectTrigger className="text-xs h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baixa">Baixa</SelectItem>
                              <SelectItem value="Média">Média</SelectItem>
                              <SelectItem value="Alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={r.severidade} onValueChange={v => updateRisk(idx, "severidade", v)}>
                            <SelectTrigger className="text-xs h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baixa">Baixa</SelectItem>
                              <SelectItem value="Média">Média</SelectItem>
                              <SelectItem value="Alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${riskColor(r.nivel_risco)}`}>
                            {r.nivel_risco}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input value={r.medidas_controle} onChange={e => updateRisk(idx, "medidas_controle", e.target.value)} className="text-xs h-8" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sugerirIA(idx)}
                              disabled={aiLoadingIdx === idx}
                              className="h-7 w-7 text-primary"
                              title="Sugerir classificação com IA"
                            >
                              {aiLoadingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeRisk(idx)} className="h-7 w-7 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Risk level legend */}
              <div className="mt-4 p-3 rounded-lg bg-muted/40 border text-xs space-y-1">
                <p className="font-semibold text-foreground mb-1">Legenda — Cálculo do Nível de Risco (Probabilidade × Severidade):</p>
                <div className="grid grid-cols-4 gap-1 max-w-md">
                  <div className="font-medium">P \ S</div>
                  <div className="font-medium text-center">Baixa</div>
                  <div className="font-medium text-center">Média</div>
                  <div className="font-medium text-center">Alta</div>
                  <div className="font-medium">Baixa</div>
                  <div className="text-center bg-green-100 dark:bg-green-900/30 rounded px-1">Baixo (1)</div>
                  <div className="text-center bg-green-100 dark:bg-green-900/30 rounded px-1">Baixo (2)</div>
                  <div className="text-center bg-yellow-100 dark:bg-yellow-900/30 rounded px-1">Médio (3)</div>
                  <div className="font-medium">Média</div>
                  <div className="text-center bg-green-100 dark:bg-green-900/30 rounded px-1">Baixo (2)</div>
                  <div className="text-center bg-yellow-100 dark:bg-yellow-900/30 rounded px-1">Médio (4)</div>
                  <div className="text-center bg-destructive/20 rounded px-1 text-destructive">Alto (6)</div>
                  <div className="font-medium">Alta</div>
                  <div className="text-center bg-yellow-100 dark:bg-yellow-900/30 rounded px-1">Médio (3)</div>
                  <div className="text-center bg-destructive/20 rounded px-1 text-destructive">Alto (6)</div>
                  <div className="text-center bg-destructive/20 rounded px-1 text-destructive font-bold">Alto (9)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
