import { useState } from "react";
import { Sparkles, Loader2, FileText, AlertTriangle, CheckCircle2, Upload, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { calcularTolerancia } from "@/config/desviosAnaliticos";

interface AnaliseRow {
  id: string;
  tipo_analise: string;
  produto: string;
  lote: string | null;
  parametro: string | null;
  resultado: string | null;
  unidade: string | null;
  limite_referencia: string | null;
  laboratorio: string | null;
  metodo: string | null;
  observacoes: string | null;
}

interface Parecer {
  conforme: boolean;
  conforme_legislacao: boolean;
  conforme_rotulo: "conforme" | "nao_conforme" | "nao_avaliado";
  dentro_tolerancia_analitica?: "sim" | "nao" | "nao_aplicavel";
  comparacao_rotulo: string;
  classificacao_risco: "baixo" | "medio" | "alto" | "critico";
  parecer_tecnico: string;
  causa_provavel: string;
  acoes_corretivas: string[];
  prazo_recomendado_dias: number;
  setor_responsavel: string;
  referencia_legal: string;
}

const RISCO_BADGE: Record<string, string> = {
  baixo: "bg-primary/20 text-primary",
  medio: "bg-yellow-500/20 text-yellow-700",
  alto: "bg-orange-500/20 text-orange-700",
  critico: "bg-destructive/20 text-destructive",
};

interface Props {
  analise: AnaliseRow;
  trigger?: React.ReactNode;
  onNCCriada?: () => void;
}

export default function AnaliseLaudoIA({ analise, trigger, onNCCriada }: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfNome, setPdfNome] = useState("");
  const [criandoNC, setCriandoNC] = useState(false);

  const handlePdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF muito grande (máx 10MB).");
      return;
    }
    setPdfNome(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // remove prefix data:application/pdf;base64,
      const b64 = result.split(",")[1] || "";
      setPdfBase64(b64);
      toast.success("PDF carregado");
    };
    reader.onerror = () => toast.error("Erro ao ler PDF");
    reader.readAsDataURL(file);
  };

  const analisar = async () => {
    setLoading(true);
    setParecer(null);
    try {
      // Busca o rótulo do produto analisado (match por nome, mesmo user/empresa)
      let rotulo: any = undefined;
      if (analise.produto && user) {
        let q = supabase
          .from("produtos")
          .select("nome, marca, classificacao, especie_alvo, categoria_animal, registro_mapa, niveis_garantia")
          .eq("user_id", user.id)
          .ilike("nome", analise.produto.trim())
          .limit(1);
        if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
        const { data: prod } = await q.maybeSingle();
        if (prod) rotulo = prod;
      }

      // Calcula tolerância CBAA 2017 (desvio analítico aceitável) localmente
      let tolerancia: any = undefined;
      const valorNum = parseFloat(String(analise.resultado || "").replace(",", "."));
      if (!isNaN(valorNum) && analise.parametro) {
        const tol = calcularTolerancia(analise.parametro, analise.unidade || undefined, valorNum);
        if (tol) {
          tolerancia = {
            cv_pct: Number(tol.cv_pct.toFixed(2)),
            tolerancia_absoluta: Number(tol.tolerancia_absoluta.toFixed(4)),
            faixa_min: Number(tol.faixa_min.toFixed(4)),
            faixa_max: Number(tol.faixa_max.toFixed(4)),
            unidade: analise.unidade,
            referencia: `CBAA 2017 — ${tol.desvio.nome}`,
            formula: tol.desvio.formula.tipo === "fixo"
              ? `CV fixo ${tol.desvio.formula.cv_pct}%`
              : `CV(%) = ${tol.desvio.formula.a}/X ${tol.desvio.formula.b >= 0 ? "+" : "-"} ${Math.abs(tol.desvio.formula.b)}`,
            intervalo_validacao: tol.desvio.intervalo,
            fora_intervalo_validacao: tol.fora_intervalo_validacao,
            obs: tol.desvio.obs,
          };
        }
      }

      const { data, error } = await supabase.functions.invoke("analisar-laudo-ia", {
        body: {
          tipo_analise: analise.tipo_analise,
          produto: analise.produto,
          lote: analise.lote,
          parametro: analise.parametro,
          resultado: analise.resultado,
          unidade: analise.unidade,
          limite_referencia: analise.limite_referencia,
          laboratorio: analise.laboratorio,
          metodo: analise.metodo,
          observacoes: analise.observacoes,
          pdf_base64: pdfBase64 || undefined,
          rotulo,
          tolerancia,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setParecer(data.parecer);
      toast.success("Parecer gerado!");
    } catch (e: any) {
      toast.error("Erro ao analisar: " + (e.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const criarNC = async () => {
    if (!parecer || !user) return;
    setCriandoNC(true);
    const prazoData = new Date();
    prazoData.setDate(prazoData.getDate() + (parecer.prazo_recomendado_dias || 7));
    const { error } = await supabase.from("nao_conformidades").insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      data: new Date().toISOString().split("T")[0],
      setor: parecer.setor_responsavel,
      descricao: `Laudo ${analise.parametro} — ${analise.produto} ${analise.lote ? `(lote ${analise.lote})` : ""}: resultado ${analise.resultado} ${analise.unidade || ""} (limite: ${analise.limite_referencia || "—"}). ${parecer.parecer_tecnico.slice(0, 300)}`,
      causa: parecer.causa_provavel,
      acao_corretiva: parecer.acoes_corretivas.map((a, i) => `${i + 1}. ${a}`).join("\n"),
      responsavel: "",
      prazo: prazoData.toISOString().split("T")[0],
      status: "aberta",
    } as any);
    if (error) {
      toast.error("Erro ao criar NC: " + error.message);
    } else {
      toast.success("Não conformidade criada!");
      onNCCriada?.();
      setOpen(false);
    }
    setCriandoNC(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="inline-flex">
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-1" /> Analisar com IA
          </Button>
        )}
      </div>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Análise IA do Laudo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium">{analise.produto} {analise.lote ? `— Lote ${analise.lote}` : ""}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analise.parametro}: <strong>{analise.resultado} {analise.unidade}</strong>
              {analise.limite_referencia && <span> (limite: {analise.limite_referencia})</span>}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <FileText className="w-3 h-3" /> PDF do laudo (opcional — melhora a análise)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && handlePdf(e.target.files[0])}
                className="text-xs"
              />
              {pdfNome && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  <Upload className="w-3 h-3 mr-1" /> {pdfNome.slice(0, 20)}
                </Badge>
              )}
            </div>
          </div>

          {!parecer && (
            <Button onClick={analisar} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {loading ? "Analisando..." : "Gerar Parecer Técnico"}
            </Button>
          )}

          {parecer && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2 flex-wrap">
                {parecer.conforme ? (
                  <Badge className="bg-primary/20 text-primary">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Conforme
                  </Badge>
                ) : (
                  <Badge className="bg-destructive/20 text-destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Não Conforme
                  </Badge>
                )}
                <Badge className={RISCO_BADGE[parecer.classificacao_risco]}>
                  Risco {parecer.classificacao_risco}
                </Badge>
                <Badge variant="outline" className="text-xs">{parecer.referencia_legal}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded border ${parecer.conforme_legislacao ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"}`}>
                  <p className="font-semibold mb-0.5">Legislação MAPA</p>
                  <p>{parecer.conforme_legislacao ? "✓ Conforme" : "✗ Não conforme"}</p>
                </div>
                <div className={`p-2 rounded border ${
                  parecer.conforme_rotulo === "conforme" ? "bg-primary/10 border-primary/30" :
                  parecer.conforme_rotulo === "nao_conforme" ? "bg-destructive/10 border-destructive/30" :
                  "bg-muted/50 border-border"
                }`}>
                  <p className="font-semibold mb-0.5">Rótulo declarado</p>
                  <p>
                    {parecer.conforme_rotulo === "conforme" && "✓ Dentro da garantia"}
                    {parecer.conforme_rotulo === "nao_conforme" && "✗ Fora da garantia"}
                    {parecer.conforme_rotulo === "nao_avaliado" && "— Não avaliado"}
                  </p>
                </div>
              </div>
              {parecer.dentro_tolerancia_analitica && parecer.dentro_tolerancia_analitica !== "nao_aplicavel" && (
                <div className={`p-2 rounded border text-xs ${
                  parecer.dentro_tolerancia_analitica === "sim"
                    ? "bg-primary/10 border-primary/30"
                    : "bg-orange-500/10 border-orange-500/30"
                }`}>
                  <p className="font-semibold">Tolerância analítica CBAA 2017</p>
                  <p>{parecer.dentro_tolerancia_analitica === "sim" ? "✓ Dentro do desvio aceitável" : "✗ Excede o desvio aceitável"}</p>
                </div>
              )}
              {parecer.comparacao_rotulo && (
                <p className="text-xs text-muted-foreground italic px-1">{parecer.comparacao_rotulo}</p>
              )}

              <div>
                <Label className="text-xs font-semibold">Parecer Técnico</Label>
                <Textarea readOnly value={parecer.parecer_tecnico} rows={6} className="text-sm mt-1" />
              </div>

              {!parecer.conforme && (
                <>
                  <div>
                    <Label className="text-xs font-semibold">Causa provável</Label>
                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{parecer.causa_provavel}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Ações corretivas sugeridas</Label>
                    <ul className="text-sm mt-1 space-y-1">
                      {parecer.acoes_corretivas.map((a, i) => (
                        <li key={i} className="flex gap-2 p-2 bg-muted/30 rounded">
                          <span className="font-mono text-xs text-primary">{i + 1}.</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span><strong>Setor:</strong> {parecer.setor_responsavel}</span>
                    <span>•</span>
                    <span><strong>Prazo sugerido:</strong> {parecer.prazo_recomendado_dias} dias</span>
                  </div>

                  <Button onClick={criarNC} disabled={criandoNC} className="w-full" variant="default">
                    {criandoNC ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FilePlus2 className="w-4 h-4 mr-1" />}
                    Registrar Não Conformidade
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={() => { setParecer(null); }} className="w-full">
                Refazer análise
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
