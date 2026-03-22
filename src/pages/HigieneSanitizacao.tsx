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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Droplets, CheckCircle2, Clock, Trash2, Beaker } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const AREAS = ["Recepção de MP", "Mistura", "Ensaque", "Expedição", "Almoxarifado", "Laboratório", "Banheiros", "Refeitório", "Área Externa"];
const FREQUENCIAS = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
];

const PONTOS_AGUA = [
  "Ponto 1 — Entrada / Poço",
  "Ponto 2 — Área de Produção",
  "Ponto 3 — Bebedouro / Refeitório",
  "Ponto 4 — Lavagem de equipamentos",
];

export default function HigieneSanitizacao() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openCronograma, setOpenCronograma] = useState(false);
  const [openRegistro, setOpenRegistro] = useState(false);
  const [openAgua, setOpenAgua] = useState(false);
  const [selectedCronograma, setSelectedCronograma] = useState<string | null>(null);

  const [form, setForm] = useState({
    area: "", equipamento: "", procedimento: "", produto_utilizado: "",
    concentracao: "", frequencia: "diario", responsavel: "", horario_previsto: "", observacoes: ""
  });

  const [regForm, setRegForm] = useState({
    cronograma_id: "", data_execucao: new Date().toISOString().split("T")[0],
    hora_inicio: "", hora_fim: "", executor: "", conforme: true, observacoes: ""
  });

  const [aguaForm, setAguaForm] = useState({
    ponto: PONTOS_AGUA[0], cloro_residual: "", ph: "", turbidez: "",
    data: new Date().toISOString().split("T")[0], responsavel: "",
    laudo_numero: "", laudo_valido: true, reservatorio_limpo: true,
    certificado_limpeza: "", observacoes: "",
  });

  const { data: cronogramas = [] } = useQuery({
    queryKey: ["cronogramas_higiene"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cronogramas_higiene").select("*").order("area");
      if (error) throw error;
      return data;
    },
  });

  const { data: registros = [] } = useQuery({
    queryKey: ["registros_limpeza", selectedCronograma],
    queryFn: async () => {
      let q = supabase.from("registros_limpeza").select("*").order("data_execucao", { ascending: false });
      if (selectedCronograma) q = q.eq("cronograma_id", selectedCronograma);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: registrosAgua = [] } = useQuery({
    queryKey: ["registros_agua"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execucao_pops").select("*")
        .eq("codigo_pop", "POP-04-AGUA").order("data_execucao", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const addCronograma = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cronogramas_higiene").insert({ ...form, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] }); toast.success("Cronograma cadastrado"); setOpenCronograma(false); setForm({ area: "", equipamento: "", procedimento: "", produto_utilizado: "", concentracao: "", frequencia: "diario", responsavel: "", horario_previsto: "", observacoes: "" }); },
    onError: () => toast.error("Erro ao cadastrar"),
  });

  const addRegistro = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("registros_limpeza").insert({ ...regForm, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["registros_limpeza"] }); toast.success("Registro salvo"); setOpenRegistro(false); },
    onError: () => toast.error("Erro ao registrar"),
  });

  const addRegistroAgua = useMutation({
    mutationFn: async () => {
      const cloro = parseFloat(aguaForm.cloro_residual.replace(",", "."));
      const ph = parseFloat(aguaForm.ph.replace(",", "."));
      const turb = parseFloat(aguaForm.turbidez.replace(",", "."));
      const cloroOk = !isNaN(cloro) && cloro >= 0.2 && cloro <= 2.0;
      const phOk = !isNaN(ph) && ph >= 6.0 && ph <= 9.5;
      const turbOk = !isNaN(turb) && turb <= 5;
      const conforme = cloroOk && phOk && turbOk && aguaForm.laudo_valido && aguaForm.reservatorio_limpo;

      const obs = [
        `[CONTROLE DE ÁGUA — POP-04 / IN 04/2007]`,
        `Ponto: ${aguaForm.ponto}`,
        `Cloro residual: ${aguaForm.cloro_residual} mg/L ${cloroOk ? "✅" : "❌ FORA (0,2-2,0)"}`,
        `pH: ${aguaForm.ph} ${phOk ? "✅" : "❌ FORA (6,0-9,5)"}`,
        `Turbidez: ${aguaForm.turbidez} NTU ${turbOk ? "✅" : "❌ FORA (≤5)"}`,
        `Laudo nº: ${aguaForm.laudo_numero || "—"} | Válido: ${aguaForm.laudo_valido ? "Sim" : "Não"}`,
        `Reservatório limpo: ${aguaForm.reservatorio_limpo ? "Sim" : "Não"}`,
        aguaForm.certificado_limpeza ? `Cert. limpeza reserv.: ${aguaForm.certificado_limpeza}` : "",
        aguaForm.observacoes ? `Obs: ${aguaForm.observacoes}` : "",
      ].filter(Boolean).join("\n");

      const { error } = await supabase.from("execucao_pops").insert({
        user_id: user!.id,
        codigo_pop: "POP-04-AGUA",
        nome_pop: "Controle Potabilidade da Água",
        executor: aguaForm.responsavel,
        setor: aguaForm.ponto,
        status: conforme ? "concluido" : "nao_conforme",
        observacoes: obs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registros_agua"] });
      toast.success("Registro de água salvo");
      setOpenAgua(false);
      setAguaForm({ ponto: PONTOS_AGUA[0], cloro_residual: "", ph: "", turbidez: "", data: new Date().toISOString().split("T")[0], responsavel: "", laudo_numero: "", laudo_valido: true, reservatorio_limpo: true, certificado_limpeza: "", observacoes: "" });
    },
    onError: () => toast.error("Erro ao registrar"),
  });

  const deleteCronograma = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("cronogramas_higiene").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] }); toast.success("Removido"); },
  });

  const freqLabel = (v: string) => FREQUENCIAS.find(f => f.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <PageHeader title="POP 02/03/04 — Higiene, Sanitização e Controle de Água" description="Cronogramas de limpeza e controle de potabilidade — IN 04/2007 e IN 15/2009" />

      <Tabs defaultValue="cronogramas">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="cronogramas"><Droplets className="w-4 h-4 mr-1" />Cronogramas</TabsTrigger>
          <TabsTrigger value="registros"><CheckCircle2 className="w-4 h-4 mr-1" />Registros Limpeza</TabsTrigger>
          <TabsTrigger value="agua"><Beaker className="w-4 h-4 mr-1" />Controle de Água (POP-04)</TabsTrigger>
        </TabsList>

        {/* ── CRONOGRAMAS ── */}
        <TabsContent value="cronogramas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCronograma} onOpenChange={setOpenCronograma}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Cronograma</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Cadastrar Cronograma de Limpeza</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Área / Setor *</Label>
                    <Select value={form.area} onValueChange={v => setForm(p => ({ ...p, area: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Equipamento</Label><Input value={form.equipamento} onChange={e => setForm(p => ({ ...p, equipamento: e.target.value }))} placeholder="Ex: Misturador 01" /></div>
                  <div><Label>Procedimento *</Label><Textarea value={form.procedimento} onChange={e => setForm(p => ({ ...p, procedimento: e.target.value }))} placeholder="Descreva o procedimento de limpeza" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Produto Utilizado</Label><Input value={form.produto_utilizado} onChange={e => setForm(p => ({ ...p, produto_utilizado: e.target.value }))} placeholder="Ex: Hipoclorito 2%" /></div>
                    <div><Label>Concentração</Label><Input value={form.concentracao} onChange={e => setForm(p => ({ ...p, concentracao: e.target.value }))} placeholder="Ex: 200 ppm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Frequência *</Label>
                      <Select value={form.frequencia} onValueChange={v => setForm(p => ({ ...p, frequencia: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Horário Previsto</Label><Input value={form.horario_previsto} onChange={e => setForm(p => ({ ...p, horario_previsto: e.target.value }))} placeholder="Ex: 06:00" /></div>
                  </div>
                  <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                  <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addCronograma.mutate()} disabled={!form.area || !form.procedimento}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {cronogramas.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Droplets className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum cronograma cadastrado</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Área</TableHead><TableHead>Equipamento</TableHead><TableHead>Procedimento</TableHead>
                  <TableHead>Produto</TableHead><TableHead>Frequência</TableHead><TableHead>Responsável</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cronogramas.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.area}</TableCell>
                      <TableCell>{c.equipamento}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.procedimento}</TableCell>
                      <TableCell>{c.produto_utilizado} {c.concentracao && `(${c.concentracao})`}</TableCell>
                      <TableCell><Badge variant="outline">{freqLabel(c.frequencia)}</Badge></TableCell>
                      <TableCell>{c.responsavel}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteCronograma.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── REGISTROS LIMPEZA ── */}
        <TabsContent value="registros" className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <Select value={selectedCronograma || ""} onValueChange={v => setSelectedCronograma(v || null)}>
              <SelectTrigger className="w-[300px]"><SelectValue placeholder="Filtrar por cronograma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {cronogramas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.area} — {c.procedimento?.substring(0, 30)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={openRegistro} onOpenChange={setOpenRegistro}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Registrar Execução</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Limpeza Realizada</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Cronograma *</Label>
                    <Select value={regForm.cronograma_id} onValueChange={v => setRegForm(p => ({ ...p, cronograma_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{cronogramas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.area} — {c.procedimento?.substring(0, 40)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Data</Label><Input type="date" value={regForm.data_execucao} onChange={e => setRegForm(p => ({ ...p, data_execucao: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Hora Início</Label><Input value={regForm.hora_inicio} onChange={e => setRegForm(p => ({ ...p, hora_inicio: e.target.value }))} placeholder="06:00" /></div>
                    <div><Label>Hora Fim</Label><Input value={regForm.hora_fim} onChange={e => setRegForm(p => ({ ...p, hora_fim: e.target.value }))} placeholder="06:30" /></div>
                  </div>
                  <div><Label>Executor *</Label><Input value={regForm.executor} onChange={e => setRegForm(p => ({ ...p, executor: e.target.value }))} /></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={regForm.conforme} onChange={e => setRegForm(p => ({ ...p, conforme: e.target.checked }))} className="h-4 w-4" />
                    <Label>Conforme</Label>
                  </div>
                  <div><Label>Observações</Label><Textarea value={regForm.observacoes} onChange={e => setRegForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addRegistro.mutate()} disabled={!regForm.cronograma_id || !regForm.executor}>Salvar Registro</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {registros.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum registro encontrado</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Executor</TableHead><TableHead>Horário</TableHead>
                  <TableHead>Conforme</TableHead><TableHead>Observações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {registros.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.hora_inicio}{r.hora_fim ? ` — ${r.hora_fim}` : ""}</TableCell>
                      <TableCell>{r.conforme ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Badge variant="destructive">NC</Badge>}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.observacoes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── CONTROLE DE ÁGUA (POP-04) ── */}
        <TabsContent value="agua" className="space-y-4">
          <Card className="border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 mb-2">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Beaker className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Controle de Potabilidade da Água — POP-04 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitoramento de cloro residual (0,2–2,0 mg/L), pH (6,0–9,5) e turbidez (≤ 5 NTU).
                    Laudos laboratoriais mensais e limpeza semestral de reservatórios são obrigatórios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Dialog open={openAgua} onOpenChange={setOpenAgua}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Registro de Água</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Controle de Potabilidade — POP-04</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Ponto de Coleta *</Label>
                    <Select value={aguaForm.ponto} onValueChange={v => setAguaForm(p => ({ ...p, ponto: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PONTOS_AGUA.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Cloro Residual (mg/L)</Label>
                      <Input value={aguaForm.cloro_residual} onChange={e => setAguaForm(p => ({ ...p, cloro_residual: e.target.value }))} placeholder="Ex: 0,5" />
                      <p className="text-[10px] text-muted-foreground">Padrão: 0,2 – 2,0</p>
                    </div>
                    <div>
                      <Label>pH</Label>
                      <Input value={aguaForm.ph} onChange={e => setAguaForm(p => ({ ...p, ph: e.target.value }))} placeholder="Ex: 7,2" />
                      <p className="text-[10px] text-muted-foreground">Padrão: 6,0 – 9,5</p>
                    </div>
                    <div>
                      <Label>Turbidez (NTU)</Label>
                      <Input value={aguaForm.turbidez} onChange={e => setAguaForm(p => ({ ...p, turbidez: e.target.value }))} placeholder="Ex: 1,5" />
                      <p className="text-[10px] text-muted-foreground">Padrão: ≤ 5</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data</Label><Input type="date" value={aguaForm.data} onChange={e => setAguaForm(p => ({ ...p, data: e.target.value }))} /></div>
                    <div><Label>Responsável</Label><Input value={aguaForm.responsavel} onChange={e => setAguaForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                    <p className="text-xs font-semibold">Laudos e Reservatórios</p>
                    <div><Label>Nº Laudo Laboratorial</Label><Input value={aguaForm.laudo_numero} onChange={e => setAguaForm(p => ({ ...p, laudo_numero: e.target.value }))} placeholder="Ex: LAB-2026-0321" /></div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={aguaForm.laudo_valido} onChange={e => setAguaForm(p => ({ ...p, laudo_valido: e.target.checked }))} className="h-4 w-4" />
                        <Label className="text-sm">Laudo mensal em dia</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={aguaForm.reservatorio_limpo} onChange={e => setAguaForm(p => ({ ...p, reservatorio_limpo: e.target.checked }))} className="h-4 w-4" />
                        <Label className="text-sm">Reservatório limpo (semestral)</Label>
                      </div>
                    </div>
                    <div><Label>Certificado Limpeza Reservatório</Label><Input value={aguaForm.certificado_limpeza} onChange={e => setAguaForm(p => ({ ...p, certificado_limpeza: e.target.value }))} placeholder="Nº ou empresa responsável" /></div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={aguaForm.observacoes} onChange={e => setAguaForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addRegistroAgua.mutate()} disabled={!aguaForm.responsavel}>Salvar Registro</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {registrosAgua.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Beaker className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum registro de controle de água</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Ponto</TableHead><TableHead>Executor</TableHead>
                  <TableHead>Status</TableHead><TableHead className="max-w-[300px]">Detalhes</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {registrosAgua.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell className="font-medium">{r.setor}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                        ) : (
                          <Badge className="bg-destructive text-destructive-foreground">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] text-xs whitespace-pre-line truncate">{(r.observacoes || "").slice(0, 150)}{(r.observacoes?.length || 0) > 150 ? "…" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
