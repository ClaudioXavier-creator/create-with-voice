import { useState } from "react";
import { FileDown, Plus, Upload, FileText, Monitor, ScanLine, Eye } from "lucide-react";
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
import PageHeader from "@/components/PageHeader";
import type { Relatorio } from "@/types/feedbpf";

const MODULOS = [
  "Auditoria BPF",
  "Não Conformidades",
  "Recebimento MP",
  "Produção",
  "Rastreabilidade",
  "Controle de Pragas",
  "Treinamentos",
  "Execução ITs/POPs",
  "Checklist Decreto 12.031",
];

const DEMO_RELATORIOS: Relatorio[] = [
  { id: "1", titulo: "Relatório Auditoria BPF - Março/2026", tipo: "digital", modulo: "Auditoria BPF", descricao: "Auditoria completa conforme Decreto 12.031/2024", dataGeracao: "2026-03-21", status: "ativo" },
  { id: "2", titulo: "Checklist Limpeza - Setor Moagem", tipo: "digitalizado", modulo: "Execução ITs/POPs", descricao: "Planilha preenchida em campo e digitalizada", arquivoNome: "checklist_limpeza_moagem.pdf", dataGeracao: "2026-03-20", status: "ativo" },
  { id: "3", titulo: "Relatório Controle de Pragas - Fev/2026", tipo: "digital", modulo: "Controle de Pragas", descricao: "Monitoramento mensal de pragas", dataGeracao: "2026-02-28", status: "arquivado" },
  { id: "4", titulo: "Registro Recebimento MP - Semanal", tipo: "digitalizado", modulo: "Recebimento MP", descricao: "Planilha semanal assinada pelo RT", arquivoNome: "recebimento_semana12.pdf", dataGeracao: "2026-03-15", status: "ativo" },
];

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>(DEMO_RELATORIOS);
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"digital" | "digitalizado">("digital");
  const [modulo, setModulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const handleAdd = () => {
    if (!titulo || !modulo) return;
    setRelatorios(prev => [...prev, {
      id: String(Date.now()),
      titulo,
      tipo,
      modulo,
      descricao,
      arquivoNome: arquivo?.name || "",
      dataGeracao: new Date().toISOString().split("T")[0],
      status: "ativo",
    }]);
    setOpen(false);
    setTitulo("");
    setTipo("digital");
    setModulo("");
    setDescricao("");
    setArquivo(null);
  };

  const digitais = relatorios.filter(r => r.tipo === "digital");
  const digitalizados = relatorios.filter(r => r.tipo === "digitalizado");

  return (
    <>
      <PageHeader icon={FileDown} title="Relatórios" description="Relatórios digitais e documentos digitalizados" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{relatorios.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Monitor className="w-5 h-5 text-primary" /></div>
          <p className="text-2xl font-bold font-display text-primary">{digitais.length}</p>
          <p className="text-xs text-muted-foreground">Digitais</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><ScanLine className="w-5 h-5 text-accent" /></div>
          <p className="text-2xl font-bold font-display text-accent">{digitalizados.length}</p>
          <p className="text-xs text-muted-foreground">Digitalizados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{relatorios.filter(r => r.status === "arquivado").length}</p>
          <p className="text-xs text-muted-foreground">Arquivados</p>
        </CardContent></Card>
      </div>

      {/* Info sobre tipos */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Monitor className="w-8 h-8 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Relatórios Digitais</h3>
                <p className="text-xs text-muted-foreground mt-1">Para empresas médias e maiores com dispositivo eletrônico de registro. Dados gerados diretamente no sistema.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <ScanLine className="w-8 h-8 text-accent mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Documentos Digitalizados</h3>
                <p className="text-xs text-muted-foreground mt-1">Para empresas menores com planilha em papel. Documentos preenchidos, assinados e escaneados/fotografados.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Relatórios</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Relatório</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Adicionar Relatório</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do relatório" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v: "digital" | "digitalizado") => setTipo(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital">📊 Digital</SelectItem>
                        <SelectItem value="digitalizado">📄 Digitalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Módulo</Label>
                    <Select value={modulo} onValueChange={setModulo}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {MODULOS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do relatório..." />
                </div>
                {tipo === "digitalizado" && (
                  <div>
                    <Label>Arquivo digitalizado (PDF, foto)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setArquivo(e.target.files?.[0] || null)} />
                      <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Planilha preenchida em papel, assinada e escaneada/fotografada</p>
                  </div>
                )}
                <Button onClick={handleAdd} className="w-full">Salvar Relatório</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos">
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos ({relatorios.length})</TabsTrigger>
              <TabsTrigger value="digitais">Digitais ({digitais.length})</TabsTrigger>
              <TabsTrigger value="digitalizados">Digitalizados ({digitalizados.length})</TabsTrigger>
            </TabsList>
            {["todos", "digitais", "digitalizados"].map(tab => (
              <TabsContent key={tab} value={tab} className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tab === "todos" ? relatorios : tab === "digitais" ? digitais : digitalizados).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">{r.dataGeracao}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{r.titulo}</p>
                          <p className="text-xs text-muted-foreground">{r.descricao}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={r.tipo === "digital" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}>
                            {r.tipo === "digital" ? "Digital" : "Digitalizado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.modulo}</TableCell>
                        <TableCell>
                          {r.arquivoNome ? (
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                              <Eye className="w-3 h-3" /> {r.arquivoNome}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "ativo" ? "default" : "secondary"}>
                            {r.status === "ativo" ? "Ativo" : "Arquivado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
