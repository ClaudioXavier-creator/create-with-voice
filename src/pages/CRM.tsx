import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, RefreshCw, Mail, MessageCircle, Phone, CalendarPlus, Send, TrendingUp, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";

type Etapa = "novo" | "contato" | "qualificado" | "proposta" | "ganho" | "perdido";
type Origem = "produto" | "site";

interface Pipeline {
  id: string;
  lead_id: string | null;
  lead_origem: Origem;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  produto_interesse: string | null;
  etapa: Etapa;
  responsavel_nome: string | null;
  valor_estimado: number | null;
  motivo_perda: string | null;
  observacoes: string | null;
  created_at: string;
}

interface Interacao {
  id: string;
  tipo: "ligacao" | "email" | "whatsapp" | "reuniao" | "nota";
  descricao: string;
  autor_nome: string | null;
  created_at: string;
}

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  vencimento: string;
  responsavel_nome: string | null;
  status: "pendente" | "concluida" | "cancelada";
}

const ETAPAS: { id: Etapa; label: string; color: string }[] = [
  { id: "novo", label: "Novo", color: "bg-blue-500" },
  { id: "contato", label: "Em contato", color: "bg-amber-500" },
  { id: "qualificado", label: "Qualificado", color: "bg-purple-500" },
  { id: "proposta", label: "Proposta", color: "bg-orange-500" },
  { id: "ganho", label: "Ganho", color: "bg-green-600" },
  { id: "perdido", label: "Perdido", color: "bg-red-500" },
];

