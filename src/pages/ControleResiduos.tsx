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
import { Plus, Trash2, Recycle } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const TIPOS_RESIDUO = ["Orgânico", "Pó/Varredura", "Embalagens plásticas", "Embalagens papel/papelão", "Efluente líquido", "Óleo lubrificante", "Resíduo químico", "Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção", "Outro"];
const CLASSIFICACOES = [
  { value: "classe_I", label: "Classe I — Perigoso" },
  { value: "classe_II_A", label: "Classe II-A — Não Inerte" },
  { value: "classe_II_B", label: "Classe II-B — Inerte" },
];
const MOTIVOS_DESCARTE = [
  { value: "vencido", label: "Produto Vencido" },
  { value: "rejeitado_recebimento", label: "Rejeitado no Recebimento" },
  { value: "reprovado_analise", label: "Reprovado em Análise" },
  { value: "contaminado", label: "Contaminação / Avaria" },
  { value: "sobra_producao", label: "Sobra de Produção (s/ aproveitamento)" },
  { value: "recall", label: "Recolhimento / Recall" },
  { value: "outro", label: "Outro" },
];

export default function ControleResiduos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    tipo_residuo: "", classificacao: "classe_II_A", origem: "", destino_final: "",
    empresa_coletora: "", licenca_ambiental: "", frequencia_coleta: "semanal",
    quantidade: "", unidade: "kg", data_coleta: new Date().toISOString().split("T")[0],
    responsavel: "", manifesto_numero: "", observacoes: ""
  });

  const { data: residuos = [] } = useQuery({
    queryKey: ["controle_residuos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("controle_residuos").select("*").order("data_coleta", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("controle_residuos").insert({ ...form, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_residuos"] });
      toast.success("Registro de resíduo salvo");
      setOpen(false);
      setForm({ tipo_residuo: "", classificacao: "classe_II_A", origem: "", destino_final: "", empresa_coletora: "", licenca_ambiental: "", frequencia_coleta: "semanal", quantidade: "", unidade: "kg", data_coleta: new Date().toISOString().split("T")[0], responsavel: "", manifesto_numero: "", observacoes: "" });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("controle_residuos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["controle_residuos"] }); toast.success("Removido"); },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="POP 04 — Controle de Resíduos e Efluentes" description="Gestão ambiental conforme Decreto 12.031/2024" />

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Registro</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Resíduo / Efluente</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Tipo de Resíduo *</Label>
                <Select value={form.tipo_residuo} onValueChange={v => setForm(p => ({ ...p, tipo_residuo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{TIPOS_RESIDUO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classificação ABNT</Label>
                <Select value={form.classificacao} onValueChange={v => setForm(p => ({ ...p, classificacao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASSIFICACOES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Origem / Setor</Label><Input value={form.origem} onChange={e => setForm(p => ({ ...p, origem: e.target.value }))} /></div>
                <div><Label>Destino Final</Label><Input value={form.destino_final} onChange={e => setForm(p => ({ ...p, destino_final: e.target.value }))} placeholder="Aterro, reciclagem..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Empresa Coletora</Label><Input value={form.empresa_coletora} onChange={e => setForm(p => ({ ...p, empresa_coletora: e.target.value }))} /></div>
                <div><Label>Licença Ambiental</Label><Input value={form.licenca_ambiental} onChange={e => setForm(p => ({ ...p, licenca_ambiental: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quantidade</Label><Input value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))} /></div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={form.unidade} onValueChange={v => setForm(p => ({ ...p, unidade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="litros">Litros</SelectItem><SelectItem value="ton">Toneladas</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Data Coleta</Label><Input type="date" value={form.data_coleta} onChange={e => setForm(p => ({ ...p, data_coleta: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                <div><Label>Nº Manifesto</Label><Input value={form.manifesto_numero} onChange={e => setForm(p => ({ ...p, manifesto_numero: e.target.value }))} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
              <Button onClick={() => add.mutate()} disabled={!form.tipo_residuo}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {residuos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Recycle className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum registro de resíduo</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Empresa Coletora</TableHead>
                <TableHead>Manifesto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residuos.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.data_coleta}</TableCell>
                  <TableCell className="font-medium">{r.tipo_residuo}</TableCell>
                  <TableCell><Badge variant={r.classificacao === "classe_I" ? "destructive" : "outline"}>{CLASSIFICACOES.find(c => c.value === r.classificacao)?.label || r.classificacao}</Badge></TableCell>
                  <TableCell>{r.quantidade} {r.unidade}</TableCell>
                  <TableCell>{r.destino_final}</TableCell>
                  <TableCell>{r.empresa_coletora}</TableCell>
                  <TableCell>{r.manifesto_numero}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
