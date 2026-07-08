import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, AlertTriangle, Link2Off, Upload, ChevronRight, Search, Download, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CUSTOM } from "@/config/feedBpfCustomConfig";
import { toast } from "sonner";

interface Doc {
  id: string;
  titulo: string;
  tipo: string;
  pop_codigo: string | null;
  arquivo_nome: string;
  arquivo_path: string;
  data_documento: string | null;
  created_at: string;
}

export default function MeuAcervo() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [popFiltro, setPopFiltro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const empresaId = empresaAtiva?.id;

  useEffect(() => {
    if (!user || !empresaId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("documentos_bpf")
        .select("id,titulo,tipo,pop_codigo,arquivo_nome,arquivo_path,data_documento,created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      setDocs((data as Doc[]) || []);
      setLoading(false);
    })();
  }, [user, empresaId]);

  const stats = useMemo(() => {
    const map: Record<string, { total: number; semPop: number }> = {};
    POPS_CUSTOM.forEach(p => (map[p.codigo] = { total: 0, semPop: 0 }));
    let semPopGeral = 0;
    docs.forEach(d => {
      if (d.pop_codigo && map[d.pop_codigo]) map[d.pop_codigo].total++;
      else semPopGeral++;
    });
    return { map, semPopGeral, total: docs.length };
  }, [docs]);

  const filtrados = useMemo(() => {
    return docs.filter(d => {
      if (popFiltro && d.pop_codigo !== popFiltro) return false;
      if (popFiltro === "__sem__" && d.pop_codigo) return false;
      if (busca && !d.titulo.toLowerCase().includes(busca.toLowerCase()) && !d.arquivo_nome.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [docs, popFiltro, busca]);

  const handleDownload = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("documentos-bpf").createSignedUrl(d.arquivo_path, 300);
    if (error || !data?.signedUrl) {
      // fallback bucket antigo
      const alt = await supabase.storage.from("feed-bpf").createSignedUrl(d.arquivo_path, 300);
      if (alt.data?.signedUrl) return window.open(alt.data.signedUrl, "_blank");
      return toast.error("Erro ao gerar link");
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (d: Doc) => {
    if (!confirm(`Excluir "${d.titulo}"?`)) return;
    await supabase.storage.from("documentos-bpf").remove([d.arquivo_path]);
    const { error } = await supabase.from("documentos_bpf").delete().eq("id", d.id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Excluído");
      setDocs(docs.filter(x => x.id !== d.id));
    }
  };

  const atualizarPop = async (d: Doc, novoPop: string) => {
    const { error } = await supabase.from("documentos_bpf").update({ pop_codigo: novoPop }).eq("id", d.id);
    if (error) return toast.error("Erro ao vincular POP");
    setDocs(docs.map(x => (x.id === d.id ? { ...x, pop_codigo: novoPop } : x)));
    toast.success(`Vinculado a ${novoPop}`);
  };

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={FolderOpen} title="Meu Acervo" description="Selecione uma empresa para gerenciar documentos" />
        <EmpresaSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderOpen} title="Meu Acervo" description="Documentos organizados por POP — cada card mostra o que você tem" />

      <div className="flex flex-wrap gap-3 items-end">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/feedbpf-custom/importacao"><Upload className="w-4 h-4 mr-2" /> Importar documentos</Link>
        </Button>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por título ou arquivo..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Grid de POPs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {POPS_CUSTOM.map(pop => {
          const s = stats.map[pop.codigo];
          const ativo = popFiltro === pop.codigo;
          return (
            <button
              key={pop.codigo}
              onClick={() => setPopFiltro(ativo ? null : pop.codigo)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                ativo ? "border-emerald-500 bg-emerald-500/10 shadow-md" : "border-border hover:border-emerald-500/50 bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-mono font-bold text-emerald-700">{pop.codigo}</span>
                <span className="text-2xl font-bold">{s.total}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-tight">{pop.nome}</p>
            </button>
          );
        })}
        <button
          onClick={() => setPopFiltro(popFiltro === "__sem__" ? null : "__sem__")}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            popFiltro === "__sem__" ? "border-amber-500 bg-amber-500/10" : "border-amber-200 hover:border-amber-400 bg-amber-50/50"
          }`}
        >
          <div className="flex items-baseline justify-between">
            <Link2Off className="w-4 h-4 text-amber-700" />
            <span className="text-2xl font-bold text-amber-700">{stats.semPopGeral}</span>
          </div>
          <p className="text-xs text-amber-800 mt-2 font-medium">Sem POP vinculado</p>
        </button>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
              <Button asChild variant="link" className="mt-2 text-emerald-600">
                <Link to="/feedbpf-custom/importacao">Importar documentos agora <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filtrados.map(d => (
                <div key={d.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.arquivo_nome} · {d.data_documento ? new Date(d.data_documento + "T12:00").toLocaleDateString("pt-BR") : "sem data"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={d.pop_codigo || ""} onValueChange={(v) => atualizarPop(d, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue placeholder="POP..." />
                      </SelectTrigger>
                      <SelectContent>
                        {POPS_CUSTOM.map(p => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {d.pop_codigo ? <Badge variant="outline" className="text-[10px]">{d.pop_codigo}</Badge> : <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />sem POP</Badge>}
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(d)}><Download className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
