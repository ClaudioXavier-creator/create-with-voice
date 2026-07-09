import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Play, Trash2, Zap, Mail, MessageSquare, Loader2, Users } from "lucide-react";

interface Passo {
  dia: number;
  canal: "email" | "whatsapp";
  assunto?: string;
  corpo: string;
}
interface Cadencia {
  id: string;
  nome: string;
  produto: string | null;
  etapa_gatilho: string;
  tier_gatilho: string;
  ativo: boolean;
  passos: Passo[];
  created_at: string;
}

const ETAPAS = ["novo", "contato_inicial", "qualificado", "proposta", "negociacao", "ganho", "perdido"];
const TIERS = ["todos", "quente", "morno", "frio"];
const PRODUTOS = ["", "feed_bpf", "audits_bpf", "agrogestao", "nutricrm", "feedbpfcustom"];

export default function CadenciasPanel() {
  const [cadencias, setCadencias] = useState<Cadencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cadencia | null>(null);
  const [running, setRunning] = useState(false);
  const [execs, setExecs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: cads }, { data: exs }] = await Promise.all([
      supabase.from("crm_cadencias").select("*").order("created_at", { ascending: false }),
      supabase.from("crm_cadencia_execucoes").select("*").order("proximo_envio_em", { ascending: true }).limit(100),
    ]);
    setCadencias((cads || []) as any);
    setExecs(exs || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing({
      id: "", nome: "", produto: null, etapa_gatilho: "novo", tier_gatilho: "todos", ativo: true,
      passos: [{ dia: 0, canal: "whatsapp", corpo: "Olá {{primeiro_nome}}, aqui é da BPF Consult. Vi seu interesse e quero te apoiar. Podemos conversar?" }],
      created_at: "",
    });
    setDialogOpen(true);
  };
  const openEdit = (c: Cadencia) => { setEditing(JSON.parse(JSON.stringify(c))); setDialogOpen(true); };

  const salvar = async () => {
    if (!editing) return;
    if (!editing.nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id,
      nome: editing.nome,
      produto: editing.produto || null,
      etapa_gatilho: editing.etapa_gatilho,
      tier_gatilho: editing.tier_gatilho,
      ativo: editing.ativo,
      passos: editing.passos as any,
    };
    const res = editing.id
      ? await supabase.from("crm_cadencias").update(payload).eq("id", editing.id)
      : await supabase.from("crm_cadencias").insert(payload);
    if (res.error) { toast({ title: "Erro", description: res.error.message, variant: "destructive" }); return; }
    toast({ title: "Cadência salva" });
    setDialogOpen(false); load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir cadência? Todas execuções ativas serão canceladas.")) return;
    await supabase.from("crm_cadencias").delete().eq("id", id);
    load();
  };

  const rodarAgora = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("cadencia-worker", { body: {} });
      if (error) throw error;
      toast({ title: "Worker executado", description: `Processadas: ${data?.processadas || 0} · Enviadas: ${data?.enviadas || 0} · Erros: ${data?.erros || 0}` });
      load();
    } catch (e: any) {
      toast({ title: "Falha", description: e.message, variant: "destructive" });
    } finally { setRunning(false); }
  };

  const inscreverLeads = async (c: Cadencia) => {
    // Busca leads do pipeline na etapa/produto gatilho e cria execuções
    let q = supabase.from("crm_pipeline").select("id,nome,email,telefone,etapa,produto_interesse").eq("etapa", c.etapa_gatilho);
    if (c.produto) q = q.eq("produto_interesse", c.produto);
    const { data: leads } = await q;
    if (!leads?.length) { toast({ title: "Nenhum lead encontrado nesta etapa/produto" }); return; }

    const { data: jaExistem } = await supabase
      .from("crm_cadencia_execucoes")
      .select("pipeline_id")
      .eq("cadencia_id", c.id)
      .in("status", ["ativa", "concluida"]);
    const existentes = new Set((jaExistem || []).map((e: any) => e.pipeline_id));

    const rows = leads
      .filter((l: any) => !existentes.has(l.id) && (l.email || l.telefone))
      .map((l: any) => ({
        cadencia_id: c.id,
        pipeline_id: l.id,
        lead_email: l.email,
        lead_telefone: l.telefone,
        lead_nome: l.nome,
        passo_atual: 0,
        proximo_envio_em: new Date().toISOString(),
        status: "ativa",
      }));

    if (!rows.length) { toast({ title: "Todos os leads já estão nesta cadência" }); return; }
    const { error } = await supabase.from("crm_cadencia_execucoes").insert(rows);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${rows.length} lead(s) inscrito(s)` });
    load();
  };

  const statusCount = (s: string) => execs.filter((e) => e.status === s).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automações de Cadência</h2>
          <p className="text-sm text-muted-foreground">Sequências automáticas de follow-up (email + WhatsApp) por etapa do pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={rodarAgora} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Rodar worker agora
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova cadência</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{cadencias.filter(c => c.ativo).length}</div><div className="text-xs text-muted-foreground">Cadências ativas</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{statusCount("ativa")}</div><div className="text-xs text-muted-foreground">Execuções em curso</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{statusCount("concluida")}</div><div className="text-xs text-muted-foreground">Concluídas</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-destructive">{execs.filter(e => e.ultimo_erro).length}</div><div className="text-xs text-muted-foreground">Com erro</div></CardContent></Card>
      </div>

      <Tabs defaultValue="cadencias">
        <TabsList><TabsTrigger value="cadencias">Cadências</TabsTrigger><TabsTrigger value="execucoes">Execuções</TabsTrigger></TabsList>

        <TabsContent value="cadencias" className="space-y-3">
          {loading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> :
            cadencias.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma cadência ainda. Clique em "Nova cadência".</CardContent></Card> :
              cadencias.map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{c.nome}</h3>
                          {c.ativo ? <Badge className="bg-emerald-500">Ativa</Badge> : <Badge variant="secondary">Pausada</Badge>}
                          <Badge variant="outline">Etapa: {c.etapa_gatilho}</Badge>
                          <Badge variant="outline">Tier: {c.tier_gatilho}</Badge>
                          {c.produto && <Badge variant="outline">{c.produto}</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{c.passos.length} passo(s) · {c.passos.filter(p => p.canal === "whatsapp").length} WhatsApp · {c.passos.filter(p => p.canal === "email").length} email</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => inscreverLeads(c)}><Users className="h-4 w-4 mr-1" /> Inscrever leads</Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => excluir(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </TabsContent>

        <TabsContent value="execucoes">
          <Card><CardContent className="pt-4">
            {execs.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhuma execução ainda.</div> :
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {execs.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 p-2 border rounded text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{e.lead_nome || e.lead_email || e.lead_telefone}</div>
                      <div className="text-xs text-muted-foreground truncate">Passo {e.passo_atual} · próximo: {new Date(e.proximo_envio_em).toLocaleString("pt-BR")} {e.ultimo_erro && <span className="text-destructive">· {e.ultimo_erro.slice(0, 60)}</span>}</div>
                    </div>
                    <Badge variant={e.status === "ativa" ? "default" : e.status === "concluida" ? "secondary" : "outline"}>{e.status}</Badge>
                  </div>
                ))}
              </div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nova"} cadência</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                <div className="flex items-end gap-2"><Switch checked={editing.ativo} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} /><Label>Ativa</Label></div>
                <div><Label>Etapa gatilho</Label>
                  <Select value={editing.etapa_gatilho} onValueChange={(v) => setEditing({ ...editing, etapa_gatilho: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Tier</Label>
                  <Select value={editing.tier_gatilho} onValueChange={(v) => setEditing({ ...editing, tier_gatilho: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIERS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Produto (opcional)</Label>
                  <Select value={editing.produto || "todos"} onValueChange={(v) => setEditing({ ...editing, produto: v === "todos" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todos">Todos</SelectItem>{PRODUTOS.filter(p => p).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Passos da sequência</Label>
                  <Button size="sm" variant="outline" onClick={() => setEditing({ ...editing, passos: [...editing.passos, { dia: 2, canal: "whatsapp", corpo: "" }] })}>
                    <Plus className="h-4 w-4 mr-1" /> Passo
                  </Button>
                </div>
                <div className="space-y-2">
                  {editing.passos.map((p, i) => (
                    <Card key={i}><CardContent className="pt-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label className="text-xs">Dias após anterior</Label><Input type="number" min={0} value={p.dia} onChange={(e) => { const ps = [...editing.passos]; ps[i].dia = Number(e.target.value); setEditing({ ...editing, passos: ps }); }} /></div>
                        <div><Label className="text-xs">Canal</Label>
                          <Select value={p.canal} onValueChange={(v: any) => { const ps = [...editing.passos]; ps[i].canal = v; setEditing({ ...editing, passos: ps }); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="whatsapp"><MessageSquare className="h-3 w-3 inline mr-1" />WhatsApp</SelectItem><SelectItem value="email"><Mail className="h-3 w-3 inline mr-1" />Email</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end justify-end"><Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, passos: editing.passos.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>
                      </div>
                      {p.canal === "email" && <div><Label className="text-xs">Assunto</Label><Input value={p.assunto || ""} onChange={(e) => { const ps = [...editing.passos]; ps[i].assunto = e.target.value; setEditing({ ...editing, passos: ps }); }} /></div>}
                      <div><Label className="text-xs">Corpo {p.canal === "email" && "(HTML)"} — variáveis: {"{{primeiro_nome}}"} {"{{nome}}"} {"{{email}}"}</Label>
                        <Textarea rows={4} value={p.corpo} onChange={(e) => { const ps = [...editing.passos]; ps[i].corpo = e.target.value; setEditing({ ...editing, passos: ps }); }} />
                      </div>
                    </CardContent></Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
