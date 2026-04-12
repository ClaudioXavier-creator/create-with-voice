import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, AlertTriangle, Clock, CheckCircle, Bell, CalendarDays } from "lucide-react";
import { differenceInDays, format, parseISO, addMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanItem {
  id: string;
  user_id: string;
  categoria: string;
  atividade: string;
  descricao: string;
  frequencia: string;
  quantidade_prevista: number;
  mes_inicio: number;
  proxima_execucao: string | null;
  ultima_execucao: string | null;
  responsavel: string;
  observacoes: string;
  status: string;
}

const CATEGORIAS = [
  { value: "fisico_quimica", label: "Análise Físico-Química (Kjeldahl/NIRs)" },
  { value: "homogeneidade", label: "Teste de Homogeneidade" },
  { value: "microbiologia", label: "Pesquisa Microbiológica" },
  { value: "antibioticos", label: "Pesquisa de Antibióticos" },
  { value: "treinamento_integracao", label: "Treinamento de Integração" },
  { value: "treinamento_rotina", label: "Treinamento de Rotina / POPs" },
  { value: "limpeza_caixa_dagua", label: "Limpeza de Caixa D'Água" },
  { value: "calibracao", label: "Calibração de Equipamentos" },
  { value: "controle_pragas", label: "Controle de Pragas" },
  { value: "auditoria_interna", label: "Auditoria Interna" },
  { value: "outro", label: "Outro" },
];

const FREQUENCIAS = [
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "sob_demanda", label: "Sob Demanda" },
];

