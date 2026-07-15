import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, CheckCircle2, Loader2, Sparkles, AlertTriangle, RefreshCw, Copy, History, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CUSTOM, sugerirPopPorNome, CUSTOM_STORAGE_PREFIX, POP_TO_MODULOS } from "@/config/feedBpfCustomConfig";
import { useModulosCustom } from "@/hooks/useModulosCustom";
import { toast } from "sonner";

interface HistoricoExec {
  id: string;
  data: string; // ISO
  empresaId: string;
  empresaNome?: string;
  total: number;
  ok: number;
  erro: number;
  duracaoMs: number;
  falhas: { nome: string; pop: string; motivo: string }[];
}
const HIST_KEY = "feedbpfcustom:importacao-massa:historico";
const MAX_HIST = 20;

function carregarHistorico(userId?: string): HistoricoExec[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${HIST_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function salvarHistorico(userId: string, hist: HistoricoExec[]) {
  try { localStorage.setItem(`${HIST_KEY}:${userId}`, JSON.stringify(hist.slice(0, MAX_HIST))); } catch {}
}

interface Item {
  id: string;
  file: File;
  titulo: string;
  pop: string;
  status: "pendente" | "enviando" | "ok" | "erro";
  erro?: string;
}

let seq = 0;

export default function ImportacaoMassa() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<Item[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [historico, setHistorico] = useState<HistoricoExec[]>([]);
  const [histAberto, setHistAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const empresaId = empresaAtiva?.id;

  useEffect(() => { setHistorico(carregarHistorico(user?.id)); }, [user?.id]);


  const adicionar = (files: FileList | File[]) => {
    const novos: Item[] = Array.from(files).map(f => {
      const sugestao = sugerirPopPorNome(f.name);
      return {
        id: `i-${++seq}`,
        file: f,
        titulo: f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
        pop: sugestao || "",
        status: "pendente",
      };
    });
    setItems(prev => [...prev, ...novos]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) adicionar(e.dataTransfer.files);
  };

  const remover = (id: string) => setItems(items.filter(i => i.id !== id));
  const alterar = (id: string, patch: Partial<Item>) => setItems(items.map(i => (i.id === id ? { ...i, ...patch } : i)));

  const enviar = async () => {
    if (!user || !empresaId || items.length === 0) return;
    setEnviando(true);
    setProgresso(0);
    const inicio = Date.now();
    const pendentes = items.filter(i => i.status !== "ok");
    const falhasExec: HistoricoExec["falhas"] = [];
    let done = 0;
    let okCount = 0;
    let erroCount = 0;
    for (const item of pendentes) {
      alterar(item.id, { status: "enviando" });
      try {
        const sanitized = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const hoje = new Date().toISOString().split("T")[0];
        const path = `${user.id}/${CUSTOM_STORAGE_PREFIX}/${empresaId}/${item.pop || "sem-pop"}/${hoje}/${Date.now()}_${sanitized}`;

        const { error: upErr } = await supabase.storage.from("documentos-bpf").upload(path, item.file);
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase.from("documentos_bpf").insert({
          user_id: user.id,
          empresa_id: empresaId,
          tipo: "outro",
          pop_codigo: item.pop || null,
          titulo: item.titulo,
          arquivo_nome: item.file.name,
          arquivo_path: path,
          data_documento: hoje,
        } as any);
        if (dbErr) throw dbErr;

        alterar(item.id, { status: "ok" });
        okCount++;
      } catch (err: any) {
        console.error("[ImportacaoMassa] falha:", err);
        alterar(item.id, { status: "erro", erro: err.message });
        erroCount++;
        falhasExec.push({ nome: item.file.name, pop: item.pop || "", motivo: err?.message || "erro desconhecido" });
      }
      done++;
      setProgresso(Math.round((done / pendentes.length) * 100));
    }
    setEnviando(false);

    // salva histórico
    const registro: HistoricoExec = {
      id: `h-${Date.now()}`,
      data: new Date().toISOString(),
      empresaId,
      empresaNome: empresaAtiva?.nome,
      total: pendentes.length,
      ok: okCount,
      erro: erroCount,
      duracaoMs: Date.now() - inicio,
      falhas: falhasExec,
    };
    const novoHist = [registro, ...historico].slice(0, MAX_HIST);
    setHistorico(novoHist);
    salvarHistorico(user.id, novoHist);

    if (erroCount > 0 && okCount > 0) {
      toast.warning(`${okCount} enviado(s), ${erroCount} falharam. Veja o detalhe em cada linha.`);
    } else if (erroCount > 0) {
      toast.error(`${erroCount} arquivo(s) falharam. Veja o detalhe em cada linha.`);
    } else {
      toast.success(`Importação concluída: ${okCount} arquivo(s) enviado(s).`);
    }
  };

  const limparHistorico = () => {
    if (!user) return;
    setHistorico([]);
    salvarHistorico(user.id, []);
    toast.success("Histórico limpo");
  };


  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Upload} title="Importação em Massa" description="Selecione uma empresa" />
        <EmpresaSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Upload} title="Importação em Massa" description="Arraste sua pasta inteira — o sistema sugere o POP de cada arquivo pelo nome" />

      <Card>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 rounded-xl p-10 text-center cursor-pointer hover:bg-emerald-50/50 transition"
          >
            <Upload className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
            <p className="font-semibold">Arraste arquivos ou uma pasta inteira aqui</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, imagens, planilhas Excel · Sugestão automática de POP pelo nome</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={e => e.target.files && adicionar(e.target.files)}
              // @ts-expect-error - non-standard but widely supported
              webkitdirectory=""
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Dica: nomes como "higiene_janeiro.pdf" → sugere POP-02 automaticamente
          </p>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
        <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold">{items.length} arquivo(s) na fila</p>
              <div className="flex gap-2 flex-wrap">
                <Select
                  onValueChange={v => {
                    const pop = v === "__none__" ? "" : v;
                    setItems(prev => prev.map(i => i.status === "pendente" || i.status === "erro" ? { ...i, pop } : i));
                    toast.success(pop ? `POP ${pop} aplicado a todos` : "POP removido de todos");
                  }}
                  disabled={enviando}
                >
                  <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Aplicar POP a todos..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sem POP —</SelectItem>
                    {POPS_CUSTOM.map(p => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enviando}
                  onClick={() => {
                    setItems(prev => prev.map(i => ({ ...i, pop: i.pop || sugerirPopPorNome(i.file.name) || "" })));
                    toast.success("Sugestões reaplicadas pelos nomes");
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Auto-sugerir
                </Button>
                <Button variant="outline" size="sm" onClick={() => setItems([])} disabled={enviando}>Limpar</Button>
                <Button size="sm" onClick={enviar} disabled={enviando} className="bg-emerald-600 hover:bg-emerald-700">
                  {enviando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Enviar tudo
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              💡 POP é opcional — arquivos sem POP ficam em "Sem classificação" e podem ser organizados depois em Meu Acervo.
            </p>

            {enviando && <Progress value={progresso} className="h-2" />}

            {(() => {
              const falhas = items.filter(i => i.status === "erro");
              if (falhas.length === 0 || enviando) return null;

              const reenviarFalhas = () => {
                setItems(prev => prev.map(i => i.status === "erro" ? { ...i, status: "pendente", erro: undefined } : i));
                setTimeout(() => enviar(), 50);
              };
              const copiarLog = async () => {
                const linhas = falhas.map(f => `• ${f.file.name} (${f.pop || "sem POP"}) — ${f.erro || "erro desconhecido"}`).join("\n");
                await navigator.clipboard.writeText(`Falhas na importação (${falhas.length}):\n${linhas}`);
                toast.success("Log copiado");
              };

              return (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <p className="text-sm font-semibold">{falhas.length} arquivo(s) falharam</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copiarLog} className="h-7 text-xs">
                        <Copy className="w-3 h-3 mr-1" /> Copiar log
                      </Button>
                      <Button size="sm" onClick={reenviarFalhas} className="h-7 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        <RefreshCw className="w-3 h-3 mr-1" /> Reenviar apenas falhas
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-destructive/10">
                    {falhas.map(f => (
                      <div key={f.id} className="py-2 text-xs space-y-0.5">
                        <p className="font-medium truncate" title={f.file.name}>{f.file.name}</p>
                        <p className="text-muted-foreground">
                          POP: {f.pop || <span className="text-amber-700">não definido</span>} · {(f.file.size / 1024).toFixed(0)} KB
                        </p>
                        <p className="text-destructive break-words">
                          <span className="font-semibold">Motivo:</span> {f.erro || "erro desconhecido"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}


            <div className="divide-y max-h-[400px] overflow-y-auto -mx-4">
              {items.map(item => (
                <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input value={item.titulo} onChange={e => alterar(item.id, { titulo: e.target.value })} className="h-8 text-sm" disabled={enviando} />
                    <p className="text-[11px] text-muted-foreground truncate">{item.file.name} · {(item.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <Select value={item.pop} onValueChange={v => alterar(item.id, { pop: v })} disabled={enviando}>
                    <SelectTrigger className="h-8 w-32 text-xs shrink-0"><SelectValue placeholder="Escolher POP..." /></SelectTrigger>
                    <SelectContent>
                      {POPS_CUSTOM.map(p => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {item.status === "ok" && <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>}
                  {item.status === "enviando" && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                  {item.status === "erro" && <Badge variant="destructive" title={item.erro}>erro</Badge>}
                  {item.status === "pendente" && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remover(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {historico.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setHistAberto(a => !a)}
                className="flex items-center gap-2 text-sm font-semibold hover:text-emerald-700 transition"
              >
                <History className="w-4 h-4 text-emerald-600" />
                Histórico de importações ({historico.length})
                {histAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {histAberto && (
                <Button variant="ghost" size="sm" onClick={limparHistorico} className="h-7 text-xs text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" /> Limpar histórico
                </Button>
              )}
            </div>

            {histAberto && (
              <div className="divide-y max-h-[420px] overflow-y-auto -mx-2">
                {historico.map(h => {
                  const dt = new Date(h.data);
                  const dur = h.duracaoMs < 1000 ? `${h.duracaoMs}ms` : `${(h.duracaoMs / 1000).toFixed(1)}s`;
                  return (
                    <div key={h.id} className="px-2 py-3 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-muted-foreground">
                          {dt.toLocaleString("pt-BR")} · {h.empresaNome || h.empresaId.slice(0, 8)} · {dur}
                        </p>
                        <div className="flex gap-1">
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">
                            {h.ok} OK
                          </Badge>
                          {h.erro > 0 && (
                            <Badge variant="destructive" className="text-[10px]">{h.erro} erro</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">{h.total} total</Badge>
                        </div>
                      </div>
                      {h.falhas.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-destructive hover:underline">
                            Ver {h.falhas.length} falha(s)
                          </summary>
                          <div className="mt-1 pl-3 border-l-2 border-destructive/30 space-y-1">
                            {h.falhas.map((f, i) => (
                              <div key={i}>
                                <p className="font-medium truncate" title={f.nome}>{f.nome}</p>
                                <p className="text-muted-foreground">POP: {f.pop || "—"} · {f.motivo}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
