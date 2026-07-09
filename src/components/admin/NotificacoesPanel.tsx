import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Filter, Settings, Trash2, AlertTriangle, Flame, TicketIcon, Key, Zap, Target } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoIcons: Record<string, any> = {
  lead_quente: Flame,
  ticket: TicketIcon,
  licenca_expirando: Key,
  erro_critico: AlertTriangle,
  meta: Target,
  sistema: Zap,
  venda: Target,
  cadencia: Bell,
};

const prioColors: Record<string, string> = {
  baixa: "bg-blue-500/10 text-blue-700",
  media: "bg-yellow-500/10 text-yellow-700",
  alta: "bg-orange-500/10 text-orange-700",
  critica: "bg-red-500/10 text-red-700",
};

export default function NotificacoesPanel() {
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("nao_lidas");
  const qc = useQueryClient();

  const { data: notifs, isLoading } = useQuery({
    queryKey: ["notificacoes-admin", filter],
    queryFn: async () => {
      let q = supabase
        .from("notificacoes_admin")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter === "nao_lidas") q = q.eq("lida", false);
      const { data } = await q;
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const { data: prefs } = useQuery({
    queryKey: ["notif-prefs"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const { data } = await supabase
        .from("notificacoes_preferencias")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("notificacoes_admin")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes-admin"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notificacoes_admin")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("lida", false);
    },
    onSuccess: () => {
      toast.success("Todas marcadas como lidas");
      qc.invalidateQueries({ queryKey: ["notificacoes-admin"] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notificacoes_admin").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes-admin"] }),
  });

  const savePrefs = useMutation({
    mutationFn: async (updates: any) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      await supabase
        .from("notificacoes_preferencias")
        .upsert({ user_id: user.user.id, ...prefs, ...updates }, { onConflict: "user_id" });
    },
    onSuccess: () => {
      toast.success("Preferências salvas");
      qc.invalidateQueries({ queryKey: ["notif-prefs"] });
    },
  });

  const naoLidas = notifs?.filter((n) => !n.lida).length || 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed" className="gap-2">
            <Bell className="h-4 w-4" /> Feed
            {naoLidas > 0 && <Badge variant="destructive" className="ml-1 h-5">{naoLidas}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="prefs" className="gap-2">
            <Settings className="h-4 w-4" /> Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                size="sm"
                variant={filter === "nao_lidas" ? "default" : "outline"}
                onClick={() => setFilter("nao_lidas")}
              >
                Não lidas ({naoLidas})
              </Button>
              <Button
                size="sm"
                variant={filter === "todas" ? "default" : "outline"}
                onClick={() => setFilter("todas")}
              >
                Todas
              </Button>
            </div>
            {naoLidas > 0 && (
              <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="h-4 w-4 mr-1" /> Marcar todas como lidas
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : notifs?.length ? (
            <div className="space-y-2">
              {notifs.map((n) => {
                const Icon = tipoIcons[n.tipo] || Bell;
                return (
                  <Card key={n.id} className={n.lida ? "opacity-70" : "border-primary/30"}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${prioColors[n.prioridade]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium text-sm">{n.titulo}</p>
                            <Badge variant="outline" className="text-xs">{n.tipo.replace("_", " ")}</Badge>
                            <Badge className={`text-xs ${prioColors[n.prioridade]}`}>{n.prioridade}</Badge>
                          </div>
                          {n.mensagem && <p className="text-sm text-muted-foreground mb-2">{n.mensagem}</p>}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                            {n.link && (
                              <a href={n.link} className="text-primary hover:underline">
                                Ver detalhes →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!n.lida && (
                            <Button size="icon" variant="ghost" onClick={() => markRead.mutate(n.id)} title="Marcar como lida">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteNotif.mutate(n.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma notificação {filter === "nao_lidas" ? "não lida" : ""}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="prefs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canais de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["in_app", "email", "whatsapp"].map((canal) => (
                <div key={canal} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm capitalize">{canal.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {canal === "in_app" && "Notificações dentro do portal"}
                      {canal === "email" && "Enviar por e-mail"}
                      {canal === "whatsapp" && "Enviar via Evolution API"}
                    </p>
                  </div>
                  <Switch
                    checked={prefs?.canais?.[canal] ?? (canal !== "whatsapp")}
                    onCheckedChange={(v) =>
                      savePrefs.mutate({ canais: { ...((prefs?.canais as Record<string, boolean>) || {}), [canal]: v } })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Tipos de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(tipoIcons).map((tipo) => {
                const Icon = tipoIcons[tipo];
                return (
                  <div key={tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm capitalize">{tipo.replace("_", " ")}</p>
                    </div>
                    <Switch
                      checked={prefs?.tipos_habilitados?.[tipo] ?? true}
                      onCheckedChange={(v) =>
                        savePrefs.mutate({
                          tipos_habilitados: { ...(prefs?.tipos_habilitados || {}), [tipo]: v },
                        })
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
