import { useEffect, useState } from "react";
import { History, Search, Filter, ArrowLeft, ArrowRight, User, Building, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";

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

export default function AuditLog() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [empresaAtiva]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (empresaAtiva) {
      query = query.eq("empresa_id", empresaAtiva.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.tabela.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.registro_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTable = tableFilter === "all" || log.tabela === tableFilter;

    return matchesSearch && matchesTable;
  });

  const getActionBadge = (acao: string) => {
    switch (acao) {
      case "INSERT": return <Badge className="bg-green-500">Inserção</Badge>;
      case "UPDATE": return <Badge className="bg-blue-500">Alteração</Badge>;
      case "DELETE": return <Badge variant="destructive">Exclusão</Badge>;
      default: return <Badge variant="outline">{acao}</Badge>;
    }
  };

  const uniqueTables = Array.from(new Set(logs.map(l => l.tabela)));

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={History} 
        title="Log de Atividades" 
        description="Rastreabilidade completa de todas as alterações realizadas no sistema para fins de auditoria e conformidade."
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por tabela, ação ou ID..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="all">Todas as Tabelas</option>
            {uniqueTables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <Database className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-muted/30 border-b border-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Registros Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum registro encontrado.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.acao)}
                        <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {log.tabela}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ID: {log.registro_id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <History className="w-3 h-3" />
                        {format(new Date(log.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>Usuário: {log.user_id || "Sistema"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building className="w-3 h-3" />
                          <span>Empresa: {log.empresa_id || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex justify-end items-end">
                        <Button variant="ghost" size="sm" className="text-[10px] h-7 gap-1" onClick={() => console.log(log.dados_novos)}>
                          Ver Detalhes JSON
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground italic text-right">
        * Os logs são gerados automaticamente para garantir a integridade e auditoria dos dados.
      </div>
    </div>
  );
}
