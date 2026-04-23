import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Factory,
  Lock,
  Package,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { RegistroPopGenerico } from "@/components/tablet/RegistroPopGenerico";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";
import { useSessionDraft } from "@/hooks/useSessionDraft";

type Tela = "menu" | "producao" | "recebimento" | "limpeza" | "nc" | "pragas" | "pop_generico";

const MENU_ITEMS = [
  { id: "producao" as Tela, label: "Registrar Produção", icon: Factory, tone: "bg-primary text-primary-foreground" },
  { id: "recebimento" as Tela, label: "Recebimento MP", icon: Package, tone: "bg-secondary text-secondary-foreground" },
  { id: "limpeza" as Tela, label: "Registro Limpeza", icon: Droplets, tone: "bg-accent text-accent-foreground" },
  { id: "pragas" as Tela, label: "Observação de Pragas", icon: Bug, tone: "bg-muted text-foreground" },
  { id: "nc" as Tela, label: "Registrar NC", icon: ShieldAlert, tone: "bg-destructive text-destructive-foreground" },
  { id: "pop_generico" as Tela, label: "Executar POP / IT", icon: ShieldCheck, tone: "bg-primary text-primary-foreground" },
];

type ProducaoDraft = {
  produto: string;
  lote: string;
  operador: string;
  quantidade: string;
};

type RecebimentoDraft = {
  fornecedor: string;
  materiaPrima: string;
  lote: string;
  odor: string;
  insetos: string;
  aprovado: boolean;
};

type LimpezaDraft = {
  executor: string;
  conforme: boolean;
  observacoes: string;
};

type NaoConformidadeDraft = {
  setor: string;
  descricao: string;
};

type PragaDraft = {
  local: string;
  tipos: {
    roedores: boolean;
    aves: boolean;
    voadores: boolean;
    rasteiros: boolean;
    outros: boolean;
  };
  acao: string;
  responsavel: string;
};

const INITIAL_PRODUCAO: ProducaoDraft = { produto: "", lote: "", operador: "", quantidade: "" };
const INITIAL_RECEBIMENTO: RecebimentoDraft = {
  fornecedor: "",
  materiaPrima: "",
  lote: "",
  odor: "normal",
  insetos: "ausente",
  aprovado: true,
};
const INITIAL_LIMPEZA: LimpezaDraft = { executor: "", conforme: true, observacoes: "" };
const INITIAL_NC: NaoConformidadeDraft = { setor: "", descricao: "" };
const INITIAL_PRAGA: PragaDraft = {
  local: "",
  tipos: { roedores: false, aves: false, voadores: false, rasteiros: false, outros: false },
  acao: "",
  responsavel: "",
};