const TEMPLATES: Omit<PlanItem, "id" | "user_id">[] = [
  { categoria: "fisico_quimica", atividade: "Análise Físico-Química – Kjeldahl/NIRs", descricao: "Análise de proteína bruta, umidade, cinzas, fibra, EE. Quantidade mensal definida pelo RT conforme porte da empresa.", frequencia: "mensal", quantidade_prevista: 2, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "homogeneidade", atividade: "Teste de Homogeneidade de Mistura", descricao: "Coleta em 10 pontos do misturador para CV% ≤ 10%.", frequencia: "semestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "microbiologia", atividade: "Pesquisa Microbiológica", descricao: "Salmonella spp., Enterobactérias, Bolores e Leveduras conforme IN 15/2009.", frequencia: "semestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "antibioticos", atividade: "Pesquisa de Antibióticos / Resíduos", descricao: "Monitoramento de resíduos de antibióticos em produtos acabados.", frequencia: "anual", quantidade_prevista: 1, mes_inicio: 6, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "treinamento_integracao", atividade: "Treinamento de Integração", descricao: "Treinamento inicial de novos colaboradores em BPF, higiene e segurança.", frequencia: "sob_demanda", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "Sempre que houver admissão", status: "ativo" },
  { categoria: "treinamento_rotina", atividade: "Treinamento de Rotina – Produção e POPs", descricao: "Reciclagem periódica em procedimentos de produção e POPs obrigatórios.", frequencia: "trimestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "limpeza_caixa_dagua", atividade: "Limpeza e Higienização de Caixa D'Água", descricao: "Limpeza, desinfecção e análise microbiológica da água.", frequencia: "semestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
];

function getStatusInfo(proximaExecucao: string | null): { label: string; variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ElementType } {
  if (!proximaExecucao) return { label: "Sem data", variant: "secondary", icon: Clock };
  const days = differenceInDays(parseISO(proximaExecucao), new Date());
  if (days < 0) return { label: `Vencida (${Math.abs(days)}d)`, variant: "destructive", icon: AlertTriangle };
  if (days <= 30) return { label: `Próxima (${days}d)`, variant: "default", icon: Bell };
  return { label: `Em dia (${days}d)`, variant: "outline", icon: CheckCircle };
}

function getCatLabel(val: string) {
  return CATEGORIAS.find(c => c.value === val)?.label || val;
}
function getFreqLabel(val: string) {
  return FREQUENCIAS.find(f => f.value === val)?.label || val;
}

export default function PlanejamentoAnual() {
  const { session } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");

  const [form, setForm] = useState({
    categoria: "fisico_quimica",
    atividade: "",
    descricao: "",
    frequencia: "mensal",
    quantidade_prevista: 1,
    proxima_execucao: "",
    responsavel: "",
    observacoes: "",
  });

  const fetchItems = async () => {
    if (!session?.user?.id) return;
    let q = supabase
      .from("planejamento_anual")
      .select("*")
      .eq("user_id", session.user.id)
      .order("proxima_execucao", { ascending: true, nullsFirst: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (!error && data) setItems(data as unknown as PlanItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [session, empresaAtiva]);

  const handleAdd = async () => {
    if (!session?.user?.id || !form.atividade) { toast.error("Preencha a atividade"); return; }
    const { error } = await supabase.from("planejamento_anual").insert({
      user_id: session.user.id,
      empresa_id: empresaAtiva?.id || null,
      categoria: form.categoria,
      atividade: form.atividade,
      descricao: form.descricao,
      frequencia: form.frequencia,
      quantidade_prevista: form.quantidade_prevista,
      proxima_execucao: form.proxima_execucao || null,
      responsavel: form.responsavel,
      observacoes: form.observacoes,
    } as any);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Atividade adicionada");
    setForm({ categoria: "fisico_quimica", atividade: "", descricao: "", frequencia: "mensal", quantidade_prevista: 1, proxima_execucao: "", responsavel: "", observacoes: "" });
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("planejamento_anual").delete().eq("id", id);
    toast.success("Removido");
    fetchItems();
  };

  const handleLoadTemplates = async () => {
    if (!session?.user?.id) return;
    const year = new Date().getFullYear();
    const inserts = TEMPLATES.map(t => {
      const freqMonths: Record<string, number> = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12, sob_demanda: 12 };
      const months = freqMonths[t.frequencia] || 12;
      const proxDate = new Date(year, t.mes_inicio - 1, 15);
      if (proxDate < new Date()) proxDate.setMonth(proxDate.getMonth() + months);
      return {
        ...t,
        user_id: session.user.id,
        empresa_id: empresaAtiva?.id || null,
        proxima_execucao: format(proxDate, "yyyy-MM-dd"),
      };
    });
    const { error } = await supabase.from("planejamento_anual").insert(inserts as any);
    if (error) { toast.error("Erro ao carregar modelos"); return; }
    toast.success("Modelos carregados com sucesso!");
    fetchItems();
  };

  const handleMarkDone = async (item: PlanItem) => {
    const freqMonths: Record<string, number> = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12, sob_demanda: 0 };
    const months = freqMonths[item.frequencia] || 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const nextDate = months > 0 ? format(addMonths(new Date(), months), "yyyy-MM-dd") : null;
    await supabase.from("planejamento_anual").update({
      ultima_execucao: today,
      proxima_execucao: nextDate,
    } as any).eq("id", item.id);
    toast.success("Execução registrada! Próxima data atualizada.");
    fetchItems();
  };

  const filtered = useMemo(() => {
    if (activeTab === "todos") return items;
    if (activeTab === "vencidas") return items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) < 0);
    if (activeTab === "proximas") return items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) >= 0 && differenceInDays(parseISO(i.proxima_execucao), new Date()) <= 30);
    return items.filter(i => i.categoria === activeTab);
  }, [items, activeTab]);

  const vencidasCount = items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) < 0).length;
  const proximasCount = items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) >= 0 && differenceInDays(parseISO(i.proxima_execucao), new Date()) <= 30).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Planejamento Anual de Atividades" description="Cronograma de análises, treinamentos e atividades obrigatórias com alertas de vencimento" />

      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={vencidasCount > 0 ? "border-destructive bg-destructive/5" : ""}>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className={`h-8 w-8 ${vencidasCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{vencidasCount}</p>
              <p className="text-sm text-muted-foreground">Atividades Vencidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className={proximasCount > 0 ? "border-yellow-500 bg-yellow-500/5" : ""}>
          <CardContent className="flex items-center gap-3 p-4">
            <Bell className={`h-8 w-8 ${proximasCount > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{proximasCount}</p>
              <p className="text-sm text-muted-foreground">Próximas (≤ 30 dias)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{items.length - vencidasCount - proximasCount}</p>
              <p className="text-sm text-muted-foreground">Em Dia</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Atividade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Adicionar Atividade ao Planejamento</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Atividade *</Label>
                <Input value={form.atividade} onChange={e => setForm({ ...form, atividade: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Frequência</Label>
                  <Select value={form.frequencia} onValueChange={v => setForm({ ...form, frequencia: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Qtd. Prevista</Label>
                  <Input type="number" min={1} value={form.quantidade_prevista} onChange={e => setForm({ ...form, quantidade_prevista: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Próxima Execução</Label>
                  <Input type="date" value={form.proxima_execucao} onChange={e => setForm({ ...form, proxima_execucao: e.target.value })} />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleAdd}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
        {items.length === 0 && (
          <Button variant="outline" onClick={handleLoadTemplates}>
            <CalendarDays className="h-4 w-4 mr-2" /> Carregar Modelo Padrão
          </Button>
        )}
      </div>

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todos">Todos ({items.length})</TabsTrigger>
          <TabsTrigger value="vencidas" className="text-destructive">
            Vencidas ({vencidasCount})
          </TabsTrigger>
          <TabsTrigger value="proximas">Próximas ({proximasCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <p className="p-6 text-center text-muted-foreground">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">Nenhuma atividade encontrada. Clique em "Carregar Modelo Padrão" para iniciar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Atividade</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Qtd.</TableHead>
                        <TableHead>Próxima Exec.</TableHead>
                        <TableHead>Última Exec.</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead className="w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(item => {
                        const st = getStatusInfo(item.proxima_execucao);
                        const Icon = st.icon;
                        return (
                          <TableRow key={item.id} className={st.variant === "destructive" ? "bg-destructive/5" : st.variant === "default" ? "bg-yellow-500/5" : ""}>
                            <TableCell>
                              <Badge variant={st.variant} className="gap-1">
                                <Icon className="h-3 w-3" /> {st.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{getCatLabel(item.categoria)}</TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate" title={item.atividade}>{item.atividade}</TableCell>
                            <TableCell>{getFreqLabel(item.frequencia)}</TableCell>
                            <TableCell className="text-center">{item.quantidade_prevista}</TableCell>
                            <TableCell>{item.proxima_execucao ? format(parseISO(item.proxima_execucao), "dd/MM/yyyy") : "—"}</TableCell>
                            <TableCell>{item.ultima_execucao ? format(parseISO(item.ultima_execucao), "dd/MM/yyyy") : "—"}</TableCell>
                            <TableCell>{item.responsavel || "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleMarkDone(item)} title="Registrar execução">
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} title="Remover">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
