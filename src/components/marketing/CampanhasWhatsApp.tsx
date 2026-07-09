import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Megaphone, Play, Pause, Square, Trash2, RefreshCw, Users,
  ListChecks, Send, AlertTriangle, Loader2, Eye
} from "lucide-react";
import { BoasPraticasWhatsApp } from "@/components/marketing/BoasPraticasWhatsApp";

type Campanha = {
  id: string;
  nome: string;
  template_texto: string;
  status: string;
  filtros: any;
  intervalo_min_seg: number;
  intervalo_max_seg: number;
  pausa_a_cada: number;
  pausa_duracao_seg: number;
  limite_diario: number;
  total: number;
  enviados: number;
  erros: number;
  optouts: number;
  enviados_hoje: number;
  iniciada_em: string | null;
  ultimo_envio_em: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-slate-500",
  em_andamento: "bg-emerald-600",
  pausada: "bg-amber-500",
  concluida: "bg-blue-600",
  cancelada: "bg-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  pausada: "Pausada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export default function CampanhasWhatsApp() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaOpen, setNovaOpen] = useState(false);
  const [preview, setPreview] = useState<{ total: number; amostra: any[] } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Form nova campanha
  const [form, setForm] = useState({
    nome: "",
    template_texto: "Olá {{nome}}, tudo bem?\n\nSou do BPF_Consult...\n\nResponda SAIR para não receber mais.",
    origens: ["crm_pipeline", "leads", "leads_contato"] as string[],
    etapas: ["novo", "contato", "qualificado"] as string[],
    produto: "",
    intervalo_min_seg: 30,
    intervalo_max_seg: 90,
    pausa_a_cada: 20,
    pausa_duracao_seg: 300,
    limite_diario: 300,
  });

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("campanhas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro: " + error.message);
    setCampanhas((data ?? []) as any);
    setLoading(false);
  }

  useEffect(() => { void carregar(); }, []);

  async function acao(action: string, campanha_id?: string, extras?: any) {
    setBusy((campanha_id ?? "novo") + ":" + action);
    try {
      const { data, error } = await supabase.functions.invoke("campanha-actions", {
        body: { action, campanha_id, ...extras },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Falha");
      return data;
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handlePreview() {
    const r = await acao("preview_contatos", undefined, {
      filtros: {
        origens: form.origens,
        etapas: form.etapas,
        produto: form.produto || undefined,
      },
    });
    if (r) setPreview({ total: r.total, amostra: r.amostra ?? [] });
  }

  async function handleCriar() {
    if (!form.nome.trim()) return toast.error("Informe o nome da campanha");
    if (!form.template_texto.trim()) return toast.error("Informe o template da mensagem");

    setBusy("novo:criar");
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: nova, error } = await supabase.from("campanhas").insert({
        nome: form.nome,
        template_texto: form.template_texto,
        intervalo_min_seg: form.intervalo_min_seg,
        intervalo_max_seg: form.intervalo_max_seg,
        pausa_a_cada: form.pausa_a_cada,
        pausa_duracao_seg: form.pausa_duracao_seg,
        limite_diario: form.limite_diario,
        filtros: { origens: form.origens, etapas: form.etapas, produto: form.produto || null },
        created_by: user.user?.id,
      }).select().single();
      if (error) throw error;

      const r = await acao("gerar_fila", nova.id, {
        filtros: { origens: form.origens, etapas: form.etapas, produto: form.produto || undefined },
      });
      if (r) {
        toast.success(`Campanha criada com ${r.total} contatos na fila`);
        setNovaOpen(false);
        setPreview(null);
        await carregar();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar");
    } finally {
      setBusy(null);
    }
  }

  async function handleIniciar(id: string) {
    if (!confirm("Iniciar campanha? Os envios começarão automaticamente no ritmo configurado.")) return;
    const r = await acao("iniciar", id);
    if (r) { toast.success("Campanha iniciada"); await carregar(); }
  }
  async function handlePausar(id: string) {
    const r = await acao("pausar", id);
    if (r) { toast.success("Pausada"); await carregar(); }
  }
  async function handleRetomar(id: string) {
    const r = await acao("retomar", id);
    if (r) { toast.success("Retomada"); await carregar(); }
  }
  async function handleCancelar(id: string) {
    if (!confirm("Cancelar a campanha? As mensagens pendentes serão descartadas.")) return;
    const r = await acao("cancelar", id);
    if (r) { toast.success("Cancelada"); await carregar(); }
  }
  async function handleExcluir(id: string) {
    if (!confirm("Excluir permanentemente esta campanha e sua fila?")) return;
    const { error } = await supabase.from("campanhas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    await carregar();
  }

  return (
    <div className="space-y-4">
      <BoasPraticasWhatsApp />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Campanhas WhatsApp</CardTitle>
            <CardDescription>Envios em massa com fila, intervalos randômicos e limite diário</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={novaOpen} onOpenChange={(o) => { setNovaOpen(o); if (!o) setPreview(null); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Megaphone className="h-4 w-4 mr-1" /> Nova campanha</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova campanha WhatsApp</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div>
                    <Label>Nome da campanha</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Prospecção Feed_BPF Julho" />
                  </div>

                  <div>
                    <Label>Mensagem (variáveis: {`{{nome}} {{empresa}} {{produto}}`})</Label>
                    <Textarea rows={6} value={form.template_texto}
                      onChange={(e) => setForm({ ...form, template_texto: e.target.value })} />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Inclua a instrução de opt-out ("Responda SAIR para não receber mais") — obrigatório por boa prática.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Origem dos contatos</Label>
                      <div className="space-y-1 mt-1 text-sm">
                        {[
                          { v: "crm_pipeline", l: "CRM Pipeline" },
                          { v: "leads", l: "Leads (produtos)" },
                          { v: "leads_contato", l: "Leads (Fale conosco)" },
                        ].map((o) => (
                          <label key={o.v} className="flex items-center gap-2">
                            <input type="checkbox" checked={form.origens.includes(o.v)}
                              onChange={(e) => setForm({
                                ...form,
                                origens: e.target.checked
                                  ? [...form.origens, o.v]
                                  : form.origens.filter((x) => x !== o.v),
                              })} />
                            {o.l}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Etapas do CRM</Label>
                      <div className="space-y-1 mt-1 text-sm">
                        {["novo", "contato", "qualificado", "proposta"].map((e) => (
                          <label key={e} className="flex items-center gap-2">
                            <input type="checkbox" checked={form.etapas.includes(e)}
                              onChange={(ev) => setForm({
                                ...form,
                                etapas: ev.target.checked
                                  ? [...form.etapas, e]
                                  : form.etapas.filter((x) => x !== e),
                              })} />
                            {e}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Filtro produto (contém)</Label>
                    <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })}
                      placeholder="Ex: Feed_BPF, Audits_BPF..." />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Intervalo mín (s)</Label>
                      <Input type="number" min={10} value={form.intervalo_min_seg}
                        onChange={(e) => setForm({ ...form, intervalo_min_seg: +e.target.value })} /></div>
                    <div><Label>Intervalo máx (s)</Label>
                      <Input type="number" min={10} value={form.intervalo_max_seg}
                        onChange={(e) => setForm({ ...form, intervalo_max_seg: +e.target.value })} /></div>
                    <div><Label>Pausar a cada (msgs)</Label>
                      <Input type="number" min={1} value={form.pausa_a_cada}
                        onChange={(e) => setForm({ ...form, pausa_a_cada: +e.target.value })} /></div>
                    <div><Label>Duração pausa (s)</Label>
                      <Input type="number" min={0} value={form.pausa_duracao_seg}
                        onChange={(e) => setForm({ ...form, pausa_duracao_seg: +e.target.value })} /></div>
                    <div className="col-span-2"><Label>Limite diário</Label>
                      <Input type="number" min={1} value={form.limite_diario}
                        onChange={(e) => setForm({ ...form, limite_diario: +e.target.value })} />
                      <p className="text-xs text-muted-foreground mt-1">Recomendado: 100–300 para chip novo, até 600 para aquecido.</p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={handlePreview} disabled={busy === "novo:preview_contatos"}>
                    <Eye className="h-4 w-4 mr-1" />
                    {busy === "novo:preview_contatos" ? "Buscando..." : "Pré-visualizar contatos"}
                  </Button>

                  {preview && (
                    <div className="rounded-md border p-3 text-sm bg-muted/30">
                      <p><Users className="inline h-4 w-4 mr-1" /> <strong>{preview.total}</strong> contatos encontrados (deduplicados por telefone).</p>
                      {preview.amostra.length > 0 && (
                        <ul className="mt-2 text-xs space-y-0.5 text-muted-foreground">
                          {preview.amostra.map((c, i) => (
                            <li key={i}>• {c.nome ?? "—"} — {c.telefone} {c.produto ? `(${c.produto})` : ""}</li>
                          ))}
                          {preview.total > 10 && <li>• ... e mais {preview.total - 10}</li>}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovaOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCriar} disabled={busy === "novo:criar"}>
                    {busy === "novo:criar" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ListChecks className="h-4 w-4 mr-1" />}
                    Criar e enfileirar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : campanhas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma campanha ainda. Clique em "Nova campanha" para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {campanhas.map((c) => {
                const progresso = c.total > 0 ? Math.round(((c.enviados + c.erros + c.optouts) / c.total) * 100) : 0;
                return (
                  <div key={c.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{c.nome}</h4>
                          <Badge className={STATUS_COLORS[c.status] + " text-white"}>{STATUS_LABEL[c.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ritmo: {c.intervalo_min_seg}–{c.intervalo_max_seg}s • Pausa {c.pausa_duracao_seg}s a cada {c.pausa_a_cada} • Limite {c.limite_diario}/dia
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {c.status === "rascunho" && (
                          <Button size="sm" onClick={() => handleIniciar(c.id)} disabled={busy?.startsWith(c.id)}>
                            <Play className="h-3 w-3 mr-1" /> Iniciar
                          </Button>
                        )}
                        {c.status === "em_andamento" && (
                          <Button size="sm" variant="outline" onClick={() => handlePausar(c.id)}>
                            <Pause className="h-3 w-3 mr-1" /> Pausar
                          </Button>
                        )}
                        {c.status === "pausada" && (
                          <Button size="sm" onClick={() => handleRetomar(c.id)}>
                            <Play className="h-3 w-3 mr-1" /> Retomar
                          </Button>
                        )}
                        {["em_andamento", "pausada", "rascunho"].includes(c.status) && (
                          <Button size="sm" variant="outline" onClick={() => handleCancelar(c.id)}>
                            <Square className="h-3 w-3 mr-1" /> Cancelar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleExcluir(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Progress value={progresso} />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span><Send className="inline h-3 w-3 mr-0.5" /> {c.enviados}/{c.total} enviadas</span>
                      <span className="text-red-600"><AlertTriangle className="inline h-3 w-3 mr-0.5" /> {c.erros} erros</span>
                      <span>🚫 {c.optouts} opt-outs</span>
                      <span>📅 Hoje: {c.enviados_hoje}/{c.limite_diario}</span>
                      {c.ultimo_envio_em && <span>Último: {new Date(c.ultimo_envio_em).toLocaleString("pt-BR")}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
