import { AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { useNaoConformidades, SETORES } from "@/store/feedbpf-store";
import { useState } from "react";

const statusColors: Record<string, string> = {
  aberta: "bg-destructive text-destructive-foreground",
  em_andamento: "bg-warning text-accent-foreground",
  fechada: "bg-primary text-primary-foreground",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  fechada: "Fechada",
};

export default function NaoConformidades() {
  const [ncs, setNcs] = useNaoConformidades();
  const [open, setOpen] = useState(false);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nc = {
      id: Date.now().toString(),
      data: fd.get("data") as string,
      setor: fd.get("setor") as string,
      descricao: fd.get("descricao") as string,
      causa: fd.get("causa") as string,
      acaoCorretiva: fd.get("acao") as string,
      responsavel: fd.get("responsavel") as string,
      prazo: fd.get("prazo") as string,
      status: "aberta" as const,
    };
    setNcs((prev) => [nc, ...prev]);
    setOpen(false);
  };

  return (
    <>
      <PageHeader icon={AlertTriangle} title="Não Conformidades" description="Registro e gestão de problemas e ações corretivas" />
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
                  <div className="space-y-1"><Label>Data</Label><Input name="data" type="date" required /></div>
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
                <Button type="submit" className="w-full">Registrar NC</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ncs.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell className="whitespace-nowrap">{nc.data}</TableCell>
                  <TableCell>{nc.setor}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{nc.descricao}</TableCell>
                  <TableCell>{nc.responsavel}</TableCell>
                  <TableCell className="whitespace-nowrap">{nc.prazo}</TableCell>
                  <TableCell><Badge className={statusColors[nc.status]}>{statusLabels[nc.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
