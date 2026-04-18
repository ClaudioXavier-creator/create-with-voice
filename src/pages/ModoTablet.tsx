import { useState } from "react";
import { Factory, Package, ClipboardCheck, Droplets, AlertTriangle, CheckCircle2, ArrowLeft, Play, Settings, Bug } from "lucide-react";
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

type Tela = "menu" | "producao" | "recebimento" | "limpeza" | "nc" | "pragas";

const MENU_ITEMS = [
  { id: "producao" as Tela, label: "Registrar Produção", icon: Factory, color: "bg-blue-500" },
  { id: "recebimento" as Tela, label: "Recebimento MP", icon: Package, color: "bg-emerald-500" },
  { id: "limpeza" as Tela, label: "Registro Limpeza", icon: Droplets, color: "bg-cyan-500" },
  { id: "pragas" as Tela, label: "Observação de Pragas", icon: Bug, color: "bg-amber-600" },
  { id: "nc" as Tela, label: "Registrar NC", icon: AlertTriangle, color: "bg-red-500" },
];

export default function ModoTablet() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [tela, setTela] = useState<Tela>("menu");
  const [saving, setSaving] = useState(false);

  // Produção
  const [prodProduto, setProdProduto] = useState("");
  const [prodLote, setProdLote] = useState("");
  const [prodOperador, setProdOperador] = useState("");
  const [prodQuantidade, setProdQuantidade] = useState("");

  // Recebimento
  const [recFornecedor, setRecFornecedor] = useState("");
  const [recMP, setRecMP] = useState("");
  const [recLote, setRecLote] = useState("");
  const [recOdor, setRecOdor] = useState("normal");
  const [recInsetos, setRecInsetos] = useState("ausente");
  const [recAprovado, setRecAprovado] = useState(true);

  // Limpeza
  const [limpExecutor, setLimpExecutor] = useState("");
  const [limpConforme, setLimpConforme] = useState(true);
  const [limpObs, setLimpObs] = useState("");

  // NC
  const [ncSetor, setNcSetor] = useState("");
  const [ncDescricao, setNcDescricao] = useState("");

  // Pragas — observação chão de fábrica (POP 7.3)
  const [pragaLocal, setPragaLocal] = useState("");
  const [pragaTipos, setPragaTipos] = useState({ roedores: false, aves: false, voadores: false, rasteiros: false, outros: false });
  const [pragaAcao, setPragaAcao] = useState("");
  const [pragaResp, setPragaResp] = useState("");

  const resetAll = () => {
    setProdProduto(""); setProdLote(""); setProdOperador(""); setProdQuantidade("");
    setRecFornecedor(""); setRecMP(""); setRecLote(""); setRecOdor("normal"); setRecInsetos("ausente"); setRecAprovado(true);
    setLimpExecutor(""); setLimpConforme(true); setLimpObs("");
    setNcSetor(""); setNcDescricao("");
    setPragaLocal(""); setPragaTipos({ roedores: false, aves: false, voadores: false, rasteiros: false, outros: false }); setPragaAcao(""); setPragaResp("");
  };

  const salvarProducao = async () => {
    if (!user || !prodProduto) return;
    setSaving(true);
    const { error } = await supabase.from("producao").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      produto: prodProduto, lote: prodLote, operador: prodOperador, quantidade: prodQuantidade,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Produção registrada!" });
    resetAll(); setTela("menu");
  };

  const salvarRecebimento = async () => {
    if (!user || !recFornecedor || !recMP) return;
    setSaving(true);
    const { error } = await supabase.from("recebimento_mp").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      fornecedor: recFornecedor, materia_prima: recMP, lote: recLote,
      odor: recOdor, insetos: recInsetos, aprovado: recAprovado,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Recebimento registrado!" });
    resetAll(); setTela("menu");
  };

  const salvarLimpeza = async () => {
    if (!user || !limpExecutor) return;
    setSaving(true);
    const { error } = await supabase.from("registros_limpeza").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      executor: limpExecutor, conforme: limpConforme, observacoes: limpObs,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Limpeza registrada!" });
    resetAll(); setTela("menu");
  };

  const salvarNC = async () => {
    if (!user || !ncSetor || !ncDescricao) return;
    setSaving(true);
    const { error } = await supabase.from("nao_conformidades").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      setor: ncSetor, descricao: ncDescricao,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ NC registrada!" });
    resetAll(); setTela("menu");
  };

  const salvarPraga = async () => {
    if (!user || !pragaLocal) return;
    const tipos: string[] = [];
    if (pragaTipos.roedores) tipos.push("Roedores");
    if (pragaTipos.aves) tipos.push("Aves/Pássaros");
    if (pragaTipos.voadores) tipos.push("Insetos voadores");
    if (pragaTipos.rasteiros) tipos.push("Insetos rasteiros");
    if (pragaTipos.outros) tipos.push("Outros");
    if (tipos.length === 0) {
      toast({ title: "Selecione ao menos um tipo de evidência", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("controle_pragas").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      data: new Date().toISOString().split("T")[0],
      local: pragaLocal,
      tipo_praga: tipos.join(", "),
      acao: pragaAcao || "Inspeção / observação visual",
      responsavel: pragaResp,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Observação registrada!", description: "Comunique o RT para investigação." });
    resetAll(); setTela("menu");
  };

  if (tela === "menu") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <Factory className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-display">Modo Chão de Fábrica</h1>
          <p className="text-muted-foreground mt-1">Selecione a operação para registrar</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTela(item.id)}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all active:scale-95 min-h-[140px]"
            >
              <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-center">{item.label}</span>
            </button>
          ))}
        </div>

        <Link to="/dashboard" className="mt-8">
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" /> Voltar ao Painel Completo
          </Button>
        </Link>
      </div>
    );
  }

  const Voltar = () => (
    <Button variant="ghost" onClick={() => { resetAll(); setTela("menu"); }} className="mb-4">
      <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
    </Button>
  );

  if (tela === "producao") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Factory className="w-6 h-6 text-blue-500" /> Registrar Produção</h2>
            <div><Label className="text-base">Produto *</Label><Input value={prodProduto} onChange={e => setProdProduto(e.target.value)} className="text-lg h-12 mt-1" placeholder="Nome do produto" /></div>
            <div><Label className="text-base">Lote</Label><Input value={prodLote} onChange={e => setProdLote(e.target.value)} className="text-lg h-12 mt-1" placeholder="Nº do lote" /></div>
            <div><Label className="text-base">Operador</Label><Input value={prodOperador} onChange={e => setProdOperador(e.target.value)} className="text-lg h-12 mt-1" placeholder="Nome do operador" /></div>
            <div><Label className="text-base">Quantidade (kg)</Label><Input value={prodQuantidade} onChange={e => setProdQuantidade(e.target.value)} className="text-lg h-12 mt-1" placeholder="0" type="number" /></div>
            <Button onClick={salvarProducao} disabled={saving || !prodProduto} className="w-full h-14 text-lg" size="lg">
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
        <Voltar />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-emerald-500" /> Recebimento MP</h2>
            <div><Label className="text-base">Fornecedor *</Label><Input value={recFornecedor} onChange={e => setRecFornecedor(e.target.value)} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Matéria-Prima *</Label><Input value={recMP} onChange={e => setRecMP(e.target.value)} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Lote</Label><Input value={recLote} onChange={e => setRecLote(e.target.value)} className="text-lg h-12 mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Odor</Label>
                <Select value={recOdor} onValueChange={setRecOdor}>
                  <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="anormal">Anormal</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base">Insetos</Label>
                <Select value={recInsetos} onValueChange={setRecInsetos}>
                  <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ausente">Ausente</SelectItem><SelectItem value="presente">Presente</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Checkbox checked={recAprovado} onCheckedChange={(c) => setRecAprovado(!!c)} id="aprovado" />
              <Label htmlFor="aprovado" className="text-base font-medium cursor-pointer">Material Aprovado</Label>
            </div>
            <Button onClick={salvarRecebimento} disabled={saving || !recFornecedor || !recMP} className="w-full h-14 text-lg" size="lg">
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
        <Voltar />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Droplets className="w-6 h-6 text-cyan-500" /> Registro de Limpeza</h2>
            <div><Label className="text-base">Executor *</Label><Input value={limpExecutor} onChange={e => setLimpExecutor(e.target.value)} className="text-lg h-12 mt-1" placeholder="Nome de quem executou" /></div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Checkbox checked={limpConforme} onCheckedChange={(c) => setLimpConforme(!!c)} id="conforme" />
              <Label htmlFor="conforme" className="text-base font-medium cursor-pointer">Limpeza Conforme</Label>
            </div>
            <div><Label className="text-base">Observações</Label><Textarea value={limpObs} onChange={e => setLimpObs(e.target.value)} className="text-base mt-1" rows={3} /></div>
            <Button onClick={salvarLimpeza} disabled={saving || !limpExecutor} className="w-full h-14 text-lg" size="lg">
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
        <Voltar />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500" /> Registrar NC</h2>
            <div><Label className="text-base">Setor *</Label><Input value={ncSetor} onChange={e => setNcSetor(e.target.value)} className="text-lg h-12 mt-1" placeholder="Ex: Mistura, Envase..." /></div>
            <div><Label className="text-base">Descrição *</Label><Textarea value={ncDescricao} onChange={e => setNcDescricao(e.target.value)} className="text-base mt-1" rows={4} placeholder="Descreva a não conformidade encontrada..." /></div>
            <Button onClick={salvarNC} disabled={saving || !ncSetor || !ncDescricao} className="w-full h-14 text-lg" size="lg" variant="destructive">
              <AlertTriangle className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : "Registrar NC"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
