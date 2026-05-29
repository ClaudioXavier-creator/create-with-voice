import { useState, useEffect } from "react";
import { Zap, Plus, Loader2, ClipboardList, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

export default function MonitoramentoPCC() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const fetchData = async () => {
    let q = supabase.from("monitoramento_pcc").select("*").order("data", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setData(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [empresaAtiva]);

  const handleVerificar = async (id: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('nome').eq('user_id', user.id).single();
    const verificador = profile?.nome || user.email;
    
    const { error } = await (supabase.from("monitoramento_pcc" as any) as any).update({
      verificado_por: verificador,
      data_verificacao: new Date().toISOString(),
      status_verificacao: 'aprovado'
    }).eq('id', id);

    if (error) toast.error("Erro ao verificar");
    else {
      toast.success("Registro verificado com sucesso!");
      fetchData();
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const conformidade = formData.get("conformidade") === "on";
    const acaoCorretiva = formData.get("acao_corretiva") as string;
    
    if (!conformidade && !acaoCorretiva) {
      toast.error("Ação corretiva é obrigatória para itens não conformes!");
      return;
    }

    const { data: record, error } = await supabase.from("monitoramento_pcc").insert({
        user_id: user?.id,
        empresa_id: empresaAtiva?.id,
        data: formData.get("data"),
        ponto_critico: formData.get("ponto_critico"),
        parametro: formData.get("parametro"),
        valor_encontrado: formData.get("valor_encontrado"),
        conformidade: conformidade,
        acao_corretiva: acaoCorretiva,
        responsavel: formData.get("responsavel"),
    } as any).select().single();

    if (error) toast.error("Erro ao salvar");
    else { 
      toast.success("Monitoramento registrado!"); 
      
      // Automatic NC Flow
      if (!conformidade) {
        await supabase.from("nao_conformidades").insert({
          user_id: user?.id,
          empresa_id: empresaAtiva?.id || null,
          data: formData.get("data"),
          setor: "PCC / Contaminação Cruzada",
          descricao: `NC no monitoramento de PCC (${formData.get("ponto_critico")}): ${acaoCorretiva}`,
          status: "pendente"
        } as any);
      }
      
      setOpen(false); 
      fetchData(); 
    }
  };

  return (
    <>
      <PageHeader icon={Zap} title="POP 05 - Controle da Produção e Prevenção da Contaminação Cruzada" description="Monitoramento de Pontos Críticos de Controle (PCC) e prevenção de contaminação cruzada — IN 04/2007" />
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
                            <TableHead>Verificação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.data}</TableCell>
                                <TableCell>{item.ponto_critico}</TableCell>
                                <TableCell>{item.parametro}</TableCell>
                                <TableCell>{item.valor_encontrado}</TableCell>
                                <TableCell>
                                  {item.conformidade ? 
                                    <Badge className="bg-green-100 text-green-700 border-green-200">Conforme</Badge> : 
                                    <Badge variant="destructive">NC</Badge>
                                  }
                                </TableCell>
                                <TableCell>
                                  {item.status_verificacao === 'aprovado' ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                                      <CheckCircle2 className="w-3 h-3" /> {item.verificado_por}
                                    </Badge>
                                  ) : (
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => handleVerificar(item.id)}>
                                      <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                                    </Button>
                                  )}
                                </TableCell>
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