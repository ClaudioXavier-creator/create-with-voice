import { useRef, useState } from "react";
import { Upload, FileText, Trash2, CheckCircle2, Loader2, Sparkles } from "lucide-react";
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
import { POPS_CUSTOM, sugerirPopPorNome, CUSTOM_STORAGE_PREFIX } from "@/config/feedBpfCustomConfig";
import { toast } from "sonner";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const empresaId = empresaAtiva?.id;

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
    const pendentes = items.filter(i => i.status !== "ok");
    let done = 0;
    let okCount = 0;
    let erroCount = 0;
    for (const item of pendentes) {
      alterar(item.id, { status: "enviando" });
      try {
        const sanitized = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const hoje = new Date().toISOString().split("T")[0];
        // RLS do bucket exige que o 1º segmento seja auth.uid()
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
      }
      done++;
      setProgresso(Math.round((done / pendentes.length) * 100));
    }
    setEnviando(false);
    if (erroCount > 0 && okCount > 0) {
      toast.warning(`${okCount} enviado(s), ${erroCount} falharam. Veja o detalhe em cada linha.`);
    } else if (erroCount > 0) {
      toast.error(`${erroCount} arquivo(s) falharam. Veja o detalhe em cada linha.`);
    } else {
      toast.success(`Importação concluída: ${okCount} arquivo(s) enviado(s).`);
    }
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{items.length} arquivo(s) na fila</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setItems([])} disabled={enviando}>Limpar</Button>
                <Button size="sm" onClick={enviar} disabled={enviando} className="bg-emerald-600 hover:bg-emerald-700">
                  {enviando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Enviar tudo
                </Button>
              </div>
            </div>

            {enviando && <Progress value={progresso} className="h-2" />}

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
    </div>
  );
}
