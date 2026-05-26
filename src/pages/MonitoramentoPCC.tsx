import { useState, useEffect } from "react";
import { Zap, Plus, Loader2, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
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

export default function MonitoramentoPCC() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchData = async () => {
    let q = supabase.from("monitoramento_pcc").select("*").order("data", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setData(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [empresaAtiva]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.from("monitoramento_pcc").insert({
        user_id: user?.id,
        empresa_id: empresaAtiva?.id,
        data: formData.get("data"),
        ponto_critico: formData.get("ponto_critico"),
        parametro: formData.get("parametro"),
        valor_encontrado: formData.get("valor_encontrado"),
        conformidade: formData.get("conformidade") === "on",
        acao_corretiva: formData.get("acao_corretiva"),
        responsavel: formData.get("responsavel"),
    });
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Monitoramento registrado!"); setOpen(false); fetchData(); }
  };

  return (
    <>
      <PageHeader icon={Zap} title="Monitoramento PCC" description="Monitoramento de Pontos Críticos de Controle (PCC)" />
      <Card>
        <CardHeader className="flex flex-row justify-between">
            <CardTitle>Registros de Monitoramento</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Registro</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Novo Registro de PCC</DialogTitle></DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <Input type="date" name="data" defaultValue={new Date().toISOString().split("T")[0]} />
                        <Input name="ponto_critico" placeholder="Ponto Crítico (ex: Moinho)" required />
                        <Input name="parametro" placeholder="Parâmetro (ex: Temperatura)" required />
                        <Input name="valor_encontrado" placeholder="Valor Encontrado" required />
                        <div className="flex items-center space-x-2">
                            <Label>Conformidade</Label>
                            <Switch name="conformidade" defaultChecked />
                        </div>
                        <Textarea name="acao_corretiva" placeholder="Ação Corretiva" />
                        <Input name="responsavel" placeholder="Responsável" required />
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
                            <TableHead>Ponto</TableHead>
                            <TableHead>Parâmetro</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.data}</TableCell>
                                <TableCell>{item.ponto_critico}</TableCell>
                                <TableCell>{item.parametro}</TableCell>
                                <TableCell>{item.valor_encontrado}</TableCell>
                                <TableCell>{item.conformidade ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}</TableCell>
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