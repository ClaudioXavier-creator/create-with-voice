import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, RefreshCw, Trash2, CheckCircle2, Search, Clock, Shield, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ErrorLog {
  id: string;
  user_id: string | null;
  error_type: string;
  message: string | null;
  stack: string | null;
  component_stack: string | null;
  route: string | null;
  user_agent: string | null;
  app_version: string | null;
  boot_elapsed_ms: number | null;
  extra: any;
  created_at: string;
  status: "pending" | "investigating" | "resolved" | "ignored";
  resolution_notes: string | null;
  resolved_at: string | null;
  fixed_in_version: string | null;
}

const TYPE_LABEL: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  boundary: { label: "React Boundary", variant: "destructive" },
  chunk_error: { label: "Chunk Error", variant: "destructive" },
  boot_failsafe: { label: "Boot Failsafe", variant: "destructive" },
  unhandled_error: { label: "Unhandled", variant: "secondary" },
  promise_rejection: { label: "Promise Reject", variant: "secondary" },
};

export default function AppErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [fixVersion, setFixVersion] = useState("");

  const load = async () => {
    setLoading(true);
    let query = (supabase.from("app_error_logs") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (filterType !== "all") {
      query = query.eq("error_type", filterType);
    }
    
    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    
    if (searchQuery) {
      query = query.or(`message.ilike.%${searchQuery}%,stack.ilike.%${searchQuery}%,app_version.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar logs: " + error.message);
    } else {
      setLogs((data as ErrorLog[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterType, filterStatus, searchQuery]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await (supabase.from("app_error_logs") as any)
      .update({ 
        status,
        resolution_notes: status === "resolved" ? resolutionNote : null,
        fixed_in_version: status === "resolved" ? fixVersion : null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Status atualizado");
      setResolutionNote("");
      setFixVersion("");
      load();
    }
    setUpdatingId(null);
  };

  const clearOld = async () => {
    if (!confirm("Apagar logs com mais de 30 dias?")) return;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await (supabase.from("app_error_logs") as any).delete().lt("created_at", cutoff);
    if (error) {
      toast.error("Falha ao limpar: " + error.message);
    } else {
      toast.success("Logs antigos removidos");
      load();
    }
  };

  const counts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.error_type] = (acc[l.error_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Central de Correções e Auditoria de Erros
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Gerencie o status de resolução dos problemas técnicos reportados em todos os programas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar em mensagens/pilha..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={load} disabled={loading} className="shrink-0 h-9 w-9">
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
            <Button variant="outline" size="icon" onClick={clearOld} title="Limpar logs >30d" className="shrink-0 h-9 w-9 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tipo:</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="boundary">React Boundary</SelectItem>
                <SelectItem value="chunk_error">Chunk Error</SelectItem>
                <SelectItem value="boot_failsafe">Boot Failsafe</SelectItem>
                <SelectItem value="unhandled_error">Unhandled</SelectItem>
                <SelectItem value="promise_rejection">Promise Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="ignored">Ignorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(counts).length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(counts).map(([t, n]) => (
                <Badge key={t} variant={TYPE_LABEL[t]?.variant || "secondary"} className="text-[10px]">
                  {TYPE_LABEL[t]?.label || t}: {n}
                </Badge>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Mostrando os {logs.length} erros mais recentes
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhum erro registrado. 🎉
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-3">
            <div className="space-y-2">
              {logs.map((log) => {
                const isOpen = expanded === log.id;
                const tl = TYPE_LABEL[log.error_type] || { label: log.error_type, variant: "secondary" as const };
                
                const statusMeta: Record<string, { label: string; className: string }> = {
                  pending: { label: "Pendente", className: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
                  investigating: { label: "Investigando", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
                  resolved: { label: "Resolvido", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
                  ignored: { label: "Ignorado", className: "bg-slate-500/10 text-slate-700 border-slate-500/20" },
                };

                return (
                  <div
                    key={log.id}
                    className={`border border-border rounded-lg p-3 transition ${isOpen ? 'bg-muted/50' : 'bg-muted/10 hover:bg-muted/30'}`}
                  >
                    <div 
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => {
                        setExpanded(isOpen ? null : log.id);
                        if (log.status === "pending") {
                          updateStatus(log.id, "investigating");
                        }
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={tl.variant} className="text-[10px] h-5">
                            {tl.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] h-5 ${statusMeta[log.status]?.className || ""}`}>
                            {statusMeta[log.status]?.label || log.status}
                          </Badge>
                          {log.app_version && (
                            <Badge variant="outline" className="text-[10px] h-5 font-mono">
                              v: {log.app_version.substring(0, 15)}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm font-medium break-words">
                          {log.message || "(sem mensagem)"}
                        </p>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="text-[11px] font-mono space-y-1 bg-background p-3 rounded border">
                              <h4 className="text-xs font-bold mb-2 uppercase text-muted-foreground border-b pb-1">Detalhes Técnicos</h4>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ID:</span>
                                <span className="select-all">{log.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rota:</span>
                                <span>{log.route || "/"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Data:</span>
                                <span>{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Boot:</span>
                                <span>{log.boot_elapsed_ms ? `${log.boot_elapsed_ms}ms` : "N/A"}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t">
                                <span className="text-muted-foreground block mb-1">Navegador/UA:</span>
                                <span className="break-all text-[9px] leading-tight">{log.user_agent}</span>
                              </div>
                            </div>

                            {log.status === "resolved" && (
                              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <h4 className="text-xs font-bold text-emerald-700 uppercase">Resolução</h4>
                                </div>
                                <p className="text-xs mb-2"><strong>Versão da correção:</strong> {log.fixed_in_version || "Não informada"}</p>
                                <p className="text-xs italic">"{log.resolution_notes || "Sem notas registradas"}"</p>
                                <p className="text-[10px] text-muted-foreground mt-2">Resolvido em {log.resolved_at ? format(new Date(log.resolved_at), "dd/MM/yyyy HH:mm") : "N/A"}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="bg-background p-3 rounded border">
                              <h4 className="text-xs font-bold mb-3 uppercase text-muted-foreground border-b pb-1">Gerenciar Status</h4>
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <Button 
                                    size="sm" 
                                    variant={log.status === "investigating" ? "default" : "outline"}
                                    onClick={() => updateStatus(log.id, "investigating")}
                                    disabled={updatingId === log.id}
                                    className="h-7 text-[10px]"
                                  >
                                    Investigando
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={log.status === "ignored" ? "default" : "outline"}
                                    onClick={() => updateStatus(log.id, "ignored")}
                                    disabled={updatingId === log.id}
                                    className="h-7 text-[10px]"
                                  >
                                    Ignorar
                                  </Button>
                                </div>

                                {log.status !== "resolved" && (
                                  <div className="space-y-2 pt-2 border-t">
                                    <Input 
                                      placeholder="Versão da correção (ex: v2.6.1)" 
                                      className="h-8 text-[11px]"
                                      value={fixVersion}
                                      onChange={(e) => setFixVersion(e.target.value)}
                                    />
                                    <Textarea 
                                      placeholder="Notas de resolução (como foi corrigido?)" 
                                      className="text-[11px] min-h-[60px]"
                                      value={resolutionNote}
                                      onChange={(e) => setResolutionNote(e.target.value)}
                                    />
                                    <Button 
                                      size="sm" 
                                      className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => updateStatus(log.id, "resolved")}
                                      disabled={updatingId === log.id}
                                    >
                                      Marcar como Resolvido
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {(log.stack || log.component_stack) && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Pilha de Erros (Stack Trace)</h4>
                            <ScrollArea className="h-48 rounded border bg-slate-950 p-3">
                              <pre className="text-[10px] text-slate-300 font-mono leading-relaxed">
                                {log.stack || log.component_stack}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
