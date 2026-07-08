import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Link2, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight, Sparkles, AlertTriangle, Table as TableIcon, Layers, FileSignature } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CUSTOM, sugerirPopPorNome, type CampoTipo, type CampoModelo } from "@/config/feedBpfCustomConfig";
import { toast } from "sonner";

type Modo = "modelo" | "registros";

interface Coluna {
  original: string;
  campoNome: string;
  tipo: CampoTipo;
  obrigatorio: boolean;
  incluir: boolean;
}

interface Parsed {
  headers: string[];
  rows: Record<string, unknown>[];
  origem: string; // nome do arquivo / URL
}

// ---------- helpers ----------
function slugCampoId(nome: string) {
  return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `campo_${Math.random().toString(36).slice(2, 7)}`;
}

function inferirTipo(valores: unknown[]): CampoTipo {
  const amostra = valores.filter(v => v !== null && v !== undefined && String(v).trim() !== "").slice(0, 15);
  if (amostra.length === 0) return "texto";
  const isNum = amostra.every(v => !isNaN(Number(String(v).replace(",", "."))));
  if (isNum) return "numero";
  const isData = amostra.every(v => {
    const s = String(v);
    return /^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s) || (v instanceof Date);
  });
  if (isData) return "data";
  const isBool = amostra.every(v => /^(sim|não|nao|yes|no|true|false|ok|x|conforme|nc)$/i.test(String(v).trim()));
  if (isBool) return "checkbox";
  return "texto";
}

