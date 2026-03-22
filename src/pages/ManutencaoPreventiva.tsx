import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wrench, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const TIPOS = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "preditiva", label: "Preditiva" },
];
const STATUS_LIST = [
  { value: "programada", label: "Programada" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
];

export default function ManutencaoPreventiva() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filtroEquip, setFiltroEquip] = useState("");

  const [form, setForm] = useState({
    equipamento: "", codigo_equipamento: "", tipo: "preventiva", descricao: "",
    responsavel: "", data_programada: new Date().toISOString().split("T")[0],
    data_execucao: "", proxima_manutencao: "", custo: "", pecas_trocadas: "",
    observacoes: "", status: "programada"
  });

  const { data: manutencoes = [] } = useQuery({
    queryKey: ["manutencoes", filtroEquip],
    queryFn: async () => {
      let q = supabase.from("manutencoes").select("*").order("data_programada", { ascending: false });
      if (filtroEquip) q = q.ilike("equipamento", `%${filtroEquip}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const addManutencao = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, user_id: user!.id };
      if (!payload.data_execucao) delete payload.data_execucao;
      if (!payload.proxima_manutencao) delete payload.proxima_manutencao;
      const { error } = await supabase.from("manutencoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes"] });
      toast.success("Manutenção registrada");
      setOpen(false);
      setForm({ equipamento: "", codigo_equipamento: "", tipo: "preventiva", descricao: "", responsavel: "", data_programada: new Date().toISOString().split("T")[0], data_execucao: "", proxima_manutencao: "", custo: "", pecas_trocadas: "", observacoes: "", status: "programada" });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteManut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manutencoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manutencoes"] }); toast.success("Removido"); },
  });

  const statusColor = (s: string) => {
    if (s === "concluida") return "default";
    if (s === "atrasada") return "destructive";
    return "outline";
  };

  // Stats from calibracoes table
  const { data: calibracoes = [] } = useQuery({
    queryKey: ["calibracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("calibracoes").select("*").order("proxima_calibracao");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="POP 05 — Manutenção Preventiva" description="Histórico de manutenções vinculado a equipamentos — IN 04/2007" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-primary">{manutencoes.length}</p><p className="text-sm text-muted-foreground">Total Manutenções</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-yellow-600">{manutencoes.filter((m: any) => m.status === "programada").length}</p><p className="text-sm text-muted-foreground">Programadas</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{calibracoes.length}</p><p className="text-sm text-muted-foreground">Equipamentos Calibrados</p></CardContent></Card>
      </div>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Input placeholder="Filtrar por equipamento..." value={filtroEquip} onChange={e => setFiltroEquip(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Manutenção</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Equipamento *</Label><Input value={form.equipamento} onChange={e => setForm(p => ({ ...p, equipamento: e.target.value }))} placeholder="Ex: Misturador 01" /></div>
                <div><Label>Código</Label><Input value={form.codigo_equipamento} onChange={e => setForm(p => ({ ...p, codigo_equipamento: e.target.value }))} placeholder="MX-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_LIST.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrição *</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o serviço" /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Data Programada</Label><Input type="date" value={form.data_programada} onChange={e => setForm(p => ({ ...p, data_programada: e.target.value }))} /></div>
                <div><Label>Data Execução</Label><Input type="date" value={form.data_execucao} onChange={e => setForm(p => ({ ...p, data_execucao: e.target.value }))} /></div>
                <div><Label>Próxima</Label><Input type="date" value={form.proxima_manutencao} onChange={e => setForm(p => ({ ...p, proxima_manutencao: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Custo (R$)</Label><Input value={form.custo} onChange={e => setForm(p => ({ ...p, custo: e.target.value }))} /></div>
                <div><Label>Peças Trocadas</Label><Input value={form.pecas_trocadas} onChange={e => setForm(p => ({ ...p, pecas_trocadas: e.target.value }))} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
              <Button onClick={() => addManutencao.mutate()} disabled={!form.equipamento || !form.descricao}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {manutencoes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhuma manutenção registrada</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Prog.</TableHead>
                <TableHead>Data Exec.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manutencoes.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.equipamento}</TableCell>
                  <TableCell>{m.codigo_equipamento}</TableCell>
                  <TableCell className="capitalize">{m.tipo}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{m.descricao}</TableCell>
                  <TableCell>{m.data_programada}</TableCell>
                  <TableCell>{m.data_execucao || "—"}</TableCell>
                  <TableCell><Badge variant={statusColor(m.status)}>{STATUS_LIST.find(s => s.value === m.status)?.label || m.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteManut.mutate(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
