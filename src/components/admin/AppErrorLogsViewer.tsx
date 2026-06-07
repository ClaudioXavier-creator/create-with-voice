import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = (supabase.from("app_error_logs") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterType !== "all") {
      query = query.eq("error_type", filterType);
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

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
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Logs de Erro da Aplicação
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Tela branca, ChunkLoadError, falhas de boot e exceções não tratadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="boundary">React Boundary</SelectItem>
              <SelectItem value="chunk_error">Chunk Error</SelectItem>
              <SelectItem value="boot_failsafe">Boot Failsafe</SelectItem>
              <SelectItem value="unhandled_error">Unhandled</SelectItem>
              <SelectItem value="promise_rejection">Promise Reject</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
          <Button variant="outline" size="icon" onClick={clearOld} title="Limpar logs >30d">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(counts).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(counts).map(([t, n]) => (
              <Badge key={t} variant={TYPE_LABEL[t]?.variant || "secondary"}>
                {TYPE_LABEL[t]?.label || t}: {n}
              </Badge>
            ))}
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
                return (
                  <div
                    key={log.id}
                    className="border border-border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={tl.variant} className="text-[10px]">
                            {tl.label}
                          </Badge>
                          {log.route && (
                            <code className="text-[10px] px-1.5 py-0.5 bg-background rounded font-mono text-muted-foreground">
                              {log.route}
                            </code>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm font-medium break-words">
                          {log.message || "(sem mensagem)"}
                        </p>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 space-y-2 text-[11px] font-mono">
                        {log.boot_elapsed_ms !== null && (
                          <div>
                            <span className="text-muted-foreground">Tempo desde boot: </span>
                            <span>{log.boot_elapsed_ms}ms</span>
                          </div>
                        )}
                        {log.app_version && (
                          <div>
                            <span className="text-muted-foreground">Versão: </span>
                            <span>{log.app_version}</span>
                          </div>
                        )}
                        {log.user_agent && (
                          <div>
                            <span className="text-muted-foreground">UA: </span>
                            <span className="break-all">{log.user_agent}</span>
                          </div>
                        )}
                        {log.stack && (
                          <div>
                            <div className="text-muted-foreground mb-1">Stack:</div>
                            <pre className="bg-background p-2 rounded border text-[10px] overflow-x-auto whitespace-pre-wrap">
                              {log.stack}
                            </pre>
                          </div>
                        )}
                        {log.component_stack && (
                          <div>
                            <div className="text-muted-foreground mb-1">Component Stack:</div>
                            <pre className="bg-background p-2 rounded border text-[10px] overflow-x-auto whitespace-pre-wrap">
                              {log.component_stack}
                            </pre>
                          </div>
                        )}
                        {log.extra && (
                          <div>
                            <div className="text-muted-foreground mb-1">Extra:</div>
                            <pre className="bg-background p-2 rounded border text-[10px] overflow-x-auto">
                              {JSON.stringify(log.extra, null, 2)}
                            </pre>
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