function whatsappLink(phone: string | null) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default function CRM({ isTab = false }: { isTab?: boolean }) {
  const { user, roles, loading: authLoading } = useAuth();
  const hasAccess = roles?.includes("admin") || roles?.includes("comercial") || user?.email?.toLowerCase() === "claudiolx.nunes@gmail.com";

  const [tab, setTab] = useState<Origem>("produto");
  const [items, setItems] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pipeline | null>(null);

  const load = async () => {
    setLoading(true);
    // Removemos filtros para que o superadmin veja TODOS os leads de TODOS os programas
    const { data, error } = await supabase
      .from("crm_pipeline")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    else setItems((data ?? []) as Pipeline[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && hasAccess) void load();
  }, [authLoading, hasAccess]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const isSuperAdmin = user?.email?.toLowerCase() === "claudiolx.nunes@gmail.com";

    return items
      .filter((i) => isSuperAdmin || i.lead_origem === tab)
      .filter((i) =>
        !q ||
        [i.nome, i.email ?? "", i.telefone ?? "", i.produto_interesse ?? "", i.lead_origem ?? ""]
          .some((v) => v.toLowerCase().includes(q)),
      );
  }, [items, tab, search, user]);

  const stats = useMemo(() => {
    const isSuperAdmin = user?.email?.toLowerCase() === "claudiolx.nunes@gmail.com";
    const list = isSuperAdmin ? items : items.filter((i) => i.lead_origem === tab);
    
    const total = list.length;
    const ganho = list.filter((i) => i.etapa === "ganho").length;
    const perdido = list.filter((i) => i.etapa === "perdido").length;
    const ativos = total - ganho - perdido;
    const fechados = ganho + perdido;
    const conv = fechados ? Math.round((ganho / fechados) * 100) : 0;
    const valorPipeline = list
      .filter((i) => !["ganho", "perdido"].includes(i.etapa))
      .reduce((acc, i) => acc + (Number(i.valor_estimado) || 0), 0);
    return { total, ganho, perdido, ativos, conv, valorPipeline };
  }, [items, tab, user]);

  const moveEtapa = async (id: string, etapa: Etapa) => {
    const patch: any = { etapa };
    if (etapa === "ganho") patch.ganho_em = new Date().toISOString();
    if (etapa === "perdido") patch.perdido_em = new Date().toISOString();
    const { error } = await supabase.from("crm_pipeline").update(patch).eq("id", id);
    if (error) {
      toast.error("Erro ao mover: " + error.message);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    toast.success("Lead movido");
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth?redirect=/crm" replace />;
  if (!hasAccess) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      {!isTab && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">CRM Comercial</h1>
            <p className="text-muted-foreground">Pipeline de vendas — leads de produto e contatos do site</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={TrendingUp} label="Ativos no funil" value={stats.ativos} />
        <StatCard icon={Trophy} label="Ganhos" value={stats.ganho} valueClass="text-green-600" />
        <StatCard icon={XCircle} label="Perdidos" value={stats.perdido} valueClass="text-red-500" />
        <StatCard label="Taxa conversão" value={`${stats.conv}%`} />
        <StatCard label="Valor pipeline" value={stats.valorPipeline.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Origem)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {user?.email?.toLowerCase() !== "claudiolx.nunes@gmail.com" ? (
            <TabsList>
              <TabsTrigger value="produto">Leads de produto</TabsTrigger>
              <TabsTrigger value="site">Contatos do site</TabsTrigger>
            </TabsList>
          ) : (
            <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-md border">
              Visão Global de Leads (SuperAdmin)
            </div>
          )}
          <Input
            placeholder="Buscar por nome, e-mail, programa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-80"
          />
        </div>

        <TabsContent value="produto" className="mt-4">
          <Kanban items={filtered} onMove={moveEtapa} onSelect={setSelected} loading={loading} />
        </TabsContent>
        <TabsContent value="site" className="mt-4">
          <Kanban items={filtered} onMove={moveEtapa} onSelect={setSelected} loading={loading} />
        </TabsContent>
      </Tabs>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onChanged={() => { void load(); }}
        currentUserName={user.email ?? ""}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, valueClass }: { icon?: any; label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {Icon && <Icon className="h-3 w-3" />}{label}
        </div>
        <div className={`text-2xl font-bold mt-1 ${valueClass ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Kanban({
  items, onMove, onSelect, loading,
}: {
  items: Pipeline[];
  onMove: (id: string, etapa: Etapa) => void;
  onSelect: (p: Pipeline) => void;
  loading: boolean;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto">
      {ETAPAS.map((etapa) => {
        const list = items.filter((i) => i.etapa === etapa.id);
        return (
          <div
            key={etapa.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragId) onMove(dragId, etapa.id); setDragId(null); }}
            className="bg-muted/40 rounded-lg p-2 min-h-[300px]"
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${etapa.color}`} />
                <span className="font-semibold text-sm">{etapa.label}</span>
              </div>
              <Badge variant="secondary" className="text-xs">{list.length}</Badge>
            </div>
            <div className="space-y-2">
              {list.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onClick={() => onSelect(p)}
                  className="bg-card border rounded-md p-2 text-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="font-medium truncate">{p.nome}</div>
                  {p.produto_interesse && (
                    <Badge variant="outline" className="text-[10px] mt-1">{p.produto_interesse}</Badge>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 truncate">{p.email}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtDateShort(p.created_at)}</div>
                </div>
              ))}
              {list.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Vazio</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadDrawer({
  lead, onClose, onChanged, currentUserName,
}: {
  lead: Pipeline | null;
  onClose: () => void;
  onChanged: () => void;
  currentUserName: string;
}) {
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaInt, setNovaInt] = useState({ tipo: "nota" as Interacao["tipo"], descricao: "" });
  const [novaTarefa, setNovaTarefa] = useState({ titulo: "", vencimento: "" });
  const [email, setEmail] = useState({ assunto: "", corpo: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [valorEst, setValorEst] = useState("");
  const [motivoPerda, setMotivoPerda] = useState("");

  useEffect(() => {
    if (!lead) return;
    setValorEst(lead.valor_estimado ? String(lead.valor_estimado) : "");
    setMotivoPerda(lead.motivo_perda ?? "");
    void (async () => {
      const [{ data: ints }, { data: tars }] = await Promise.all([
        supabase.from("crm_interacoes").select("*").eq("pipeline_id", lead.id).order("created_at", { ascending: false }),
        supabase.from("crm_tarefas").select("*").eq("pipeline_id", lead.id).order("vencimento", { ascending: true }),
      ]);
      setInteracoes((ints ?? []) as Interacao[]);
      setTarefas((tars ?? []) as Tarefa[]);
    })();
  }, [lead]);

  if (!lead) return null;

  const addInteracao = async () => {
    if (!novaInt.descricao.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("crm_interacoes")
      .insert({
        pipeline_id: lead.id,
        tipo: novaInt.tipo,
        descricao: novaInt.descricao.trim(),
        autor_id: user.id,
        autor_nome: currentUserName,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setInteracoes((p) => [data as Interacao, ...p]);
    setNovaInt({ tipo: "nota", descricao: "" });
    toast.success("Registrado");
  };

  const addTarefa = async () => {
    if (!novaTarefa.titulo.trim() || !novaTarefa.vencimento) return;
    const { data, error } = await supabase
      .from("crm_tarefas")
      .insert({
        pipeline_id: lead.id,
        titulo: novaTarefa.titulo.trim(),
        vencimento: new Date(novaTarefa.vencimento).toISOString(),
        responsavel_nome: currentUserName,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setTarefas((p) => [...p, data as Tarefa].sort((a, b) => a.vencimento.localeCompare(b.vencimento)));
    setNovaTarefa({ titulo: "", vencimento: "" });
    toast.success("Tarefa criada");
  };

  const concluirTarefa = async (id: string) => {
    const { error } = await supabase
      .from("crm_tarefas")
      .update({ status: "concluida", concluida_em: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setTarefas((p) => p.map((t) => (t.id === id ? { ...t, status: "concluida" } : t)));
  };

  const enviarEmail = async () => {
    if (!lead.email) return toast.error("Lead sem e-mail");
    if (!email.assunto.trim() || !email.corpo.trim()) return toast.error("Preencha assunto e corpo");
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-send-email", {
        body: {
          pipeline_id: lead.id,
          para_email: lead.email,
          assunto: email.assunto.trim(),
          corpo_html: email.corpo.trim().replace(/\n/g, "<br/>"),
          remetente_nome: currentUserName,
        },
      });
      if (error || !data?.ok) throw new Error(data?.erro || error?.message || "Falha");
      toast.success("E-mail enviado");
      setEmail({ assunto: "", corpo: "" });
      // Recarrega interações
      const { data: ints } = await supabase.from("crm_interacoes").select("*").eq("pipeline_id", lead.id).order("created_at", { ascending: false });
      setInteracoes((ints ?? []) as Interacao[]);
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const salvarValor = async () => {
    const num = parseFloat(valorEst);
    const { error } = await supabase
      .from("crm_pipeline")
      .update({ valor_estimado: isNaN(num) ? null : num, motivo_perda: motivoPerda || null })
      .eq("id", lead.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    onChanged();
  };

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lead.nome}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Contato rápido */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm"><strong>E-mail:</strong> {lead.email ?? "—"}</div>
              <div className="text-sm"><strong>Telefone:</strong> {lead.telefone ?? "—"}</div>
              <div className="text-sm"><strong>Produto:</strong> {lead.produto_interesse ?? "—"}</div>
              <div className="text-sm"><strong>Recebido em:</strong> {fmtDate(lead.created_at)}</div>
              {lead.observacoes && <div className="text-sm"><strong>Mensagem original:</strong> {lead.observacoes}</div>}
              <div className="flex gap-2 pt-2">
                {lead.telefone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappLink(lead.telefone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a>
                  </Button>
                )}
                {lead.telefone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${lead.telefone}`}><Phone className="h-4 w-4 mr-1" />Ligar</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Negócio */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Negócio</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Valor estimado (R$)</label>
                  <Input type="number" step="0.01" value={valorEst} onChange={(e) => setValorEst(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Motivo perda</label>
                  <Input value={motivoPerda} onChange={(e) => setMotivoPerda(e.target.value)} placeholder="Se perdido" />
                </div>
              </div>
              <Button size="sm" onClick={salvarValor}>Salvar</Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="historico">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
              <TabsTrigger value="email">E-mail</TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="space-y-3 mt-3">
              <div className="flex gap-2">
                <Select value={novaInt.tipo} onValueChange={(v) => setNovaInt((p) => ({ ...p, tipo: v as any }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nota">Nota</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="O que aconteceu?" value={novaInt.descricao} onChange={(e) => setNovaInt((p) => ({ ...p, descricao: e.target.value }))} />
                <Button onClick={addInteracao}>+</Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {interacoes.map((i) => (
                  <div key={i.id} className="border-l-2 border-primary pl-3 py-1">
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span><Badge variant="outline" className="text-[10px]">{i.tipo}</Badge> {i.autor_nome}</span>
                      <span>{fmtDate(i.created_at)}</span>
                    </div>
                    <div className="text-sm">{i.descricao}</div>
                  </div>
                ))}
                {interacoes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem registros</p>}
              </div>
            </TabsContent>

            <TabsContent value="tarefas" className="space-y-3 mt-3">
              <div className="flex gap-2">
                <Input placeholder="Título da tarefa" value={novaTarefa.titulo} onChange={(e) => setNovaTarefa((p) => ({ ...p, titulo: e.target.value }))} />
                <Input type="datetime-local" value={novaTarefa.vencimento} onChange={(e) => setNovaTarefa((p) => ({ ...p, vencimento: e.target.value }))} />
                <Button onClick={addTarefa}><CalendarPlus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {tarefas.map((t) => (
                  <div key={t.id} className={`border rounded p-2 flex justify-between items-center ${t.status === "concluida" ? "opacity-50 line-through" : ""}`}>
                    <div>
                      <div className="text-sm font-medium">{t.titulo}</div>
                      <div className="text-xs text-muted-foreground">Vence: {fmtDate(t.vencimento)}</div>
                    </div>
                    {t.status === "pendente" && <Button size="sm" variant="outline" onClick={() => concluirTarefa(t.id)}>Concluir</Button>}
                  </div>
                ))}
                {tarefas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem tarefas</p>}
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 mt-3">
              {!lead.email ? (
                <p className="text-sm text-muted-foreground">Este lead não tem e-mail cadastrado.</p>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground">Para: {lead.email}</div>
                  <Input placeholder="Assunto" value={email.assunto} onChange={(e) => setEmail((p) => ({ ...p, assunto: e.target.value }))} />
                  <Textarea rows={8} placeholder="Escreva sua mensagem..." value={email.corpo} onChange={(e) => setEmail((p) => ({ ...p, corpo: e.target.value }))} />
                  <Button onClick={enviarEmail} disabled={sendingEmail} className="w-full">
                    {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar e-mail
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
