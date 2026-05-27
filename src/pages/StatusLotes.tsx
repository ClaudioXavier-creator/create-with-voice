import { useState, useEffect } from "react";
import { ListFilter, Loader2, Package, History, CheckCircle2, Lock, XCircle, ArrowDownAZ } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";

interface LoteStatus {
  id: string;
  data: string;
  materia_prima: string;
  lote: string | null;
  fornecedor: string | null;
  status: 'bloqueado' | 'liberado' | 'esgotado';
  saldo: number | null;
  quantidade: string | null;
  unidade: string | null;
}

export default function StatusLotes() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [lotes, setLotes] = useState<LoteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("recebimento_mp")
      .select("*")
      .order("materia_prima", { ascending: true })
      .order("data", { ascending: true });
    
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    
    const { data, error } = await q;
    if (!error && data) setLotes(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva]);

  const filtered = lotes.filter(l => {
    const matchesBusca = [l.materia_prima, l.lote, l.fornecedor].some(v => v?.toLowerCase().includes(busca.toLowerCase()));
    const matchesStatus = filtroStatus === "todos" || l.status === filtroStatus;
    return matchesBusca && matchesStatus;
  });

  // Group by MP to show FIFO queues
  const groupedMP = Array.from(new Set(lotes.map(l => l.materia_prima)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'liberado': return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Disponível</Badge>;
      case 'bloqueado': return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Lock className="w-3 h-3 mr-1" /> Bloqueado (FIFO)</Badge>;
      case 'esgotado': return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Encerrado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Package} 
        title="Status e Fila de Lotes" 
        description="Visualização em tempo real do estoque e ordem de consumo (FIFO)" 
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input 
            placeholder="Buscar por MP, Lote ou Fornecedor..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="liberado">Disponível</SelectItem>
            <SelectItem value="bloqueado">Bloqueado (FIFO)</SelectItem>
            <SelectItem value="esgotado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-primary" />
              Inventário de Lotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matéria-Prima</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.materia_prima}</TableCell>
                      <TableCell className="text-xs">{l.lote}</TableCell>
                      <TableCell>{getStatusBadge(l.status)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {l.saldo ?? l.quantidade} {l.unidade}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownAZ className="w-5 h-5 text-blue-500" />
              Próximos da Fila (FIFO)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedMP.map(mp => {
              const fila = lotes.filter(l => l.materia_prima === mp && l.status !== 'esgotado');
              if (fila.length === 0) return null;
              
              const ativo = fila.find(l => l.status === 'liberado');
              const proximos = fila.filter(l => l.status === 'bloqueado');

              return (
                <div key={mp} className="border-b pb-3 last:border-0">
                  <h4 className="font-semibold text-sm mb-2">{mp}</h4>
                  <div className="space-y-2">
                    {ativo ? (
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-100">
                        <span className="text-xs font-medium text-green-700">EM USO: {ativo.lote}</span>
                        <Badge className="bg-green-500 text-[10px] h-4">Ativo</Badge>
                      </div>
                    ) : (
                      <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Nenhum lote liberado
                      </div>
                    )}
                    {proximos.length > 0 && (
                      <div className="pl-4 border-l-2 border-dashed border-gray-200 space-y-1">
                        {proximos.map((p, idx) => (
                          <div key={p.id} className="text-[11px] text-muted-foreground flex justify-between">
                            <span>{idx + 1}º Fila: {p.lote}</span>
                            <span>{p.data}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";
