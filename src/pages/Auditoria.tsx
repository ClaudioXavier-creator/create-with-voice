import { ClipboardCheck, CheckCircle2, XCircle, Link2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PageHeader from "@/components/PageHeader";
import { useChecklistItems } from "@/store/feedbpf-store";
import { cn } from "@/lib/utils";

export default function Auditoria() {
  const [items, setItems] = useChecklistItems();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Visitor control
  const [visitanteOpen, setVisitanteOpen] = useState(false);
  const [vForm, setVForm] = useState({
    nome_visitante: "", empresa: "", documento: "", motivo: "",
    areas_visitadas: "", hora_entrada: "", hora_saida: "", acompanhante: "",
    epi_fornecido: false, orientacao_biosseguridade: false, observacoes: "",
    data_visita: new Date().toISOString().split("T")[0],
  });

  const { data: visitantes = [] } = useQuery({
    queryKey: ["controle_visitantes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("controle_visitantes" as any).select("*")
        .order("data_visita", { ascending: false }).limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const addVisitante = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("controle_visitantes" as any).insert({ ...vForm, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_visitantes"] });
      toast.success("Visitante registrado");
      setVisitanteOpen(false);
      setVForm({ nome_visitante: "", empresa: "", documento: "", motivo: "", areas_visitadas: "", hora_entrada: "", hora_saida: "", acompanhante: "", epi_fornecido: false, orientacao_biosseguridade: false, observacoes: "", data_visita: new Date().toISOString().split("T")[0] });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const delVisitante = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("controle_visitantes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["controle_visitantes"] }); toast.success("Removido"); },
  });

  const total = items.length;
  const conformes = items.filter((i) => i.conforme === true).length;
  const naoConformes = items.filter((i) => i.conforme === false).length;
  const pendentes = items.filter((i) => i.conforme === null).length;
  const pct = total > 0 ? Math.round((conformes / total) * 100) : 0;

  const toggleItem = (id: string, value: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, conforme: item.conforme === value ? null : value } : item))
    );
  };

  const updateObs = (id: string, obs: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, observacao: obs } : item)));
  };

  const areas = [...new Set(items.map((i) => i.area))];
  const semOrientacao = visitantes.filter((v: any) => !v.orientacao_biosseguridade).length;

  return (
    <>
      <PageHeader icon={ClipboardCheck} title="Auditoria BPF" description="Checklist conforme Decreto 12.031/2024 — MAPA — Categorização de Risco" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs border-primary/40 text-primary">
          <FileText className="w-3 h-3 mr-1" />
          Decreto nº 12.031/2024 — {total} itens de verificação
        </Badge>
        <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">
          Inclui categorização de risco (Art. 79-86)
        </Badge>
      </div>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist"><ClipboardCheck className="w-4 h-4 mr-1" />Checklist BPF</TabsTrigger>
          <TabsTrigger value="visitantes"><Users className="w-4 h-4 mr-1" />Controle de Visitantes {semOrientacao > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{semOrientacao}</Badge>}</TabsTrigger>
          <TabsTrigger value="declaracao"><FileCheck className="w-4 h-4 mr-1" />Declaração Visitante</TabsTrigger>
        </TabsList>

        {/* ── CHECKLIST ── */}
        <TabsContent value="checklist" className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-primary">{pct}%</p>
              <p className="text-xs text-muted-foreground">Conformidade</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-green-600">{conformes}</p>
              <p className="text-xs text-muted-foreground">Conformes</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-destructive">{naoConformes}</p>
              <p className="text-xs text-muted-foreground">Não conformes</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-display text-muted-foreground">{pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent></Card>
          </div>

          <Progress value={pct} className="h-3 mb-6" />

          {/* Checklist por área/tema do decreto */}
          {areas.map((area) => (
            <Card key={area} className="mb-4">
              <CardHeader>
                <CardTitle className="font-display text-sm md:text-base">{area}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.filter((i) => i.area === area).map((item) => (
                  <div key={item.id} className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border",
                    item.conforme === false ? "border-destructive/30 bg-destructive/5" :
                    item.conforme === true ? "border-primary/30 bg-primary/5" : "border-border"
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.item}</p>
                      {item.popVinculado && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-xs text-primary mt-1 cursor-help">
                              <Link2 className="w-3 h-3" />
                              {item.popVinculado}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>POP vinculado: {item.popVinculado} — Ver em Execução ITs/POPs</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant={item.conforme === true ? "default" : "outline"} onClick={() => toggleItem(item.id, true)} className="gap-1">
                        <CheckCircle2 className="w-4 h-4" /> C
                      </Button>
                      <Button size="sm" variant={item.conforme === false ? "destructive" : "outline"} onClick={() => toggleItem(item.id, false)} className="gap-1">
                        <XCircle className="w-4 h-4" /> NC
                      </Button>
                      <Input placeholder="Observação" value={item.observacao} onChange={(e) => updateObs(item.id, e.target.value)} className="w-32 md:w-40 text-xs" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── CONTROLE DE VISITANTES ── */}
        <TabsContent value="visitantes" className="space-y-4">
          <Card className="border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Controle de Visitantes — Biosseguridade (IN 15/2009)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ponto crítico de biosseguridade: todos os visitantes devem ser registrados, receber orientação sobre
                    normas de biosseguridade e utilizar EPIs fornecidos. Requisito obrigatório do Art. 39-XIV do Decreto 12.031/2024.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Dialog open={visitanteOpen} onOpenChange={setVisitanteOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Registrar Visitante</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registro de Visitante</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome do Visitante *</Label><Input value={vForm.nome_visitante} onChange={e => setVForm(p => ({ ...p, nome_visitante: e.target.value }))} /></div>
                    <div><Label>Empresa</Label><Input value={vForm.empresa} onChange={e => setVForm(p => ({ ...p, empresa: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Documento (RG/CPF)</Label><Input value={vForm.documento} onChange={e => setVForm(p => ({ ...p, documento: e.target.value }))} /></div>
                    <div><Label>Data da Visita</Label><Input type="date" value={vForm.data_visita} onChange={e => setVForm(p => ({ ...p, data_visita: e.target.value }))} /></div>
                  </div>
                  <div><Label>Motivo da Visita</Label><Input value={vForm.motivo} onChange={e => setVForm(p => ({ ...p, motivo: e.target.value }))} placeholder="Ex: Auditoria MAPA, Manutenção, Fornecedor..." /></div>
                  <div><Label>Áreas Visitadas</Label><Input value={vForm.areas_visitadas} onChange={e => setVForm(p => ({ ...p, areas_visitadas: e.target.value }))} placeholder="Ex: Produção, Almoxarifado, Laboratório" /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Hora Entrada</Label><Input type="time" value={vForm.hora_entrada} onChange={e => setVForm(p => ({ ...p, hora_entrada: e.target.value }))} /></div>
                    <div><Label>Hora Saída</Label><Input type="time" value={vForm.hora_saida} onChange={e => setVForm(p => ({ ...p, hora_saida: e.target.value }))} /></div>
                    <div><Label>Acompanhante</Label><Input value={vForm.acompanhante} onChange={e => setVForm(p => ({ ...p, acompanhante: e.target.value }))} /></div>
                  </div>
                  <div className="flex items-center gap-6 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Switch checked={vForm.epi_fornecido} onCheckedChange={v => setVForm(p => ({ ...p, epi_fornecido: v }))} />
                      <Label className="text-xs">EPI fornecido</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={vForm.orientacao_biosseguridade} onCheckedChange={v => setVForm(p => ({ ...p, orientacao_biosseguridade: v }))} />
                      <Label className="text-xs">Orientação biosseguridade</Label>
                    </div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={vForm.observacoes} onChange={e => setVForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} /></div>
                  <Button onClick={() => addVisitante.mutate()} disabled={!vForm.nome_visitante}>Registrar Visitante</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {visitantes.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum visitante registrado</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Visitante</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Áreas</TableHead>
                    <TableHead>Entrada/Saída</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Orientação</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitantes.map((v: any) => (
                    <TableRow key={v.id} className={!v.orientacao_biosseguridade ? "bg-destructive/5" : ""}>
                      <TableCell className="whitespace-nowrap text-xs">{v.data_visita}</TableCell>
                      <TableCell className="font-medium text-sm">{v.nome_visitante}</TableCell>
                      <TableCell className="text-xs">{v.empresa || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{v.motivo || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{v.areas_visitadas || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{v.hora_entrada || "—"} / {v.hora_saida || "—"}</TableCell>
                      <TableCell>{v.epi_fornecido ? <Badge className="bg-primary/20 text-primary text-[10px]">Sim</Badge> : <Badge variant="outline" className="text-[10px]">Não</Badge>}</TableCell>
                      <TableCell>{v.orientacao_biosseguridade ? <Badge className="bg-primary/20 text-primary text-[10px]">Sim</Badge> : <Badge className="bg-destructive text-destructive-foreground text-[10px]">Não</Badge>}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => delVisitante.mutate(v.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── DECLARAÇÃO VISITANTE ── */}
        <TabsContent value="declaracao">
          <DeclaracaoVisitante />
        </TabsContent>
      </Tabs>
    </>
  );
}