function googleSheetsToCsv(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  const id = m[1];
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

// ---------- componente ----------
export default function ImportarPlanilhas() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const inputRef = useRef<HTMLInputElement>(null);

  const [carregando, setCarregando] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [colunas, setColunas] = useState<Coluna[]>([]);
  const [modo, setModo] = useState<Modo>("modelo");
  const [nomeModelo, setNomeModelo] = useState("");
  const [popCodigo, setPopCodigo] = useState<string>("");
  const [linkSheet, setLinkSheet] = useState("");
  const [modeloExistente, setModeloExistente] = useState<string>("novo");
  const [modelosDisp, setModelosDisp] = useState<Array<{ id: string; nome: string; campos: CampoModelo[] }>>([]);
  const [salvando, setSalvando] = useState(false);

  const empresaId = empresaAtiva?.id;

  // ---------- parsing ----------
  const processarWorkbook = (wb: XLSX.WorkBook, origem: string) => {
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
    if (json.length === 0) {
      toast.error("Planilha vazia ou sem cabeçalho na primeira linha.");
      return;
    }
    const headers = Object.keys(json[0]).filter(h => h && h.trim() !== "");
    if (headers.length === 0) {
      toast.error("Não encontrei cabeçalhos válidos.");
      return;
    }
    setParsed({ headers, rows: json, origem });

    // auto-detect modo
    const linhasComDados = json.filter(r => headers.some(h => String(r[h] ?? "").trim() !== "")).length;
    setModo(linhasComDados >= 2 ? "registros" : "modelo");

    // colunas
    setColunas(headers.map(h => ({
      original: h,
      campoNome: h.trim(),
      tipo: inferirTipo(json.map(r => r[h])),
      obrigatorio: false,
      incluir: true,
    })));

    // POP sugerido pelo nome
    const sug = sugerirPopPorNome(origem);
    if (sug) setPopCodigo(sug);
    setNomeModelo(origem.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").slice(0, 80));
    carregarModelos();
  };

  const carregarModelos = async () => {
    if (!empresaId) return;
    const { data } = await supabase
      .from("modelos_empresa")
      .select("id, nome, campos")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome");
    setModelosDisp((data ?? []).map(m => ({ id: m.id, nome: m.nome, campos: (m.campos as unknown as CampoModelo[]) ?? [] })));
  };

  const handleArquivo = async (file: File) => {
    setCarregando(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      processarWorkbook(wb, file.name);
      toast.success(`Planilha "${file.name}" carregada.`);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao ler o arquivo. Use .xlsx, .xls ou .csv");
    } finally {
      setCarregando(false);
    }
  };

  const handleLink = async () => {
    const csvUrl = googleSheetsToCsv(linkSheet.trim());
    if (!csvUrl) {
      toast.error("Link inválido. Cole a URL do Google Sheets (ex: https://docs.google.com/spreadsheets/d/…)");
      return;
    }
    setCarregando(true);
    try {
      const resp = await fetch(csvUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const wb = XLSX.read(text, { type: "string", cellDates: true });
      processarWorkbook(wb, `Google Sheets (${new Date().toLocaleDateString("pt-BR")})`);
      toast.success("Planilha do Google Sheets carregada.");
    } catch (e) {
      console.error(e);
      toast.error("Não consegui acessar a planilha. Verifique se está com 'Qualquer pessoa com o link — Leitor'.");
    } finally {
      setCarregando(false);
    }
  };

  // ---------- salvar ----------
  const camposModelo = useMemo<CampoModelo[]>(() =>
    colunas.filter(c => c.incluir).map(c => ({
      id: slugCampoId(c.campoNome),
      nome: c.campoNome,
      tipo: c.tipo,
      obrigatorio: c.obrigatorio,
    })), [colunas]);

  const salvar = async () => {
    if (!user || !empresaId || !parsed) return;
    if (!popCodigo) return toast.error("Selecione o POP correspondente.");
    if (camposModelo.length === 0) return toast.error("Inclua ao menos uma coluna.");

    setSalvando(true);
    try {
      let modeloId = modeloExistente;

      // criar modelo se novo
      if (modeloExistente === "novo") {
        if (!nomeModelo.trim()) throw new Error("Informe o nome do modelo.");
        const { data: novoMod, error: errMod } = await supabase
          .from("modelos_empresa")
          .insert({
            user_id: user.id,
            empresa_id: empresaId,
            nome: nomeModelo.trim(),
            pop_codigo: popCodigo,
            campos: camposModelo as unknown as any,
            descricao: `Importado de ${parsed.origem}`,
          })
          .select("id")
          .single();
        if (errMod) throw errMod;
        modeloId = novoMod.id;
      }

      // se modo registros → criar um registro por linha
      if (modo === "registros") {
        const modeloAtual = modeloExistente === "novo"
          ? { campos: camposModelo }
          : modelosDisp.find(m => m.id === modeloExistente);
        if (!modeloAtual) throw new Error("Modelo destino não encontrado.");

        const registros = parsed.rows
          .filter(r => colunas.some(c => c.incluir && String(r[c.original] ?? "").trim() !== ""))
          .map((r, idx) => {
            const dados: Record<string, unknown> = {};
            colunas.filter(c => c.incluir).forEach(c => {
              dados[slugCampoId(c.campoNome)] = r[c.original] ?? "";
            });
            return {
              user_id: user.id,
              empresa_id: empresaId,
              modelo_id: modeloId,
              pop_codigo: popCodigo,
              titulo: `${nomeModelo || parsed.origem} — linha ${idx + 1}`,
              dados: dados as unknown as any,
              status: "rascunho",
              data_execucao: new Date().toISOString().slice(0, 10),
            };
          });

        if (registros.length === 0) throw new Error("Nenhuma linha com dados para importar.");

        // insere em lotes de 100
        for (let i = 0; i < registros.length; i += 100) {
          const chunk = registros.slice(i, i + 100);
          const { error } = await supabase.from("registros_customizados").insert(chunk);
          if (error) throw error;
        }
        toast.success(`✓ ${registros.length} registro(s) importado(s) como rascunho.`);
      } else {
        toast.success("✓ Modelo criado a partir da planilha.");
      }

      // reset
      setParsed(null);
      setColunas([]);
      setLinkSheet("");
      setNomeModelo("");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Importar Planilhas dos Consultores"
        description="Suba arquivos .xlsx / .csv ou cole o link de uma planilha pública do Google Sheets. Detectamos automaticamente se é um modelo em branco ou registros já preenchidos."
      />

      <EmpresaSelector />

      {!empresaId && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>Selecione uma empresa acima para começar.</AlertDescription>
        </Alert>
      )}

      {empresaId && !parsed && (
        <Tabs defaultValue="arquivo">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="arquivo"><Upload className="w-4 h-4 mr-2" />Arquivo</TabsTrigger>
            <TabsTrigger value="link"><Link2 className="w-4 h-4 mr-2" />Google Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="arquivo">
            <Card
              className="border-dashed border-2 hover:border-emerald-500/60 transition cursor-pointer"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleArquivo(f);
              }}
            >
              <CardContent className="p-12 text-center space-y-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-600" />
                <div>
                  <p className="font-medium">Clique ou arraste sua planilha aqui</p>
                  <p className="text-sm text-muted-foreground mt-1">Formatos: .xlsx, .xls, .csv — primeira aba, cabeçalho na linha 1</p>
                </div>
                {carregando && <Loader2 className="w-5 h-5 mx-auto animate-spin text-emerald-600" />}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleArquivo(e.target.files[0])}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertTitle>Como liberar a planilha</AlertTitle>
                  <AlertDescription>
                    No Google Sheets, clique em <b>Compartilhar</b> → <b>Acesso geral</b> → <b>Qualquer pessoa com o link — Leitor</b>. Depois cole a URL abaixo.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>URL da planilha</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=0"
                      value={linkSheet}
                      onChange={(e) => setLinkSheet(e.target.value)}
                    />
                    <Button onClick={handleLink} disabled={!linkSheet || carregando}>
                      {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {parsed && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium">{parsed.origem}</p>
                    <p className="text-xs text-muted-foreground">
                      {parsed.headers.length} colunas · {parsed.rows.length} linhas
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setParsed(null); setColunas([]); }}>Trocar planilha</Button>
              </div>

              <div className="space-y-3">
                <Label>O que fazer com esta planilha?</Label>
                <RadioGroup value={modo} onValueChange={(v) => setModo(v as Modo)} className="grid md:grid-cols-2 gap-3">
                  <label className={`border rounded-lg p-4 cursor-pointer transition ${modo === "modelo" ? "border-emerald-500 bg-emerald-500/5" : "border-border"}`}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="modelo" className="mt-1" />
                      <div>
                        <div className="flex items-center gap-2 font-medium"><Layers className="w-4 h-4" /> Criar Modelo</div>
                        <p className="text-xs text-muted-foreground mt-1">As colunas viram os campos de um novo formulário digital.</p>
                      </div>
                    </div>
                  </label>
                  <label className={`border rounded-lg p-4 cursor-pointer transition ${modo === "registros" ? "border-emerald-500 bg-emerald-500/5" : "border-border"}`}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="registros" className="mt-1" />
                      <div>
                        <div className="flex items-center gap-2 font-medium"><FileSignature className="w-4 h-4" /> Importar Registros</div>
                        <p className="text-xs text-muted-foreground mt-1">Cada linha vira um registro (rascunho) pronto para revisão e assinatura.</p>
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>POP correspondente</Label>
                  <Select value={popCodigo} onValueChange={setPopCodigo}>
                    <SelectTrigger><SelectValue placeholder="Selecione o POP…" /></SelectTrigger>
                    <SelectContent>
                      {POPS_CUSTOM.map(p => (
                        <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {modo === "registros" && modelosDisp.length > 0 && (
                  <div className="space-y-2">
                    <Label>Modelo destino</Label>
                    <Select value={modeloExistente} onValueChange={setModeloExistente}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">➕ Criar novo modelo a partir das colunas</SelectItem>
                        {modelosDisp.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(modo === "modelo" || modeloExistente === "novo") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome do modelo</Label>
                    <Input value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} placeholder="Ex: Checklist de Higienização Diária" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mapeador de colunas */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="font-medium">Mapeamento das colunas</h3>
                <Badge variant="outline" className="ml-auto">{colunas.filter(c => c.incluir).length} de {colunas.length}</Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Incluir</TableHead>
                      <TableHead>Coluna original</TableHead>
                      <TableHead>Nome do campo</TableHead>
                      <TableHead className="w-36">Tipo</TableHead>
                      <TableHead className="w-24 text-center">Obrig.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colunas.map((c, i) => (
                      <TableRow key={i} className={!c.incluir ? "opacity-40" : ""}>
                        <TableCell className="text-center">
                          <input type="checkbox" checked={c.incluir} onChange={(e) => {
                            const n = [...colunas]; n[i] = { ...n[i], incluir: e.target.checked }; setColunas(n);
                          }} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.original}</TableCell>
                        <TableCell>
                          <Input value={c.campoNome} onChange={(e) => {
                            const n = [...colunas]; n[i] = { ...n[i], campoNome: e.target.value }; setColunas(n);
                          }} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Select value={c.tipo} onValueChange={(v) => {
                            const n = [...colunas]; n[i] = { ...n[i], tipo: v as CampoTipo }; setColunas(n);
                          }}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="texto">Texto</SelectItem>
                              <SelectItem value="numero">Número</SelectItem>
                              <SelectItem value="data">Data</SelectItem>
                              <SelectItem value="checkbox">Sim/Não</SelectItem>
                              <SelectItem value="textarea">Texto longo</SelectItem>
                              <SelectItem value="select">Lista</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <input type="checkbox" checked={c.obrigatorio} onChange={(e) => {
                            const n = [...colunas]; n[i] = { ...n[i], obrigatorio: e.target.checked }; setColunas(n);
                          }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Preview dos dados */}
          {parsed.rows.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-medium text-sm">Prévia (primeiras 5 linhas)</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {colunas.filter(c => c.incluir).map(c => (
                          <TableHead key={c.original}>{c.campoNome}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.rows.slice(0, 5).map((r, i) => (
                        <TableRow key={i}>
                          {colunas.filter(c => c.incluir).map(c => (
                            <TableCell key={c.original} className="text-xs">{String(r[c.original] ?? "")}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setParsed(null); setColunas([]); }}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando} className="bg-gradient-to-r from-emerald-600 to-teal-500">
              {salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {modo === "modelo" ? "Criar Modelo" : `Importar ${parsed.rows.length} registro(s)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
