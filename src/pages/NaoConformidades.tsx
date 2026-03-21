import { useState, useEffect } from "react";
import { AlertTriangle, Plus, Loader2, Bell, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SETORES = [
  "Recebimento", "Armazenamento", "Moagem", "Mistura",
  "Peletização", "Ensacamento", "Expedição", "Laboratório",
  "Área externa", "Manutenção"
];

const statusColors: Record<string, string> = {
  aberta: "bg-destructive text-destructive-foreground",
  em_andamento: "bg-yellow-500/20 text-yellow-700",
  fechada: "bg-primary text-primary-foreground",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  fechada: "Fechada",
};

interface NCRow {
  id: string;
  data: string;
  setor: string;
  descricao: string;
  causa: string | null;
  acao_corretiva: string | null;
  responsavel: string | null;
  prazo: string | null;
  status: string | null;
  created_at: string;
}

export default function NaoConformidades() {
  const { user } = useAuth();
  const [ncs, setNcs] = useState<NCRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("nao_conformidades")
      .select("*")
      .order("data", { ascending: false });
    if (data) setNcs(data as unknown as NCRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("nao_conformidades").insert({
      user_id: user.id,
      data: fd.get("data") as string,
      setor: fd.get("setor") as string,
      descricao: fd.get("descricao") as string,
      causa: fd.get("causa") as string,
      acao_corretiva: fd.get("acao") as string,
      responsavel: fd.get("responsavel") as string,
      prazo: fd.get("prazo") as string || null,
    });
    if (error) toast.error("Erro ao salvar");
    else { toast.success("NC registrada!"); setOpen(false); fetchData(); }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("nao_conformidades").update({ status: newStatus } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Status atualizado!"); fetchData(); }
  };

  const today = new Date().toISOString().split("T")[0];
  const vencidas = ncs.filter(nc => nc.prazo && nc.prazo < today && nc.status !== "fechada");
  const abertas = ncs.filter(nc => nc.status === "aberta");
  const emAndamento = ncs.filter(nc => nc.status === "em_andamento");
  const fechadas = ncs.filter(nc => nc.status === "fechada");

  return (
    <>
      <PageHeader icon={AlertTriangle} title="Não Conformidades" description="Registro e gestão de problemas e ações corretivas" />

      {/* Alertas de prazo vencido */}
      {vencidas.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-destructive animate-pulse" />
              <h3 className="font-display font-semibold text-sm text-destructive">
                ⚠️ {vencidas.length} NC(s) com prazo vencido!
              </h3>
            </div>
            <div className="space-y-2">
              {vencidas.map(nc => (
                <div key={nc.id} className="flex items-center justify-between p-2 rounded bg-background border border-destructive/20">
                  <div>
                    <span className="font-medium text-sm">{nc.descricao.slice(0, 60)}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{nc.setor}</span>
                      <span className="text-xs text-destructive font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Prazo: {nc.prazo}
                      </span>
                      <span className="text-xs text-muted-foreground">Resp: {nc.responsavel || "N/I"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleUpdateStatus(nc.id, "em_andamento")}>
                      Iniciar
                    </Button>
                    <Button size="sm" className="text-xs" onClick={() => handleUpdateStatus(nc.id, "fechada")}>
                      Fechar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{ncs.length}</p>
          <p className="text-xs text-muted-foreground">Total NCs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{abertas.length}</p>
          <p className="text-xs text-muted-foreground">Abertas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{emAndamento.length}</p>
          <p className="text-xs text-muted-foreground">Em Andamento</p>
        </CardContent></Card>
        <Card className={vencidas.length > 0 ? "border-destructive/50" : ""}><CardContent className="pt-4 text-center">
          <p className={`text-2xl font-bold font-display ${vencidas.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{vencidas.length}</p>
          <p className="text-xs text-muted-foreground">Prazo Vencido</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registros</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova NC</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Nova Não Conformidade</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Data</Label><Input name="data" type="date" required defaultValue={today} /></div>
                  <div className="space-y-1">
                    <Label>Setor</Label>
                    <Select name="setor" required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{SETORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Descrição</Label><Textarea name="descricao" required /></div>
                <div className="space-y-1"><Label>Causa Provável</Label><Input name="causa" required /></div>
                <div className="space-y-1"><Label>Ação Corretiva</Label><Textarea name="acao" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Responsável</Label><Input name="responsavel" required /></div>
                  <div className="space-y-1"><Label>Prazo</Label><Input name="prazo" type="date" required /></div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar NC
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="todas">
              <TabsList className="mb-4">
                <TabsTrigger value="todas">Todas ({ncs.length})</TabsTrigger>
                <TabsTrigger value="abertas">Abertas ({abertas.length})</TabsTrigger>
                <TabsTrigger value="andamento">Em andamento ({emAndamento.length})</TabsTrigger>
                <TabsTrigger value="fechadas">Fechadas ({fechadas.length})</TabsTrigger>
              </TabsList>
              {[
                { key: "todas", data: ncs },
                { key: "abertas", data: abertas },
                { key: "andamento", data: emAndamento },
                { key: "fechadas", data: fechadas },
              ].map(tab => (
                <TabsContent key={tab.key} value={tab.key}>
                  {tab.data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma NC encontrada</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Prazo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tab.data.map((nc) => {
                          const isVencida = nc.prazo && nc.prazo < today && nc.status !== "fechada";
                          return (
                            <TableRow key={nc.id} className={isVencida ? "bg-destructive/5" : ""}>
                              <TableCell className="whitespace-nowrap">{nc.data}</TableCell>
                              <TableCell>{nc.setor}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{nc.descricao}</TableCell>
                              <TableCell>{nc.responsavel || "—"}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <span className={isVencida ? "text-destructive font-semibold" : ""}>
                                  {nc.prazo || "—"}
                                </span>
                                {isVencida && <Badge variant="destructive" className="ml-1 text-[10px]">Vencida</Badge>}
                              </TableCell>
                              <TableCell><Badge className={statusColors[nc.status || "aberta"]}>{statusLabels[nc.status || "aberta"]}</Badge></TableCell>
                              <TableCell>
                                {nc.status !== "fechada" && (
                                  <Select onValueChange={(v) => handleUpdateStatus(nc.id, v)}>
                                    <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue placeholder="Ação" /></SelectTrigger>
                                    <SelectContent>
                                      {nc.status !== "em_andamento" && <SelectItem value="em_andamento">Iniciar</SelectItem>}
                                      <SelectItem value="fechada">Fechar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  );
}
