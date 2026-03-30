import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wrench, Trash2, AlertTriangle, Scale, Cog, Calendar } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EQUIPAMENTOS_CRITICOS = [
  { nome: "Moinho de Martelos", codigo: "MM", pecas: ["Martelos", "Peneiras", "Rolamentos", "Correias"] },
  { nome: "Misturador Horizontal", codigo: "MH", pecas: ["Pás/Ribbons", "Rolamentos", "Retentores", "Correias", "Porta de descarga"] },
  { nome: "Misturador Vertical", codigo: "MV", pecas: ["Rosca helicoidal", "Rolamentos", "Retentores"] },
  { nome: "Peletizadora", codigo: "PL", pecas: ["Matriz", "Rolos", "Rolamentos", "Facas de corte", "Correias"] },
  { nome: "Extrusora", codigo: "EX", pecas: ["Rosca", "Camisas", "Matriz", "Facas", "Rolamentos"] },
  { nome: "Ensacadeira", codigo: "EN", pecas: ["Bicos dosadores", "Esteira", "Seladora", "Correias"] },
  { nome: "Transportador Helicoidal", codigo: "TH", pecas: ["Helicoide", "Rolamentos", "Mancais"] },
  { nome: "Elevador de Canecas", codigo: "EC", pecas: ["Canecas", "Correia/Corrente", "Rolamentos", "Tambor"] },
  { nome: "Dosador/Balança", codigo: "DB", pecas: ["Célula de carga", "Comportas", "Atuadores"] },
  { nome: "Secador/Resfriador", codigo: "SR", pecas: ["Telas", "Ventiladores", "Rolamentos", "Correias"] },
];

