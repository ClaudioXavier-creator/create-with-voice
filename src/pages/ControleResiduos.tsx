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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Recycle, ShieldAlert, Droplets } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const TIPOS_RESIDUO = ["Orgânico", "Pó/Varredura", "Embalagens plásticas", "Embalagens papel/papelão", "Efluente líquido", "Efluente industrial", "Água de lavagem", "Óleo lubrificante", "Resíduo químico", "Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção", "Outro"];
const TRATAMENTO_EFLUENTE = [
  { value: "fossa_septica", label: "Fossa Séptica" },
  { value: "ete_propria", label: "ETE Própria" },
  { value: "rede_publica", label: "Rede Pública de Esgoto" },
  { value: "lagoa_estabilizacao", label: "Lagoa de Estabilização" },
  { value: "filtro_biologico", label: "Filtro Biológico" },
  { value: "sem_tratamento", label: "Sem Tratamento (irregular)" },
  { value: "outro", label: "Outro" },
];
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
    responsavel: "", manifesto_numero: "", observacoes: "",
    motivo_descarte: "", lote_produto: "", produto_nome: "",
  });

  const isEfluente = ["Efluente líquido", "Efluente industrial", "Água de lavagem"].includes(form.tipo_residuo);

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

      // Auto-register in execucao_pops for discarded products (IN 15/2009)
      const isProdutoDescartado = ["Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção"].includes(form.tipo_residuo);
      if (isProdutoDescartado && form.produto_nome) {
        const motivo = MOTIVOS_DESCARTE.find(m => m.value === form.motivo_descarte)?.label || form.motivo_descarte || "Não informado";
        const obs = [
          `[REGISTRO DE DESCARTE — POP-04 / IN 15/2009]`,
          `Tipo: ${form.tipo_residuo}`,
          `Produto: ${form.produto_nome} | Lote: ${form.lote_produto || "—"}`,
          `Motivo: ${motivo}`,
          `Destino: ${form.destino_final || "—"}`,
          `Qtd: ${form.quantidade || "—"} ${form.unidade}`,
          `Empresa coletora: ${form.empresa_coletora || "—"}`,
          form.manifesto_numero ? `Manifesto: ${form.manifesto_numero}` : "",
          form.observacoes ? `Obs: ${form.observacoes}` : "",
        ].filter(Boolean).join("\n");

        await supabase.from("execucao_pops").insert({
          user_id: user!.id,
          codigo_pop: "POP-04-DESCARTE",
          nome_pop: "Registro de Descarte de Produto",
          executor: form.responsavel || "—",
          setor: form.origem || "Produção",
          status: "concluido",
          observacoes: obs,
          data_execucao: form.data_coleta,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_residuos"] });
      toast.success("Registro de resíduo salvo");
      setOpen(false);
      setForm({ tipo_residuo: "", classificacao: "classe_II_A", origem: "", destino_final: "", empresa_coletora: "", licenca_ambiental: "", frequencia_coleta: "semanal", quantidade: "", unidade: "kg", data_coleta: new Date().toISOString().split("T")[0], responsavel: "", manifesto_numero: "", observacoes: "", motivo_descarte: "", lote_produto: "", produto_nome: "" });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("controle_residuos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["controle_residuos"] }); toast.success("Removido"); },
  });

  const totalResiduos = residuos.length;
  const comManifesto = residuos.filter((r: any) => r.manifesto_numero).length;
  const efluentes = residuos.filter((r: any) => ["Efluente líquido", "Efluente industrial", "Água de lavagem"].includes(r.tipo_residuo));
  const comLicenca = residuos.filter((r: any) => r.licenca_ambiental).length;

  return (
    <div className="space-y-6">
      <PageHeader title="POP 05 — Manejo de Resíduos e Efluentes" description="IN 04/2007 (POP-05), IN 15/2009, Decreto 12.031/2024 — Gestão ambiental completa" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{totalResiduos}</p>
          <p className="text-xs text-muted-foreground">Registros totais</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{comManifesto}</p>
          <p className="text-xs text-muted-foreground">Com manifesto</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-blue-600">{efluentes.length}</p>
          <p className="text-xs text-muted-foreground">Efluentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{comLicenca}</p>
          <p className="text-xs text-muted-foreground">Com licença ambiental</p>
        </CardContent></Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h4 className="font-display font-semibold text-sm">POP 05 — Prevenção de Contaminação Cruzada e Manejo de Resíduos (IN 04/2007)</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Abrange: separação e identificação de resíduos por classe (ABNT), rastreamento de produtos descartados,
                controle de efluentes (pH, DBO, DQO), manifestos de transporte e licenças ambientais.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">IN 04/2007 Art. 2º §5</Badge>
                <Badge variant="outline" className="text-[10px]">IN 15/2009 Cap. IV</Badge>
                <Badge variant="outline" className="text-[10px]">Decreto 12.031/2024</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {["Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção"].includes(form.tipo_residuo) && (
                <div className="p-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 space-y-3">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">⚠️ Controle de Produto Descartado (POP 05 — IN 04/2007)</p>
                  <div>
                    <Label>Motivo do Descarte</Label>
                    <Select value={form.motivo_descarte} onValueChange={v => setForm(p => ({ ...p, motivo_descarte: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{MOTIVOS_DESCARTE.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Produto</Label><Input value={form.produto_nome} onChange={e => setForm(p => ({ ...p, produto_nome: e.target.value }))} placeholder="Ex: Ração Bovino 20kg" /></div>
                    <div><Label>Lote do Produto</Label><Input value={form.lote_produto} onChange={e => setForm(p => ({ ...p, lote_produto: e.target.value }))} placeholder="Ex: RBE-0320-01" /></div>
                  </div>
                </div>
              )}
              {isEfluente && (
                <div className="p-3 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">💧 Controle de Efluentes — IN 15/2009</p>
                  <div>
                    <Label>Tipo de Tratamento</Label>
                    <Select value={form.observacoes.includes("[TRATAMENTO:") ? "" : ""} onValueChange={v => setForm(p => ({ ...p, observacoes: `[TRATAMENTO: ${TRATAMENTO_EFLUENTE.find(t => t.value === v)?.label || v}] ${p.observacoes.replace(/\[TRATAMENTO:.*?\]\s?/, "")}` }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o tratamento" /></SelectTrigger>
                      <SelectContent>{TRATAMENTO_EFLUENTE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Registre pH, DBO e demais parâmetros nas observações. Laudos devem ser arquivados no módulo Relatórios.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Origem / Setor</Label><Input value={form.origem} onChange={e => setForm(p => ({ ...p, origem: e.target.value }))} /></div>
                <div><Label>Destino Final</Label><Input value={form.destino_final} onChange={e => setForm(p => ({ ...p, destino_final: e.target.value }))} placeholder="Aterro, reciclagem, incineração..." /></div>
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
                    <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="litros">Litros</SelectItem><SelectItem value="ton">Toneladas</SelectItem><SelectItem value="m3">m³</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Data Coleta</Label><Input type="date" value={form.data_coleta} onChange={e => setForm(p => ({ ...p, data_coleta: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                <div><Label>Nº Manifesto</Label><Input value={form.manifesto_numero} onChange={e => setForm(p => ({ ...p, manifesto_numero: e.target.value }))} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder={isEfluente ? "Ex: pH=7.2, DBO=45mg/L, DQO=90mg/L..." : ""} /></div>
              <Button onClick={() => add.mutate()} disabled={!form.tipo_residuo}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="registros" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registros"><Recycle className="w-4 h-4 mr-1" />Registros</TabsTrigger>
          <TabsTrigger value="efluentes"><Droplets className="w-4 h-4 mr-1" />Efluentes ({efluentes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="efluentes" className="space-y-4">
          <Card className="border-blue-400/20 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Droplets className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Controle de Efluentes — POP 05 (IN 04/2007 / IN 15/2009)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registros de efluentes líquidos, industriais e água de lavagem com tipo de tratamento.
                    Parâmetros obrigatórios: pH, DBO, DQO (registrar nas observações).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {efluentes.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Droplets className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nenhum efluente registrado</p>
              <p className="text-xs mt-1">Use "Novo Registro" e selecione um tipo de efluente.</p>
            </CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino / Tratamento</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Manifesto</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {efluentes.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_coleta}</TableCell>
                      <TableCell className="font-medium">{r.tipo_residuo}</TableCell>
                      <TableCell>{r.origem}</TableCell>
                      <TableCell>{r.destino_final}</TableCell>
                      <TableCell>{r.quantidade} {r.unidade}</TableCell>
                      <TableCell>{r.manifesto_numero || "—"}</TableCell>
                      <TableCell className="max-w-[200px] text-xs truncate">{r.observacoes}</TableCell>
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