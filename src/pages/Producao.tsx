import { useState, useEffect } from "react";
import { Factory, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProdRow {
  id: string;
  data: string;
  produto: string;
  lote: string | null;
  operador: string | null;
  tempo_mistura: string | null;
  quantidade: string | null;
}

export default function Producao() {
  const { user } = useAuth();
  const [items, setItems] = useState<ProdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [produto, setProduto] = useState("");
  const [lote, setLote] = useState("");
  const [operador, setOperador] = useState("");
  const [tempoMistura, setTempoMistura] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("producao").select("*").order("data", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async () => {
    if (!produto || !user) return;
    setSaving(true);
    const { error } = await supabase.from("producao").insert({
      user_id: user.id,
      produto,
      lote,
      operador,
      tempo_mistura: tempoMistura,
      quantidade,
    });
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Registro salvo!");
      setOpen(false);
      setProduto(""); setLote(""); setOperador(""); setTempoMistura(""); setQuantidade("");
      fetchData();
    }
    setSaving(false);
  };

  return (
    <>
      <PageHeader icon={Factory} title="Controle de Produção" description="Registro de fabricação de rações e suplementos" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total registros</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{new Set(items.map(i => i.lote).filter(Boolean)).size}</p>
          <p className="text-xs text-muted-foreground">Lotes produzidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{new Set(items.map(i => i.produto)).size}</p>
          <p className="text-xs text-muted-foreground">Produtos</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registros de Produção</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Registro de Produção</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Produto</Label>
                  <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovinos 22%" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Lote</Label>
                    <Input value={lote} onChange={e => setLote(e.target.value)} placeholder="Ex: L2026-0321" />
                  </div>
                  <div>
                    <Label>Operador</Label>
                    <Input value={operador} onChange={e => setOperador(e.target.value)} placeholder="Nome" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tempo de Mistura</Label>
                    <Input value={tempoMistura} onChange={e => setTempoMistura(e.target.value)} placeholder="Ex: 5 min" />
                  </div>
                  <div>
                    <Label>Quantidade (kg)</Label>
                    <Input value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Ex: 2000" />
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={saving || !produto}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum registro. Use também o módulo PCP para ordens detalhadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tempo Mistura</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                    <TableCell>{p.produto}</TableCell>
                    <TableCell className="font-mono text-sm">{p.lote}</TableCell>
                    <TableCell>{p.operador}</TableCell>
                    <TableCell>{p.tempo_mistura}</TableCell>
                    <TableCell>{p.quantidade}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <strong>💡 Dica:</strong> Para registros detalhados com fórmulas, batidas (início/fim), lotes de MP e rastreabilidade, use o módulo <strong>PCP / Ordens de Produção</strong>.
          </div>
        </CardContent>
      </Card>
    </>
  );
}
