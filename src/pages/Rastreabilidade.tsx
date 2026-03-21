import { useState, useEffect } from "react";
import { Search, Plus, Loader2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RastreabilidadeRow {
  id: string;
  produto: string;
  lote_produto: string | null;
  materia_prima: string;
  lote_mp: string | null;
  fornecedor: string | null;
}

export default function Rastreabilidade() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RastreabilidadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);

  const [produto, setProduto] = useState("");
  const [loteProduto, setLoteProduto] = useState("");
  const [materiaPrima, setMateriaPrima] = useState("");
  const [loteMP, setLoteMP] = useState("");
  const [fornecedor, setFornecedor] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("rastreabilidade")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar dados");
    else setRegistros(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async () => {
    if (!produto || !materiaPrima || !user) return;
    setSaving(true);
    const { error } = await supabase.from("rastreabilidade").insert({
      user_id: user.id,
      produto,
      lote_produto: loteProduto,
      materia_prima: materiaPrima,
      lote_mp: loteMP,
      fornecedor,
    });
    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Registro de rastreabilidade salvo!");
      setOpen(false);
      setProduto(""); setLoteProduto(""); setMateriaPrima(""); setLoteMP(""); setFornecedor("");
      fetchData();
    }
    setSaving(false);
  };

  const filtered = registros.filter((d) =>
    [d.produto, d.lote_produto, d.materia_prima, d.lote_mp, d.fornecedor]
      .some((v) => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  const uniquePA = new Set(registros.map(r => r.lote_produto).filter(Boolean));

  return (
    <>
      <PageHeader icon={Search} title="Rastreabilidade" description="Rastreie do produto acabado (PA) até a matéria-prima e fornecedor" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{registros.length}</p>
          <p className="text-xs text-muted-foreground">Vínculos registrados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Package className="w-5 h-5 text-primary" /></div>
          <p className="text-2xl font-bold font-display text-primary">{uniquePA.size}</p>
          <p className="text-xs text-muted-foreground">Lotes PA rastreados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{new Set(registros.map(r => r.fornecedor).filter(Boolean)).size}</p>
          <p className="text-xs text-muted-foreground">Fornecedores</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-display">Rastreabilidade MP → PA</CardTitle>
            <Input placeholder="Buscar por produto, lote PA, matéria-prima, lote MP ou fornecedor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="mt-2" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Vínculo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Vincular MP ao Produto Acabado</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-2">Produto Acabado (PA)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome do Produto</Label>
                      <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovino Engorda" required />
                    </div>
                    <div>
                      <Label>Lote do PA</Label>
                      <Input value={loteProduto} onChange={e => setLoteProduto(e.target.value)} placeholder="Ex: RBE-0320-01" required />
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs font-semibold text-accent mb-2">Matéria-Prima (MP)</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Matéria-Prima</Label>
                      <Input value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} placeholder="Ex: Milho grão" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Lote MP</Label>
                        <Input value={loteMP} onChange={e => setLoteMP(e.target.value)} placeholder="Ex: MC-2026-041" />
                      </div>
                      <div>
                        <Label>Fornecedor</Label>
                        <Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: AgroCorp" />
                      </div>
                    </div>
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Vínculo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum registro de rastreabilidade encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto Acabado</TableHead>
                  <TableHead>Lote PA</TableHead>
                  <TableHead>Matéria-Prima</TableHead>
                  <TableHead>Lote MP</TableHead>
                  <TableHead>Fornecedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.produto}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{r.lote_produto || "—"}</Badge>
                    </TableCell>
                    <TableCell>{r.materia_prima}</TableCell>
                    <TableCell className="font-mono text-sm">{r.lote_mp || "—"}</TableCell>
                    <TableCell>{r.fornecedor || "—"}</TableCell>
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