export default function ModoTablet() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [tela, setTela] = useState<Tela>("menu");
  const [saving, setSaving] = useState(false);
  const empresaKey = empresaAtiva?.id ?? "sem-empresa";

  const [producaoDraft, setProducaoDraft, clearProducaoDraft] = useSessionDraft(`tablet_producao_${empresaKey}`, INITIAL_PRODUCAO);
  const [recebimentoDraft, setRecebimentoDraft, clearRecebimentoDraft] = useSessionDraft(`tablet_recebimento_${empresaKey}`, INITIAL_RECEBIMENTO);
  const [limpezaDraft, setLimpezaDraft, clearLimpezaDraft] = useSessionDraft(`tablet_limpeza_${empresaKey}`, INITIAL_LIMPEZA);
  const [ncDraft, setNcDraft, clearNcDraft] = useSessionDraft(`tablet_nc_${empresaKey}`, INITIAL_NC);
  const [pragaDraft, setPragaDraft, clearPragaDraft] = useSessionDraft(`tablet_pragas_${empresaKey}`, INITIAL_PRAGA);

  const temConexao = typeof navigator === "undefined" ? true : navigator.onLine;

  const draftStatus = useMemo<Record<Exclude<Tela, "menu" | "pop_generico">, boolean>>(
    () => ({
      producao: Boolean(producaoDraft.produto || producaoDraft.lote || producaoDraft.operador || producaoDraft.quantidade),
      recebimento: Boolean(recebimentoDraft.fornecedor || recebimentoDraft.materiaPrima || recebimentoDraft.lote),
      limpeza: Boolean(limpezaDraft.executor || limpezaDraft.observacoes),
      nc: Boolean(ncDraft.setor || ncDraft.descricao),
      pragas: Boolean(pragaDraft.local || pragaDraft.acao || pragaDraft.responsavel || Object.values(pragaDraft.tipos).some(Boolean)),
    }),
    [limpezaDraft.executor, limpezaDraft.observacoes, ncDraft.descricao, ncDraft.setor, pragaDraft.acao, pragaDraft.local, pragaDraft.responsavel, pragaDraft.tipos, producaoDraft.lote, producaoDraft.operador, producaoDraft.produto, producaoDraft.quantidade, recebimentoDraft.fornecedor, recebimentoDraft.lote, recebimentoDraft.materiaPrima]
  );

  const primeiroRascunho = useMemo(
    () => MENU_ITEMS.find((item) => item.id !== "pop_generico" && item.id !== "menu" && draftStatus[item.id as Exclude<Tela, "menu" | "pop_generico">]),
    [draftStatus]
  );

  const requireContext = () => {
    if (!user) {
      toast({ title: "Faça login para registrar", variant: "destructive" });
      return false;
    }
    if (!empresaAtiva?.id) {
      toast({ title: "Selecione uma empresa ativa", variant: "destructive" });
      return false;
    }
    return true;
  };

  const salvarProducao = async () => {
    if (!requireContext() || !producaoDraft.produto) return;
    setSaving(true);
    const { error } = await supabase.from("producao").insert({
      user_id: user!.id, empresa_id: empresaAtiva!.id,
      produto: producaoDraft.produto, lote: producaoDraft.lote, operador: producaoDraft.operador, quantidade: producaoDraft.quantidade,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Produção registrada!" });
    setProducaoDraft(INITIAL_PRODUCAO);
    clearProducaoDraft();
    setTela("menu");
  };

  const salvarRecebimento = async () => {
    if (!requireContext() || !recebimentoDraft.fornecedor || !recebimentoDraft.materiaPrima) return;
    setSaving(true);
    const { error } = await supabase.from("recebimento_mp").insert({
      user_id: user!.id, empresa_id: empresaAtiva!.id,
      fornecedor: recebimentoDraft.fornecedor, materia_prima: recebimentoDraft.materiaPrima, lote: recebimentoDraft.lote,
      odor: recebimentoDraft.odor, insetos: recebimentoDraft.insetos, aprovado: recebimentoDraft.aprovado,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Recebimento registrado!" });
    setRecebimentoDraft(INITIAL_RECEBIMENTO);
    clearRecebimentoDraft();
    setTela("menu");
  };

  const salvarLimpeza = async () => {
    if (!requireContext() || !limpezaDraft.executor) return;
    setSaving(true);
    const { error } = await supabase.from("registros_limpeza").insert({
      user_id: user!.id, empresa_id: empresaAtiva!.id,
      executor: limpezaDraft.executor, conforme: limpezaDraft.conforme, observacoes: limpezaDraft.observacoes,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Limpeza registrada!" });
    setLimpezaDraft(INITIAL_LIMPEZA);
    clearLimpezaDraft();
    setTela("menu");
  };

  const salvarNC = async () => {
    if (!requireContext() || !ncDraft.setor || !ncDraft.descricao) return;
    setSaving(true);
    const { error } = await supabase.from("nao_conformidades").insert({
      user_id: user!.id, empresa_id: empresaAtiva!.id,
      setor: ncDraft.setor, descricao: ncDraft.descricao,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ NC registrada!" });
    setNcDraft(INITIAL_NC);
    clearNcDraft();
    setTela("menu");
  };

  const salvarPraga = async () => {
    if (!requireContext() || !pragaDraft.local || !pragaDraft.responsavel) return;
    const tipos: string[] = [];
    if (pragaDraft.tipos.roedores) tipos.push("Roedores");
    if (pragaDraft.tipos.aves) tipos.push("Aves/Pássaros");
    if (pragaDraft.tipos.voadores) tipos.push("Insetos voadores");
    if (pragaDraft.tipos.rasteiros) tipos.push("Insetos rasteiros");
    if (pragaDraft.tipos.outros) tipos.push("Outros");
    if (tipos.length === 0) {
      toast({ title: "Selecione ao menos um tipo de evidência", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("controle_pragas").insert({
      user_id: user!.id, empresa_id: empresaAtiva!.id,
      data: new Date().toISOString().split("T")[0],
      local: pragaDraft.local,
      tipo_praga: tipos.join(", "),
      acao: pragaDraft.acao || "Inspeção / observação visual",
      responsavel: pragaDraft.responsavel,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Observação registrada!", description: "Comunique o RT para investigação." });
    setPragaDraft(INITIAL_PRAGA);
    clearPragaDraft();
    setTela("menu");
  };

  const Voltar = ({ onClearDraft }: { onClearDraft?: () => void }) => (
    <div className="mb-4 flex items-center justify-between gap-2">
      <Button variant="ghost" onClick={() => setTela("menu")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>
      {onClearDraft ? (
        <Button variant="outline" size="sm" onClick={onClearDraft}>
          <RotateCcw className="w-4 h-4 mr-2" /> Limpar rascunho
        </Button>
      ) : null}
    </div>
  );

  const CardHeader = ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Factory }) => (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium text-foreground">Empresa ativa</p>
        <p className="text-muted-foreground mt-1">{empresaAtiva?.nome || "Selecione uma empresa antes de registrar."}</p>
      </div>
    </div>
  );

  if (tela === "menu") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <Factory className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-display">Modo Chão de Fábrica</h1>
          <p className="text-muted-foreground mt-1">Selecione a operação para registrar</p>
          <p className="text-sm text-foreground mt-3">{empresaAtiva?.nome || "Nenhuma empresa ativa selecionada"}</p>
        </div>

        {!temConexao ? (
          <div className="mb-4 w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <p className="font-medium flex items-center gap-2"><WifiOff className="w-4 h-4" /> Sem conexão no momento</p>
            <p className="mt-1 text-muted-foreground">Os rascunhos ficam salvos neste aparelho até a conexão voltar.</p>
          </div>
        ) : null}

        {primeiroRascunho ? (
          <div className="mb-4 w-full max-w-md rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Rascunho disponível</p>
                <p className="text-sm text-muted-foreground mt-1">Continue o último lançamento em andamento sem perder o que já foi digitado.</p>
              </div>
              <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
            </div>
            <Button className="w-full mt-3" onClick={() => setTela(primeiroRascunho.id)}>
              Continuar {primeiroRascunho.label}
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTela(item.id)}
              className="relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all active:scale-95 min-h-[140px]"
            >
              {item.id !== "pop_generico" && item.id !== "menu" && draftStatus[item.id as Exclude<Tela, "menu" | "pop_generico">] ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                  Rascunho
                </span>
              ) : null}
              <div className={`w-14 h-14 rounded-lg ${item.tone} flex items-center justify-center`}>
                <item.icon className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-center">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <Link to="/configurar-pin">
            <Button variant="outline" size="sm">
              <Lock className="w-4 h-4 mr-2" /> Configurar PIN da Empresa
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Voltar ao Painel Completo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (tela === "pop_generico") {
    return <RegistroPopGenerico onVoltar={() => setTela("menu")} />;
  }

  if (tela === "producao") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setProducaoDraft(INITIAL_PRODUCAO); clearProducaoDraft(); }} />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registrar Produção" subtitle="Lançamento rápido do lote produzido." icon={Factory} />
            <div><Label className="text-base">Produto *</Label><Input value={producaoDraft.produto} onChange={e => setProducaoDraft({ ...producaoDraft, produto: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nome do produto" /></div>
            <div><Label className="text-base">Lote</Label><Input value={producaoDraft.lote} onChange={e => setProducaoDraft({ ...producaoDraft, lote: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nº do lote" /></div>
            <div><Label className="text-base">Operador</Label><Input value={producaoDraft.operador} onChange={e => setProducaoDraft({ ...producaoDraft, operador: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nome do operador" /></div>
            <div><Label className="text-base">Quantidade (kg)</Label><Input value={producaoDraft.quantidade} onChange={e => setProducaoDraft({ ...producaoDraft, quantidade: e.target.value })} className="text-lg h-12 mt-1" placeholder="0" type="number" inputMode="decimal" /></div>
            <Button onClick={salvarProducao} disabled={saving || !producaoDraft.produto} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : "Salvar Produção"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "recebimento") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setRecebimentoDraft(INITIAL_RECEBIMENTO); clearRecebimentoDraft(); }} />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Recebimento MP" subtitle="Inspeção rápida de matéria-prima na chegada." icon={Package} />
            <div><Label className="text-base">Fornecedor *</Label><Input value={recebimentoDraft.fornecedor} onChange={e => setRecebimentoDraft({ ...recebimentoDraft, fornecedor: e.target.value })} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Matéria-Prima *</Label><Input value={recebimentoDraft.materiaPrima} onChange={e => setRecebimentoDraft({ ...recebimentoDraft, materiaPrima: e.target.value })} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Lote</Label><Input value={recebimentoDraft.lote} onChange={e => setRecebimentoDraft({ ...recebimentoDraft, lote: e.target.value })} className="text-lg h-12 mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Odor</Label>
                <Select value={recebimentoDraft.odor} onValueChange={(value) => setRecebimentoDraft({ ...recebimentoDraft, odor: value })}>
                  <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="anormal">Anormal</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base">Insetos</Label>
                <Select value={recebimentoDraft.insetos} onValueChange={(value) => setRecebimentoDraft({ ...recebimentoDraft, insetos: value })}>
                  <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ausente">Ausente</SelectItem><SelectItem value="presente">Presente</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Checkbox checked={recebimentoDraft.aprovado} onCheckedChange={(c) => setRecebimentoDraft({ ...recebimentoDraft, aprovado: !!c })} id="aprovado" />
              <Label htmlFor="aprovado" className="text-base font-medium cursor-pointer">Material Aprovado</Label>
            </div>
            <Button onClick={salvarRecebimento} disabled={saving || !recebimentoDraft.fornecedor || !recebimentoDraft.materiaPrima} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : "Salvar Recebimento"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "limpeza") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setLimpezaDraft(INITIAL_LIMPEZA); clearLimpezaDraft(); }} />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registro de Limpeza" subtitle="Confirmação operacional ao final da higienização." icon={Droplets} />
            <div><Label className="text-base">Executor *</Label><Input value={limpezaDraft.executor} onChange={e => setLimpezaDraft({ ...limpezaDraft, executor: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nome de quem executou" /></div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Checkbox checked={limpezaDraft.conforme} onCheckedChange={(c) => setLimpezaDraft({ ...limpezaDraft, conforme: !!c })} id="conforme" />
              <Label htmlFor="conforme" className="text-base font-medium cursor-pointer">Limpeza Conforme</Label>
            </div>
            <div><Label className="text-base">Observações</Label><Textarea value={limpezaDraft.observacoes} onChange={e => setLimpezaDraft({ ...limpezaDraft, observacoes: e.target.value })} className="text-base mt-1" rows={3} /></div>
            <Button onClick={salvarLimpeza} disabled={saving || !limpezaDraft.executor} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : "Salvar Limpeza"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "nc") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setNcDraft(INITIAL_NC); clearNcDraft(); }} />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registrar NC" subtitle="Notifique o desvio assim que ele for identificado." icon={ShieldAlert} />
            <div><Label className="text-base">Setor *</Label><Input value={ncDraft.setor} onChange={e => setNcDraft({ ...ncDraft, setor: e.target.value })} className="text-lg h-12 mt-1" placeholder="Ex: Mistura, Envase..." /></div>
            <div><Label className="text-base">Descrição *</Label><Textarea value={ncDraft.descricao} onChange={e => setNcDraft({ ...ncDraft, descricao: e.target.value })} className="text-base mt-1" rows={4} placeholder="Descreva a não conformidade encontrada..." /></div>
            <Button onClick={salvarNC} disabled={saving || !ncDraft.setor || !ncDraft.descricao} className="w-full h-14 text-lg" size="lg" variant="destructive">
              <AlertTriangle className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : "Registrar NC"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "pragas") {
    const ToggleTipo = ({ k, label }: { k: keyof typeof pragaTipos; label: string }) => (
      <button
        type="button"
        onClick={() => setPragaDraft({ ...pragaDraft, tipos: { ...pragaDraft.tipos, [k]: !pragaDraft.tipos[k] } })}
        className={`flex items-center justify-between gap-2 p-4 rounded-xl border-2 text-left transition-all active:scale-95 min-h-[64px] ${
          pragaDraft.tipos[k] ? "border-primary bg-muted" : "border-border bg-card"
        }`}
      >
        <span className="text-base font-medium">{label}</span>
        <span className={`text-sm font-bold px-2 py-1 rounded ${pragaDraft.tipos[k] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {pragaDraft.tipos[k] ? "PRESENÇA" : "Sem evidência"}
        </span>
      </button>
    );
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setPragaDraft(INITIAL_PRAGA); clearPragaDraft(); }} />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Observação de Pragas" subtitle="Registro imediato de evidências no chão de fábrica." icon={Bug} />
            <p className="text-xs text-muted-foreground">POP 7.3 — Toque nos itens onde houver evidência (visual, fezes, ninhos, dejetos, vestígios).</p>
            <div>
              <Label className="text-base">Local / Área *</Label>
              <Input value={pragaDraft.local} onChange={e => setPragaDraft({ ...pragaDraft, local: e.target.value })} className="text-lg h-12 mt-1" placeholder="Ex: Depósito MP, Silo 2, Mistura..." />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <ToggleTipo k="roedores" label="🐀 Roedores" />
              <ToggleTipo k="aves" label="🐦 Aves / Pássaros" />
              <ToggleTipo k="voadores" label="🦟 Insetos voadores" />
              <ToggleTipo k="rasteiros" label="🪳 Insetos rasteiros" />
              <ToggleTipo k="outros" label="❓ Outros vestígios" />
            </div>
            <div>
              <Label className="text-base">Ação imediata</Label>
              <Input value={pragaDraft.acao} onChange={e => setPragaDraft({ ...pragaDraft, acao: e.target.value })} className="text-lg h-12 mt-1" placeholder="Ex: Limpeza, isca reposta, vedação..." />
            </div>
            <div>
              <Label className="text-base">Responsável *</Label>
              <Input value={pragaDraft.responsavel} onChange={e => setPragaDraft({ ...pragaDraft, responsavel: e.target.value })} className="text-lg h-12 mt-1" placeholder="Seu nome" />
            </div>
            <Button onClick={salvarPraga} disabled={saving || !pragaDraft.local || !pragaDraft.responsavel} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : "Salvar Observação"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
