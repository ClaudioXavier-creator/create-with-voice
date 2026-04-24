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
  const [pdfText, setPdfText] = useState("");
  const [pdfNome, setPdfNome] = useState("");
  const [criandoNC, setCriandoNC] = useState(false);

  const handlePdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF.");
      return;
    }
    setPdfNome(file.name);
    try {
      // Extração simples no cliente via pdf.js (lazy load)
      const pdfjsLib: any = await import("pdfjs-dist/build/pdf.mjs");
      const workerSrc = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(" ") + "\n";
      }
      setPdfText(text);
      toast.success(`PDF lido (${pdf.numPages} pág.)`);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível ler o PDF. Você pode prosseguir só com os campos.");
    }
  };

  const analisar = async () => {
    setLoading(true);
    setParecer(null);
    try {
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
          pdf_text: pdfText || undefined,
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
