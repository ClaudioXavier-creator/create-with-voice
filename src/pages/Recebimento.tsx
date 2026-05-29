import { useState, useEffect } from "react";
import { Package, Plus, CheckCircle2, Loader2, Search, FileText, Download, Truck, AlertTriangle, ShieldAlert } from "lucide-react";
import FileUploadComponent from "@/components/FileUpload";
import { registrarAuditLog } from "@/utils/auditLog";
import { gerarHashIntegridade, adicionarRodapeIntegridade } from "@/utils/integridade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface RecebimentoRow {
  id: string;
  data: string;
  fornecedor: string;
  materia_prima: string;
  lote: string | null;
  odor: string | null;
  umidade: string | null;
  insetos: string | null;
  aprovado: boolean | null;
  certificado_analise_numero: string | null;
  certificado_analise_url: string | null;
  certificado_analise_valido: boolean | null;
  validade: string | null;
  quantidade: string | null;
  unidade: string | null;
  temperatura: string | null;
  observacoes: string | null;
  status: 'bloqueado' | 'liberado' | 'esgotado';
  saldo: number | null;
}

export default function Recebimento() {
  const { user, roles } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<RecebimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  const [fornecedor, setFornecedor] = useState("");
  const [materiaPrima, setMateriaPrima] = useState("");
  const [lote, setLote] = useState("");
  const [odor, setOdor] = useState("normal");
  const [umidade, setUmidade] = useState("");
  const [insetos, setInsetos] = useState("ausente");
  const [temperatura, setTemperatura] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [validade, setValidade] = useState("");
  const [aprovado, setAprovado] = useState(true);
  const [certNumero, setCertNumero] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [certValido, setCertValido] = useState<boolean | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const [liberarDialogOpen, setLiberarDialogOpen] = useState(false);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const isAdmin = roles.includes("admin");

  const fetchData = async () => {
    if (!user) return;
    let q = supabase
      .from("recebimento_mp")
      .select("*")
      .order("data", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (!error && data) setItems(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva]);

  const handleAdd = async () => {
    if (!fornecedor || !materiaPrima || !user) return;
    setSaving(true);
    
    const { data: newBatch, error } = await supabase.from("recebimento_mp").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      fornecedor, materia_prima: materiaPrima, lote: lote || null,
      quantidade: quantidade || null, unidade: unidade || null,
      aprovado,
      observacoes: observacoes || null,
      status: 'bloqueado'
    }).select().single();

    if (!error && !aprovado) {
      await supabase.from("nao_conformidades").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        data: new Date().toISOString().split("T")[0],
        setor: "Recebimento de MP",
        descricao: `NC no recebimento da MP ${materiaPrima} (Lote: ${lote || "—"}): ${observacoes}`,
        status: "pendente"
      } as any);
    }


    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      await registrarAuditLog({
        userId: user.id,
        empresaId: empresaAtiva?.id,
        tabela: "recebimento_mp",
        registroId: newBatch.id,
        acao: "criar",
        dadosNovos: newBatch
      });

      toast.success("Recebimento registrado!");
      setOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleLiberarLote = async () => {
    if (!selectedLoteId || !user) return;
    if (!isAdmin) {
      toast.error("Apenas administradores podem liberar lotes manualmente.");
      return;
    }
    if (!justificativa.trim()) {
      toast.error("Informe uma justificativa para a liberação.");
      return;
    }

    setSaving(true);
    const item = items.find(i => i.id === selectedLoteId);
    
    const { error } = await supabase.from("recebimento_mp").update({ 
      status: 'liberado',
      observacoes: (item?.observacoes || "") + "\n\n[Liberação Manual] Justificativa: " + justificativa
    }).eq("id", selectedLoteId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      await registrarAuditLog({
        userId: user.id,
        empresaId: empresaAtiva?.id,
        tabela: "recebimento_mp",
        registroId: selectedLoteId,
        acao: "editar",
        dadosAnteriores: item,
        dadosNovos: { status: 'liberado', justificativa_liberacao: justificativa }
      });

      toast.success("Lote liberado e registrado na auditoria!");
      setLiberarDialogOpen(false);
      setJustificativa("");
      setSelectedLoteId(null);
      fetchData();
    }
    setSaving(false);
  };

  const filtered = items.filter(r =>
    [r.fornecedor, r.materia_prima, r.lote].some(v => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <PageHeader icon={Package} title="Recebimento de Matérias-Primas" description="Controle de qualidade e FIFO" />
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2" /> Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Receber MP</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Fornecedor" value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
              <Input placeholder="Matéria-Prima" value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} />
              <Input placeholder="Lote" value={lote} onChange={e => setLote(e.target.value)} />
              <Input placeholder="Qtd" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
              <Button onClick={handleAdd} disabled={saving} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>MP</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status (FIFO)</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(item => (
            <TableRow key={item.id} className={item.status === 'liberado' ? "bg-primary/5" : ""}>
              <TableCell>{item.data}</TableCell>
              <TableCell>{item.materia_prima}</TableCell>
              <TableCell>{item.lote}</TableCell>
              <TableCell className="font-bold">{item.saldo || 0} {item.unidade}</TableCell>
              <TableCell>
                <Badge className={item.status === 'liberado' ? "bg-green-500" : "bg-yellow-500"}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {item.status === 'bloqueado' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedLoteId(item.id);
                      setLiberarDialogOpen(true);
                    }}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Apenas administradores podem liberar lotes" : ""}
                  >
                    <ShieldAlert className="w-4 h-4 mr-1 text-red-500" />
                    Liberar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={liberarDialogOpen} onOpenChange={setLiberarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberação Manual de Lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    A liberação manual exige uma justificativa clara que será registrada para fins de auditoria.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Justificativa da Liberação (Ex: Correção de estoque, ajuste de FIFO)</Label>
              <Textarea 
                placeholder="Descreva o motivo da liberação manual..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLiberarDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleLiberarLote} 
                disabled={saving || !justificativa.trim()}
                variant="destructive"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Liberação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}