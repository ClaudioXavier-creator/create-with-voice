import { useState, useEffect } from "react";
import { ClipboardCheck, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const ELEMENTOS = [
  "Água de Abastecimento",
  "Saúde e Higiene Pessoal",
  "Limpeza e Higienização",
  "Manejo de Pragas",
  "Manutenção e Calibração",
  "Resíduos e Efluentes",
  "Rastreabilidade",
  "Procedimentos de Produção",
];

export default function Autocontrole() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchData = async () => {
    let q = supabase.from("pac_monitoramento").select("*").order("data", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setData(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [empresaAtiva]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.from("pac_monitoramento").insert({
        user_id: user?.id as any,
        empresa_id: empresaAtiva?.id as any,
        data: formData.get("data") as string,
        elemento_controle: formData.get("elemento_controle") as string,
        item_avaliado: formData.get("item_avaliado") as string,
        resultado: formData.get("resultado") as string,
        conformidade: formData.get("conformidade") === "on",
        acao_corretiva: formData.get("acao_corretiva") as string,
        monitor: formData.get("monitor") as string,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Monitoramento PAC registrado!"); setOpen(false); fetchData(); }
  };

  return (
    <>
      <PageHeader icon={ClipboardCheck} title="POP 10 - PAC - Programa de Autocontrole" description="Verificação geral dos POPs, auditoria interna e melhoria contínua do sistema — IN 04/2007" />
      <Card>
        <CardHeader className="flex flex-row justify-between">
            <CardTitle>Registros de PAC</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Registro</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Novo Registro de Autocontrole</DialogTitle></DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <Input type="date" name="data" defaultValue={new Date().toISOString().split("T")[0]} />
                        <Select name="elemento_controle" required>
                            <SelectTrigger><SelectValue placeholder="Elemento de Controle" /></SelectTrigger>
                            <SelectContent>{ELEMENTOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input name="item_avaliado" placeholder="Item Avaliado (ex: Caixa d'água)" required />
                        <Input name="resultado" placeholder="Resultado Encontrado" />
                        <div className="flex items-center space-x-2">
                            <Label>Conformidade</Label>
                            <Switch name="conformidade" defaultChecked />
                        </div>
                        <Textarea name="acao_corretiva" placeholder="Ação Corretiva" />
                        <Input name="monitor" placeholder="Monitor / Responsável" required />
                        <Button type="submit">Salvar</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            {loading ? <p>Carregando...</p> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Elemento</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Monitor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.data}</TableCell>
                                <TableCell>{item.elemento_controle}</TableCell>
                                <TableCell>{item.item_avaliado}</TableCell>
                                <TableCell>{item.conformidade ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}</TableCell>
                                <TableCell>{item.monitor}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </>
  );
}