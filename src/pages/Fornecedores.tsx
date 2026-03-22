import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Star, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FornecedorRow {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  contato: string | null;
  email: string | null;
  tipo_produto: string | null;
  status_qualificacao: string | null;
  nota_avaliacao: number | null;
  ultima_avaliacao: string | null;
  proxima_avaliacao: string | null;
  observacoes: string | null;
  created_at: string;
}

interface RecebimentoRow {
  id: string;
  data: string;
  fornecedor: string;
  materia_prima: string;
  lote: string | null;
  aprovado: boolean | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  aprovado: { label: "Aprovado", color: "bg-primary text-primary-foreground", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "bg-accent text-accent-foreground", icon: Clock },
  reprovado: { label: "Reprovado", color: "bg-destructive text-destructive-foreground", icon: AlertCircle },
  em_avaliacao: { label: "Em Avaliação", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
};

export default function Fornecedores() {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [avaliarOpen, setAvaliarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [contato, setContato] = useState("");
  const [email, setEmail] = useState("");
  const [tipoProduto, setTipoProduto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [registroSipeagro, setRegistroSipeagro] = useState("");
  const [sipeagroVerificado, setSipeagroVerificado] = useState(false);

  // Avaliação
  const [nota, setNota] = useState(0);
  const [statusQual, setStatusQual] = useState("aprovado");
  const [obsAval, setObsAval] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [fornRes, recRes] = await Promise.all([
      supabase.from("fornecedores").select("*").order("nome"),
      supabase.from("recebimento_mp").select("id, data, fornecedor, materia_prima, lote, aprovado").order("data", { ascending: false }).limit(100),
    ]);
    if (fornRes.data) setFornecedores(fornRes.data as unknown as FornecedorRow[]);
    if (recRes.data) setRecebimentos(recRes.data as unknown as RecebimentoRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const resetForm = () => {
    setNome(""); setCnpj(""); setEndereco(""); setContato(""); setEmail(""); setTipoProduto(""); setObservacoes(""); setRegistroSipeagro(""); setSipeagroVerificado(false);
  };

  const handleAdd = async () => {
    if (!nome || !user) return;
    setSaving(true);
    const { error } = await supabase.from("fornecedores").insert({
      user_id: user.id, nome, cnpj, endereco, contato, email, tipo_produto: tipoProduto, observacoes,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Fornecedor cadastrado!"); setOpen(false); resetForm(); fetchData(); }
    setSaving(false);
  };

  const handleAvaliar = async () => {
    if (!selectedId) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const proxima = new Date();
    proxima.setMonth(proxima.getMonth() + 6);
    const { error } = await supabase.from("fornecedores").update({
      nota_avaliacao: nota,
      status_qualificacao: statusQual,
      ultima_avaliacao: today,
      proxima_avaliacao: proxima.toISOString().split("T")[0],
      observacoes: obsAval,
    } as any).eq("id", selectedId);
    if (error) toast.error("Erro ao avaliar");
    else { toast.success("Avaliação registrada!"); setAvaliarOpen(false); setSelectedId(null); fetchData(); }
    setSaving(false);
  };

  const getRecebimentosFornecedor = (nomeForn: string) =>
    recebimentos.filter(r => r.fornecedor.toLowerCase() === nomeForn.toLowerCase());

  const getTaxaAprovacao = (nomeForn: string) => {
    const recs = getRecebimentosFornecedor(nomeForn);
    if (recs.length === 0) return null;
    return Math.round((recs.filter(r => r.aprovado).length / recs.length) * 100);
  };

  const aprovados = fornecedores.filter(f => f.status_qualificacao === "aprovado");
  const pendentes = fornecedores.filter(f => f.status_qualificacao === "pendente" || f.status_qualificacao === "em_avaliacao");
  const reprovados = fornecedores.filter(f => f.status_qualificacao === "reprovado");

  return (
    <>
      <PageHeader icon={Users} title="Qualificação de Fornecedores" description="Cadastro, avaliação e histórico integrado ao Recebimento de MP — POP-001" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{fornecedores.length}</p>
          <p className="text-xs text-muted-foreground">Fornecedores</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{aprovados.length}</p>
          <p className="text-xs text-muted-foreground">Aprovados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{pendentes.length}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{reprovados.length}</p>
          <p className="text-xs text-muted-foreground">Reprovados</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Fornecedores Cadastrados</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Fornecedor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Cadastrar Fornecedor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome / Razão Social *</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: AgroCorp Ltda" /></div>
                  <div><Label>CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
                </div>
                <div><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Cidade - UF" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Contato / Telefone</Label><Input value={contato} onChange={e => setContato(e.target.value)} /></div>
                  <div><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                </div>
                <div><Label>Tipo de Produto Fornecido</Label><Input value={tipoProduto} onChange={e => setTipoProduto(e.target.value)} placeholder="Ex: Milho, Farelo de soja, Premix" /></div>
                <div><Label>Observações</Label><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Certificações, laudos, etc." /></div>
                <Button onClick={handleAdd} className="w-full" disabled={saving || !nome}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Fornecedor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : fornecedores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Taxa Aprovação MP</TableHead>
                  <TableHead>Última Avaliação</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map(f => {
                  const taxa = getTaxaAprovacao(f.nome);
                  const st = STATUS_CONFIG[f.status_qualificacao || "pendente"] || STATUS_CONFIG.pendente;
                  const recs = getRecebimentosFornecedor(f.nome);
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{f.nome}</p>
                        {f.cnpj && <span className="text-xs text-muted-foreground">{f.cnpj}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{f.tipo_produto || "—"}</TableCell>
                      <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= (f.nota_avaliacao || 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {taxa !== null ? (
                          <div className="flex items-center gap-2">
                            <Progress value={taxa} className="w-16 h-2" />
                            <span className={`text-xs font-mono ${taxa >= 80 ? "text-primary" : taxa >= 50 ? "text-accent" : "text-destructive"}`}>{taxa}%</span>
                            <span className="text-xs text-muted-foreground">({recs.length})</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Sem recebimentos</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.ultima_avaliacao || "Nunca"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                          setSelectedId(f.id);
                          setNota(f.nota_avaliacao || 0);
                          setStatusQual(f.status_qualificacao || "pendente");
                          setObsAval(f.observacoes || "");
                          setAvaliarOpen(true);
                        }}>
                          <Star className="w-3 h-3 mr-1" /> Avaliar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Recebimentos por Fornecedor */}
      {fornecedores.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-sm">Histórico de Recebimento por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={fornecedores[0]?.nome}>
              <TabsList className="flex-wrap h-auto gap-1">
                {fornecedores.slice(0, 8).map(f => (
                  <TabsTrigger key={f.nome} value={f.nome} className="text-xs">{f.nome}</TabsTrigger>
                ))}
              </TabsList>
              {fornecedores.slice(0, 8).map(f => {
                const recs = getRecebimentosFornecedor(f.nome);
                return (
                  <TabsContent key={f.nome} value={f.nome}>
                    {recs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-sm">Nenhum recebimento registrado para este fornecedor</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Matéria-Prima</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Aprovado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recs.map(r => (
                            <TableRow key={r.id}>
                              <TableCell className="text-sm">{r.data}</TableCell>
                              <TableCell className="text-sm">{r.materia_prima}</TableCell>
                              <TableCell className="font-mono text-xs">{r.lote || "—"}</TableCell>
                              <TableCell>
                                {r.aprovado ? (
                                  <Badge className="bg-primary text-primary-foreground text-xs">Aprovado</Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">Reprovado</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Avaliação Dialog */}
      <Dialog open={avaliarOpen} onOpenChange={setAvaliarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-accent" /> Avaliar Fornecedor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nota (1 a 5)</Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setNota(i)} className="focus:outline-none">
                    <Star className={`w-7 h-7 transition-colors ${i <= nota ? "fill-accent text-accent" : "text-muted-foreground/30 hover:text-accent/50"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Status de Qualificação</Label>
              <Select value={statusQual} onValueChange={setStatusQual}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_avaliacao">Em Avaliação</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações da Avaliação</Label>
              <Textarea value={obsAval} onChange={e => setObsAval(e.target.value)} placeholder="Critérios avaliados, laudos verificados..." />
            </div>
            <Button onClick={handleAvaliar} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
