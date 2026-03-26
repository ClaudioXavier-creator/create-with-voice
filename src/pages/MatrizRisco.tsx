import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, AlertTriangle, ClipboardCheck } from "lucide-react";
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

const DEFAULT_RISKS = [
  { etapa_processo: "Recebimento de matérias-primas", perigo_identificado: "Micotoxinas em milho/farelo", tipo_perigo: "Químico", probabilidade: "Média", severidade: "Alta", nivel_risco: "Alto", medidas_controle: "Certificado do fornecedor + análise laboratorial" },
  { etapa_processo: "Recebimento de matérias-primas", perigo_identificado: "Salmonella em farelo", tipo_perigo: "Biológico", probabilidade: "Alta", severidade: "Alta", nivel_risco: "Alto", medidas_controle: "Amostragem e análise em laboratório" },
  { etapa_processo: "Armazenamento", perigo_identificado: "Contaminação cruzada entre ureia e outros ingredientes", tipo_perigo: "Químico", probabilidade: "Média", severidade: "Alta", nivel_risco: "Alto", medidas_controle: "Segregação física e sinalização adequada" },
  { etapa_processo: "Moagem", perigo_identificado: "Fragmentos metálicos", tipo_perigo: "Físico", probabilidade: "Média", severidade: "Média", nivel_risco: "Médio", medidas_controle: "Peneiras e ímãs de proteção" },
  { etapa_processo: "Dosagem e Pesagem", perigo_identificado: "Dosagem incorreta de ureia", tipo_perigo: "Químico", probabilidade: "Média", severidade: "Alta", nivel_risco: "Alto", medidas_controle: "Conferência de formulação + treinamento de operadores" },
  { etapa_processo: "Mistura", perigo_identificado: "Presença de monensina em ração sem monensina", tipo_perigo: "Químico", probabilidade: "Média", severidade: "Alta", nivel_risco: "Alto", medidas_controle: "Sequenciamento de produção + validação de limpeza" },
  { etapa_processo: "Expedição", perigo_identificado: "Mistura de lotes diferentes", tipo_perigo: "Físico", probabilidade: "Baixa", severidade: "Média", nivel_risco: "Baixo", medidas_controle: "Identificação clara + rastreabilidade de lotes" },
];

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
          user_id: user.id,
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
      user_id: user.id,
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

  return (
    <div className="space-y-6">
      <PageHeader title="Matriz de Sensibilidade e Risco" description="Sequenciamento de produção e análise de perigos APPCC" icon={AlertTriangle} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="questionario">Questionário de Risco</TabsTrigger>
          <TabsTrigger value="sensibilidade">Matriz de Sensibilidade</TabsTrigger>
          <TabsTrigger value="risco">Matriz de Risco</TabsTrigger>
        </TabsList>

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
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Análise de Perigos e Riscos — APPCC</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={addRiskRow}><Plus className="w-4 h-4 mr-1" />Linha</Button>
                <Button size="sm" onClick={saveRisks}><Save className="w-4 h-4 mr-1" />Salvar</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
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
                          <Input value={r.etapa_processo} onChange={e => updateRisk(idx, "etapa_processo", e.target.value)} className="text-xs h-8" />
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
                          <Button variant="ghost" size="icon" onClick={() => removeRisk(idx)} className="h-7 w-7 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
