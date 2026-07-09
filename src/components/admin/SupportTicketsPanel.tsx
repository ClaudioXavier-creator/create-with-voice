import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Phone, MessageSquare, ThumbsDown, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Ticket = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  mensagem: string | null;
  programa: string | null;
  status: string | null;
  created_at: string;
};

type Feedback = {
  id: string;
  user_query: string | null;
  assistant_response: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
};

export default function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"abertos" | "todos" | "resolvidos">("abertos");

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, fRes] = await Promise.all([
        supabase
          .from("leads_contato")
          .select("id, nome, email, telefone, mensagem, programa, status, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("ai_chat_feedback")
          .select("id, user_query, assistant_response, rating, feedback_text, created_at")
          .eq("rating", -1)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (tRes.error) throw tRes.error;
      setTickets((tRes.data as Ticket[]) || []);
      setFeedbacks((fRes.data as Feedback[]) || []);
    } catch (e: any) {
      toast.error("Erro ao carregar tickets: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads_contato").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const filtered = tickets.filter((t) => {
    const s = (t.status || "novo").toLowerCase();
    if (filter === "abertos") return s === "novo" || s === "em_andamento";
    if (filter === "resolvidos") return s === "resolvido";
    return true;
  });

  const countByStatus = (s: string) =>
    tickets.filter((t) => (t.status || "novo").toLowerCase() === s).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Novos" value={countByStatus("novo")} tone="amber" />
        <StatCard label="Em andamento" value={countByStatus("em_andamento")} tone="blue" />
        <StatCard label="Resolvidos" value={countByStatus("resolvido")} tone="emerald" />
        <StatCard label="Feedback negativo IA" value={feedbacks.length} tone="red" icon={<ThumbsDown className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="tickets">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList>
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="ia" className="gap-2">
              <ThumbsDown className="h-4 w-4" /> Feedback IA ({feedbacks.length})
            </TabsTrigger>
          </TabsList>
          <Button size="sm" variant="outline" onClick={load} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>

        <TabsContent value="tickets" className="space-y-3 mt-4">
          <div className="flex gap-2">
            {(["abertos", "todos", "resolvidos"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Nenhum ticket nesta categoria.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <Card key={t.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                          {t.nome}
                          <Badge variant="outline">{t.programa || "Contato"}</Badge>
                          <StatusBadge status={t.status || "novo"} />
                        </CardTitle>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                          <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-primary">
                            <Mail className="h-3 w-3" /> {t.email}
                          </a>
                          {t.telefone && (
                            <a
                              href={`https://wa.me/55${t.telefone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Phone className="h-3 w-3" /> {t.telefone}
                            </a>
                          )}
                          <span>
                            {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(t.status || "novo") !== "em_andamento" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "em_andamento")}>
                            Em andamento
                          </Button>
                        )}
                        {(t.status || "novo") !== "resolvido" && (
                          <Button size="sm" onClick={() => updateStatus(t.id, "resolvido")} className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {t.mensagem && (
                    <CardContent className="pt-0">
                      <div className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3 border">
                        {t.mensagem}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ia" className="space-y-3 mt-4">
          {feedbacks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Nenhum feedback negativo registrado.
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((f) => (
              <Card key={f.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="destructive" className="gap-1">
                      <ThumbsDown className="h-3 w-3" /> Negativo
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(f.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {f.user_query && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Pergunta
                      </div>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-2">{f.user_query}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Resposta IA
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 line-clamp-4">{f.assistant_response}</div>
                  </div>
                  {f.feedback_text && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Comentário do usuário
                      </div>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                        {f.feedback_text}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "emerald" | "red";
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <Card className={`border ${tones[tone]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    novo: { label: "Novo", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
    em_andamento: { label: "Em andamento", className: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
    resolvido: { label: "Resolvido", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  };
  const s = map[status] || map.novo;
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}
