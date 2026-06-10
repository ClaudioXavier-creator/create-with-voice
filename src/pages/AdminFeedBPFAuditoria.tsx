import { useState, useEffect } from "react";
import { 
  History, Users, Building2, Key, AlertTriangle, 
  Search, RefreshCw, Loader2, ShieldCheck, 
  FileText, Activity, Database, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface LicenseEntry {
  id: string;
  user_id: string;
  empresa_id: string | null;
  email: string;
  empresa_nome: string;
  produto?: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  liberado_admin: boolean;
  nivel?: string | null;
}

interface AuditEntry {
  id: string;
  acao: string;
  tabela: string;
  registro_id: string;
  dados_anteriores: any;
  dados_novos: any;
  created_at: string;
  user_id: string;
  empresa_id: string;
}

interface ErrorLog {
  id: string;
  user_id: string | null;
  error_type: string;
  message: string | null;
  stack: string | null;
  component_stack: string | null;
  route: string | null;
  user_agent: string | null;
  created_at: string;
  extra: any;
}

export default function AdminFeedBPFAuditoria() {
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. Licenças Feed_BPF (inclui usuários e empresas)
      const { data: licensesData, error: licError } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "list", produto: "feedbpf" }
      });
      if (licError) throw licError;
      const feedBpfLicenses = (licensesData || []) as LicenseEntry[];
      setLicenses(feedBpfLicenses);

      // IDs de usuários e empresas para filtrar logs
      const userIds = Array.from(new Set(feedBpfLicenses.map(l => l.user_id).filter(Boolean)));
      const empresaIds = Array.from(new Set(feedBpfLicenses.map(l => l.empresa_id).filter(Boolean)));

      // 2. Audit Logs (relacionados às empresas do Feed_BPF)
      let auditQuery = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (empresaIds.length > 0) {
        auditQuery = auditQuery.in("empresa_id", empresaIds);
      }
      const { data: auditsData } = await auditQuery;
      setAuditLogs((auditsData as AuditEntry[]) || []);

      // 3. App Errors (relacionados aos usuários do Feed_BPF ou rota /feedbpf)
      let errorQuery = (supabase.from("app_error_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      // Filtro dinâmico: se tiver usuários, busca por eles ou pela rota
      if (userIds.length > 0) {
        errorQuery = errorQuery.or(`user_id.in.(${userIds.join(",")}),route.ilike.%feedbpf%`);
      } else {
        errorQuery = errorQuery.ilike("route", "%feedbpf%");
      }

      const { data: errorsData } = await errorQuery;
      setErrorLogs((errorsData as ErrorLog[]) || []);

    } catch (err: any) {
      console.error("Erro na auditoria:", err);
      toast.error("Erro ao carregar dados de auditoria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredLicenses = licenses.filter(l => 
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: new Set(licenses.map(l => l.user_id)).size,
    totalCompanies: new Set(licenses.map(l => l.empresa_id).filter(Boolean)).size,
    activeLicenses: licenses.filter(l => l.status === "ativa").length,
    totalErrors: errorLogs.length
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Auditoria Feed_BPF</h1>
            <p className="text-sm text-muted-foreground">Status detalhado de registros, acessos e erros do programa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Dados
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
            <p className="text-[10px] text-muted-foreground">Contas únicas com acesso</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalCompanies}</div>
            <p className="text-[10px] text-muted-foreground">Unidades fabris cadastradas</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" /> Licenças Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeLicenses}</div>
            <p className="text-[10px] text-muted-foreground">Acessos vigentes no momento</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Alertas de Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalErrors}</div>
            <p className="text-[10px] text-muted-foreground">Últimas 100 ocorrências</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="users" className="rounded-lg gap-2">
            <Users className="h-4 w-4" /> <span className="hidden sm:inline">Usuários & Licenças</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="rounded-lg gap-2">
            <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="audits" className="rounded-lg gap-2">
            <Database className="h-4 w-4" /> <span className="hidden sm:inline">Logs de Auditoria</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="rounded-lg gap-2">
            <AlertTriangle className="h-4 w-4" /> <span className="hidden sm:inline">Erros do App</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Contas de Usuário Feed_BPF</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar por e-mail ou empresa..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredLicenses.map((lic) => (
                      <div key={lic.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{lic.email}</span>
                            <Badge variant={lic.status === "ativa" ? "default" : "destructive"} className="text-[10px] h-4">
                              {lic.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {lic.empresa_nome}</span>
                            <span className="flex items-center gap-1"><Key className="h-3 w-3" /> {lic.plano} ({lic.nivel || "entrada"})</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-right text-muted-foreground font-mono">
                          Expira em: {format(new Date(lic.data_expiracao), "dd/MM/yyyy")}
                        </div>
                      </div>
                    ))}
                    {filteredLicenses.length === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground italic">Nenhum usuário encontrado.</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unidades Fabris (Feed_BPF)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(new Map(licenses.map(l => [l.empresa_id, l])).values())
                    .filter(l => l.empresa_id)
                    .map((l) => (
                    <Card key={l.empresa_id} className="border-primary/5">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-bold text-sm leading-tight">{l.empresa_nome}</h3>
                            <div className="text-[10px] text-muted-foreground font-mono">ID: {l.empresa_id?.substring(0, 8)}...</div>
                            <div className="flex items-center gap-1 mt-2">
                              <Badge variant="outline" className="text-[9px]">Dono: {l.email.split('@')[0]}</Badge>
                            </div>
                          </div>
                          <Building2 className="h-5 w-5 text-primary/30" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audits">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Últimas 100 Alterações em Tabelas</CardTitle>
                <Activity className="h-5 w-5 text-primary/40" />
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-3 px-2 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.acao === "INSERT" ? "default" : log.acao === "UPDATE" ? "outline" : "destructive"} className="text-[9px] uppercase">
                              {log.acao}
                            </Badge>
                            <span className="font-mono text-[10px] font-bold text-primary">{log.tabela}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Registro: {log.registro_id} · Usuário: {log.user_id?.substring(0, 8)}...
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground italic">Nenhum log de auditoria recente para empresas do Feed_BPF.</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Falhas do App & Exceções</CardTitle>
                <AlertTriangle className="h-5 w-5 text-destructive/40" />
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {errorLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border border-destructive/10 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="destructive" className="text-[9px] uppercase">{log.error_type}</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {format(new Date(log.created_at), "HH:mm:ss · dd/MM")}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-destructive mb-1 line-clamp-2">{log.message}</p>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-2">
                          <span className="truncate max-w-[150px]">Rota: {log.route || "N/A"}</span>
                          <span>·</span>
                          <span>Usuário: {log.user_id?.substring(0, 8) || "Sessão anônima"}</span>
                        </div>
                        {log.extra && (
                          <div className="mt-2 p-1.5 bg-background/50 rounded text-[8px] font-mono overflow-hidden">
                            {JSON.stringify(log.extra).substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    ))}
                    {errorLogs.length === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground italic">Tudo limpo! Nenhum erro registrado para o Feed_BPF. 🎉</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 text-center">
        <p className="text-xs text-muted-foreground italic">
          Relatório de auditoria gerado em tempo real. Os dados de erros e auditoria são limitados aos últimos 100 registros.
        </p>
      </div>
    </div>
  );
}