const TIPOS = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "preditiva", label: "Preditiva" },
];
const STATUS_LIST = [
  { value: "programada", label: "Programada" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
];

export default function ManutencaoPreventiva() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [openCalib, setOpenCalib] = useState(false);
  const [filtroEquip, setFiltroEquip] = useState("");

  const [form, setForm] = useState({
    equipamento: "", codigo_equipamento: "", tipo: "preventiva", descricao: "",
    responsavel: "", data_programada: new Date().toISOString().split("T")[0],
    data_execucao: "", proxima_manutencao: "", custo: "", pecas_trocadas: "",
    observacoes: "", status: "programada"
  });

  const [trocaForm, setTrocaForm] = useState({
    equipamento: "", codigo_equipamento: "", tipo: "preventiva" as string,
    descricao: "", responsavel: "", pecas_trocadas: "",
    data_programada: new Date().toISOString().split("T")[0],
    data_execucao: "", proxima_manutencao: "", custo: "",
    observacoes: "", status: "programada"
  });
  const [openTroca, setOpenTroca] = useState(false);
  const [equipSelecionado, setEquipSelecionado] = useState("");

  const [calibForm, setCalibForm] = useState({
    equipamento: "", codigo: "", tipo: "balanca", localizacao: "", responsavel: "",
    data_calibracao: new Date().toISOString().split("T")[0], proxima_calibracao: "",
    certificado_numero: "", observacoes: "", status: "calibrado",
    proxima_verificacao_intermediaria: "", verificacao_conforme: true, resultado_verificacao: "",
  });

  const { data: manutencoes = [] } = useQuery({
    queryKey: ["manutencoes", filtroEquip],
    queryFn: async () => {
      let q = supabase.from("manutencoes").select("*").order("data_programada", { ascending: false });
      if (filtroEquip) q = q.ilike("equipamento", `%${filtroEquip}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const addManutencao = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, user_id: user!.id };
      if (!payload.data_execucao) delete payload.data_execucao;
      if (!payload.proxima_manutencao) delete payload.proxima_manutencao;
      const { error } = await supabase.from("manutencoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes"] });
      toast.success("Manutenção registrada");
      setOpen(false);
      setForm({ equipamento: "", codigo_equipamento: "", tipo: "preventiva", descricao: "", responsavel: "", data_programada: new Date().toISOString().split("T")[0], data_execucao: "", proxima_manutencao: "", custo: "", pecas_trocadas: "", observacoes: "", status: "programada" });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteManut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manutencoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manutencoes"] }); toast.success("Removido"); },
  });

  const addTrocaPecas = useMutation({
    mutationFn: async () => {
      const payload: any = { ...trocaForm, user_id: user!.id };
      if (!payload.data_execucao) delete payload.data_execucao;
      if (!payload.proxima_manutencao) delete payload.proxima_manutencao;
      payload.descricao = `[TROCA DE PEÇAS] ${payload.descricao}`;
      const { error } = await supabase.from("manutencoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes"] });
      toast.success("Troca de peças registrada");
      setOpenTroca(false);
      setTrocaForm({ equipamento: "", codigo_equipamento: "", tipo: "preventiva", descricao: "", responsavel: "", pecas_trocadas: "", data_programada: new Date().toISOString().split("T")[0], data_execucao: "", proxima_manutencao: "", custo: "", observacoes: "", status: "programada" });
      setEquipSelecionado("");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const trocasPecas = manutencoes.filter((m: any) => m.pecas_trocadas && m.pecas_trocadas.trim() !== "");

  const statusVariant = (s: string) => {
    if (s === "concluida") return "default";
    if (s === "atrasada") return "destructive";
    return "outline";
  };

  const addCalibracao = useMutation({
    mutationFn: async () => {
      const payload: any = { ...calibForm, user_id: user!.id };
      if (!payload.proxima_calibracao) delete payload.proxima_calibracao;
      if (!payload.proxima_verificacao_intermediaria) delete payload.proxima_verificacao_intermediaria;
      if (!payload.resultado_verificacao) delete payload.resultado_verificacao;
      const { error } = await supabase.from("calibracoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calibracoes"] });
      toast.success("Calibração registrada");
      setOpenCalib(false);
      setCalibForm({ equipamento: "", codigo: "", tipo: "balanca", localizacao: "", responsavel: "", data_calibracao: new Date().toISOString().split("T")[0], proxima_calibracao: "", certificado_numero: "", observacoes: "", status: "calibrado", proxima_verificacao_intermediaria: "", verificacao_conforme: true, resultado_verificacao: "" });
    },
    onError: () => toast.error("Erro ao salvar calibração"),
  });

  const deleteCalib = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calibracoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calibracoes"] }); toast.success("Calibração removida"); },
  });

  // Stats from calibracoes table
  const { data: calibracoes = [] } = useQuery({
    queryKey: ["calibracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("calibracoes").select("*").order("proxima_calibracao");
      if (error) throw error;
      return data;
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const calibracoesComAlerta = calibracoes.filter((c: any) => {
    if (!c.proxima_verificacao_intermediaria) {
      // If no intermediate verification set, check if midpoint between calibrations has passed
      if (c.data_calibracao && c.proxima_calibracao) {
        const start = new Date(c.data_calibracao).getTime();
        const end = new Date(c.proxima_calibracao).getTime();
        const mid = new Date((start + end) / 2).toISOString().split("T")[0];
        return mid <= today;
      }
      return false;
    }
    return c.proxima_verificacao_intermediaria <= today;
  });

  const calibracoesVencidas = calibracoes.filter((c: any) => c.proxima_calibracao && c.proxima_calibracao <= today);

  return (
    <div className="space-y-6">
      <PageHeader title="POP 06 — Manutenção Preventiva e Calibração" description="Plano de manutenção de máquinas conforme IN 15/2009 — Calibração e verificação intermediária — IN 04/2007" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-primary">{manutencoes.length}</p><p className="text-sm text-muted-foreground">Total Manutenções</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-accent-foreground">{trocasPecas.length}</p><p className="text-sm text-muted-foreground">Trocas de Peças</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-muted-foreground">{manutencoes.filter((m: any) => m.status === "programada").length}</p><p className="text-sm text-muted-foreground">Programadas</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-primary">{calibracoes.length}</p><p className="text-sm text-muted-foreground">Equipamentos Calibrados</p></CardContent></Card>
      </div>

      {/* Alertas de Verificação Intermediária */}
      {calibracoesComAlerta.length > 0 && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-sm text-yellow-700 dark:text-yellow-400">Verificação Intermediária Pendente — IN 04/2007</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Balanças e instrumentos de medição requerem verificação intermediária entre calibrações anuais para manter a conformidade.</p>
            <div className="space-y-2">
              {calibracoesComAlerta.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-background border">
                  <div>
                    <span className="font-medium text-sm">{c.equipamento}</span>
                    <span className="text-xs text-muted-foreground ml-2">Código: {c.codigo || "—"}</span>
                  </div>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Verificação Pendente</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {calibracoesVencidas.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-sm text-destructive">Calibrações Vencidas</h3>
            </div>
            <div className="space-y-2">
              {calibracoesVencidas.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-background border">
                  <div>
                    <span className="font-medium text-sm">{c.equipamento}</span>
                    <span className="text-xs text-muted-foreground ml-2">Venceu: {c.proxima_calibracao}</span>
                  </div>
                  <Badge variant="destructive">Vencida</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="manutencoes">
        <TabsList>
          <TabsTrigger value="manutencoes">Manutenções ({manutencoes.length})</TabsTrigger>
          <TabsTrigger value="trocas">Troca de Peças ({trocasPecas.length})</TabsTrigger>
          <TabsTrigger value="calibracoes">Calibrações ({calibracoes.length})</TabsTrigger>
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
        </TabsList>

        <TabsContent value="manutencoes" className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Input placeholder="Filtrar por equipamento..." value={filtroEquip} onChange={e => setFiltroEquip(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Manutenção</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Equipamento *</Label><Input value={form.equipamento} onChange={e => setForm(p => ({ ...p, equipamento: e.target.value }))} placeholder="Ex: Misturador 01" />
                  <p className="text-[10px] text-muted-foreground mt-1">Inclua moinhos, misturadores, peletizadoras, silos, balanças, etc.</p>
                </div>
                <div><Label>Código</Label><Input value={form.codigo_equipamento} onChange={e => setForm(p => ({ ...p, codigo_equipamento: e.target.value }))} placeholder="MX-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_LIST.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrição *</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o serviço" /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Data Programada</Label><Input type="date" value={form.data_programada} onChange={e => setForm(p => ({ ...p, data_programada: e.target.value }))} /></div>
                <div><Label>Data Execução</Label><Input type="date" value={form.data_execucao} onChange={e => setForm(p => ({ ...p, data_execucao: e.target.value }))} /></div>
                <div><Label>Próxima</Label><Input type="date" value={form.proxima_manutencao} onChange={e => setForm(p => ({ ...p, proxima_manutencao: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Custo (R$)</Label><Input value={form.custo} onChange={e => setForm(p => ({ ...p, custo: e.target.value }))} /></div>
                <div><Label>Peças Trocadas</Label><Input value={form.pecas_trocadas} onChange={e => setForm(p => ({ ...p, pecas_trocadas: e.target.value }))} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
              <Button onClick={() => addManutencao.mutate()} disabled={!form.equipamento || !form.descricao}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {manutencoes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhuma manutenção registrada</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Prog.</TableHead>
                <TableHead>Data Exec.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manutencoes.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.equipamento}</TableCell>
                  <TableCell>{m.codigo_equipamento}</TableCell>
                  <TableCell className="capitalize">{m.tipo}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{m.descricao}</TableCell>
                  <TableCell>{m.data_programada}</TableCell>
                  <TableCell>{m.data_execucao || "—"}</TableCell>
                 <TableCell><Badge variant={statusVariant(m.status)}>{STATUS_LIST.find(s => s.value === m.status)?.label || m.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteManut.mutate(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="calibracoes" className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">Balanças, termômetros, higrômetros e demais instrumentos — IN 04/2007</p>
            <Dialog open={openCalib} onOpenChange={setOpenCalib}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Calibração</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registrar Calibração de Equipamento</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Equipamento *</Label><Input value={calibForm.equipamento} onChange={e => setCalibForm(p => ({ ...p, equipamento: e.target.value }))} placeholder="Ex: Balança Toledo 01" /></div>
                    <div><Label>Código</Label><Input value={calibForm.codigo} onChange={e => setCalibForm(p => ({ ...p, codigo: e.target.value }))} placeholder="BAL-001" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={calibForm.tipo} onValueChange={v => setCalibForm(p => ({ ...p, tipo: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanca">Balança</SelectItem>
                          <SelectItem value="termometro">Termômetro</SelectItem>
                          <SelectItem value="higrometro">Higrômetro</SelectItem>
                          <SelectItem value="manometro">Manômetro</SelectItem>
                          <SelectItem value="phmetro">pHmetro</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Localização</Label><Input value={calibForm.localizacao} onChange={e => setCalibForm(p => ({ ...p, localizacao: e.target.value }))} placeholder="Ex: Setor de Pesagem" /></div>
                  </div>
                  <div><Label>Responsável / Empresa</Label><Input value={calibForm.responsavel} onChange={e => setCalibForm(p => ({ ...p, responsavel: e.target.value }))} placeholder="Ex: Empresa XYZ Metrologia" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data Calibração</Label><Input type="date" value={calibForm.data_calibracao} onChange={e => setCalibForm(p => ({ ...p, data_calibracao: e.target.value }))} /></div>
                    <div><Label>Próxima Calibração</Label><Input type="date" value={calibForm.proxima_calibracao} onChange={e => setCalibForm(p => ({ ...p, proxima_calibracao: e.target.value }))} /></div>
                  </div>
                  <div><Label>Nº Certificado</Label><Input value={calibForm.certificado_numero} onChange={e => setCalibForm(p => ({ ...p, certificado_numero: e.target.value }))} placeholder="Ex: CERT-2026-0045" /></div>
                  <div className="p-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 space-y-2">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Verificação Intermediária — IN 04/2007</p>
                    <div><Label className="text-xs">Próxima Verificação Intermediária</Label><Input type="date" value={calibForm.proxima_verificacao_intermediaria} onChange={e => setCalibForm(p => ({ ...p, proxima_verificacao_intermediaria: e.target.value }))} /></div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={calibForm.verificacao_conforme} onChange={e => setCalibForm(p => ({ ...p, verificacao_conforme: e.target.checked }))} className="h-4 w-4" />
                      <Label className="text-sm">Verificação conforme</Label>
                    </div>
                    <div><Label className="text-xs">Resultado da Verificação</Label><Input value={calibForm.resultado_verificacao} onChange={e => setCalibForm(p => ({ ...p, resultado_verificacao: e.target.value }))} placeholder="Ex: Erro ≤ 0,1% — Conforme" /></div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={calibForm.observacoes} onChange={e => setCalibForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addCalibracao.mutate()} disabled={!calibForm.equipamento}>Salvar Calibração</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {calibracoes.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Scale className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhuma calibração registrada</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Última Calibração</TableHead>
                    <TableHead>Próxima Calibração</TableHead>
                        <TableHead>Verif. Intermediária</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calibracoes.map((c: any) => {
                    const vencida = c.proxima_calibracao && c.proxima_calibracao <= today;
                    const verifPendente = calibracoesComAlerta.some((a: any) => a.id === c.id);
                    return (
                      <TableRow key={c.id} className={vencida ? "bg-destructive/5" : verifPendente ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}>
                        <TableCell className="font-medium">{c.equipamento}</TableCell>
                        <TableCell>{c.codigo || "—"}</TableCell>
                        <TableCell>{c.data_calibracao || "—"}</TableCell>
                        <TableCell>{c.proxima_calibracao || "—"}</TableCell>
                        <TableCell>
                          {c.proxima_verificacao_intermediaria ? (
                            <span className={c.proxima_verificacao_intermediaria <= today ? "text-yellow-600 font-semibold" : ""}>{c.proxima_verificacao_intermediaria}</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {vencida ? <Badge variant="destructive">Vencida</Badge> :
                           verifPendente ? <Badge variant="outline" className="border-yellow-500 text-yellow-700">Verif. Pendente</Badge> :
                           <Badge variant="default">Calibrado</Badge>}
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteCalib.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── TROCA DE PEÇAS ── */}
        <TabsContent value="trocas" className="space-y-4">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Cog className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Cronograma de Trocas de Peças — POP 05 / IN 04/2007</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Controle de substituição programada de peças em equipamentos críticos (moinhos, misturadores, peletizadoras).
                A troca preventiva de peças reduz paradas não planejadas e previne contaminação cruzada por desgaste.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">{trocasPecas.length} registro(s) de troca de peças</p>
            <Dialog open={openTroca} onOpenChange={setOpenTroca}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Troca de Peças</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registrar Troca de Peças</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Equipamento Crítico</Label>
                    <Select value={equipSelecionado} onValueChange={v => {
                      setEquipSelecionado(v);
                      const eq = EQUIPAMENTOS_CRITICOS.find(e => e.nome === v);
                      if (eq) {
                        setTrocaForm(p => ({ ...p, equipamento: eq.nome, codigo_equipamento: eq.codigo + "-" }));
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecionar equipamento..." /></SelectTrigger>
                      <SelectContent>
                        {EQUIPAMENTOS_CRITICOS.map(eq => (
                          <SelectItem key={eq.nome} value={eq.nome}>{eq.nome} ({eq.codigo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Equipamento *</Label><Input value={trocaForm.equipamento} onChange={e => setTrocaForm(p => ({ ...p, equipamento: e.target.value }))} /></div>
                    <div><Label>Código</Label><Input value={trocaForm.codigo_equipamento} onChange={e => setTrocaForm(p => ({ ...p, codigo_equipamento: e.target.value }))} /></div>
                  </div>
                  {equipSelecionado && (() => {
                    const eq = EQUIPAMENTOS_CRITICOS.find(e => e.nome === equipSelecionado);
                    if (!eq) return null;
                    return (
                      <div className="p-3 rounded-lg border bg-muted/30">
                        <Label className="text-xs font-semibold">Peças Sugeridas para {eq.nome}:</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {eq.pecas.map(p => (
                            <Badge key={p} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10" onClick={() => {
                              const current = trocaForm.pecas_trocadas;
                              if (!current.includes(p)) {
                                setTrocaForm(prev => ({ ...prev, pecas_trocadas: current ? `${current}, ${p}` : p }));
                              }
                            }}>{p}</Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Clique nas peças para adicioná-las</p>
                      </div>
                    );
                  })()}
                  <div><Label>Peças Trocadas *</Label><Textarea value={trocaForm.pecas_trocadas} onChange={e => setTrocaForm(p => ({ ...p, pecas_trocadas: e.target.value }))} placeholder="Ex: Martelos, Peneiras, Rolamentos" /></div>
                  <div><Label>Descrição do Serviço *</Label><Textarea value={trocaForm.descricao} onChange={e => setTrocaForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva a troca realizada ou programada" /></div>
                  <div><Label>Responsável</Label><Input value={trocaForm.responsavel} onChange={e => setTrocaForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Data Programada</Label><Input type="date" value={trocaForm.data_programada} onChange={e => setTrocaForm(p => ({ ...p, data_programada: e.target.value }))} /></div>
                    <div><Label>Data Execução</Label><Input type="date" value={trocaForm.data_execucao} onChange={e => setTrocaForm(p => ({ ...p, data_execucao: e.target.value }))} /></div>
                    <div><Label>Próxima Troca</Label><Input type="date" value={trocaForm.proxima_manutencao} onChange={e => setTrocaForm(p => ({ ...p, proxima_manutencao: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Custo (R$)</Label><Input value={trocaForm.custo} onChange={e => setTrocaForm(p => ({ ...p, custo: e.target.value }))} /></div>
                    <div>
                      <Label>Status</Label>
                      <Select value={trocaForm.status} onValueChange={v => setTrocaForm(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_LIST.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={trocaForm.observacoes} onChange={e => setTrocaForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addTrocaPecas.mutate()} disabled={!trocaForm.equipamento || !trocaForm.pecas_trocadas}>Salvar Troca</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {trocasPecas.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Cog className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhuma troca de peças registrada</p><p className="text-xs mt-1">Registre a substituição de peças em equipamentos críticos</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Peças Trocadas</TableHead>
                    <TableHead>Data Prog.</TableHead>
                    <TableHead>Data Exec.</TableHead>
                    <TableHead>Próxima Troca</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trocasPecas.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.equipamento}</TableCell>
                      <TableCell>{m.codigo_equipamento || "—"}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {m.pecas_trocadas.split(",").map((p: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{p.trim()}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{m.data_programada}</TableCell>
                      <TableCell>{m.data_execucao || "—"}</TableCell>
                      <TableCell>{m.proxima_manutencao || <span className="text-destructive text-xs">Não definida</span>}</TableCell>
                      <TableCell><Badge variant={statusVariant(m.status)}>{STATUS_LIST.find(s => s.value === m.status)?.label || m.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteManut.mutate(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Referência de peças por equipamento */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Guia de Peças por Equipamento Crítico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EQUIPAMENTOS_CRITICOS.map(eq => (
                  <div key={eq.nome} className="p-3 rounded-lg border bg-muted/20">
                    <p className="font-semibold text-sm">{eq.nome} <span className="text-muted-foreground font-normal">({eq.codigo})</span></p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {eq.pecas.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CRONOGRAMA ── */}
        <TabsContent value="cronograma" className="space-y-4">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Cronograma de manutenção preventiva dos próximos 90 dias — POP 06 (IN 04/2007).
                Equipamentos sem próxima manutenção programada são destacados como pendentes.
              </p>
            </CardContent>
          </Card>

          {(() => {
            const hoje = new Date();
            const em90dias = new Date(hoje);
            em90dias.setDate(em90dias.getDate() + 90);

            // Upcoming maintenance
            const proximas = manutencoes
              .filter((m: any) => m.proxima_manutencao && m.proxima_manutencao >= today)
              .sort((a: any, b: any) => a.proxima_manutencao.localeCompare(b.proxima_manutencao));

            // Overdue
            const atrasadas = manutencoes.filter((m: any) => m.status === "programada" && m.data_programada && m.data_programada < today);

            // Upcoming calibrations
            const proxCalibs = calibracoes
              .filter((c: any) => c.proxima_calibracao && c.proxima_calibracao >= today && c.proxima_calibracao <= em90dias.toISOString().split("T")[0])
              .sort((a: any, b: any) => a.proxima_calibracao.localeCompare(b.proxima_calibracao));

            // Equipment without next maintenance
            const equipSemProxima = manutencoes.filter((m: any) => !m.proxima_manutencao && m.status !== "concluida");

            return (
              <div className="space-y-4">
                {atrasadas.length > 0 && (
                  <Card className="border-destructive/30">
                    <CardHeader className="py-3"><CardTitle className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Manutenções Atrasadas ({atrasadas.length})</CardTitle></CardHeader>
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Equipamento</TableHead><TableHead>Código</TableHead><TableHead>Data Prog.</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {atrasadas.map((m: any) => (
                          <TableRow key={m.id} className="bg-destructive/5">
                            <TableCell className="font-medium">{m.equipamento}</TableCell>
                            <TableCell>{m.codigo_equipamento || "—"}</TableCell>
                            <TableCell className="text-destructive font-semibold">{m.data_programada}</TableCell>
                            <TableCell className="capitalize">{m.tipo}</TableCell>
                            <TableCell className="max-w-[180px] truncate">{m.descricao}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-sm">Próximas Manutenções (90 dias)</CardTitle></CardHeader>
                  {proximas.length === 0 ? (
                    <CardContent><p className="text-sm text-muted-foreground text-center py-4">Nenhuma manutenção programada nos próximos 90 dias</p></CardContent>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Equipamento</TableHead><TableHead>Próxima Data</TableHead><TableHead>Tipo</TableHead><TableHead>Responsável</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {proximas.map((m: any) => {
                          const dias = Math.ceil((new Date(m.proxima_manutencao).getTime() - hoje.getTime()) / 86400000);
                          return (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.equipamento}</TableCell>
                              <TableCell>
                                {m.proxima_manutencao}
                                <Badge variant="outline" className="ml-2 text-[10px]">{dias}d</Badge>
                              </TableCell>
                              <TableCell className="capitalize">{m.tipo}</TableCell>
                              <TableCell>{m.responsavel || "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </Card>

                {proxCalibs.length > 0 && (
                  <Card>
                    <CardHeader className="py-3"><CardTitle className="text-sm">Próximas Calibrações (90 dias)</CardTitle></CardHeader>
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Equipamento</TableHead><TableHead>Código</TableHead><TableHead>Próxima Calibração</TableHead><TableHead>Tipo</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {proxCalibs.map((c: any) => {
                          const dias = Math.ceil((new Date(c.proxima_calibracao).getTime() - hoje.getTime()) / 86400000);
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.equipamento}</TableCell>
                              <TableCell>{c.codigo || "—"}</TableCell>
                              <TableCell>
                                {c.proxima_calibracao}
                                <Badge variant="outline" className="ml-2 text-[10px]">{dias}d</Badge>
                              </TableCell>
                              <TableCell className="capitalize">{c.tipo || "Balança"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {equipSemProxima.length > 0 && (
                  <Card className="border-yellow-500/20">
                    <CardHeader className="py-3"><CardTitle className="text-sm text-yellow-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Equipamentos sem Próxima Manutenção</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {equipSemProxima.map((m: any) => (
                          <Badge key={m.id} variant="outline" className="border-yellow-500 text-yellow-700">{m.equipamento} ({m.codigo_equipamento || "s/cód"})</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
