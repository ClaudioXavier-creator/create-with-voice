import { useState, useMemo } from "react";
import { ShieldCheck, Save, AlertTriangle, CheckCircle2, FileWarning } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import {
  TF_AUTOCONTROLES,
  TFRespostaDetalhe,
  TFResposta,
  calcularResumoTF,
} from "@/config/tfAutocontroles";

import FileUpload from "@/components/FileUpload";

export default function SimuladorTFAutocontroles() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [respostas, setRespostas] = useState<Record<string, TFRespostaDetalhe>>({});
  const [saving, setSaving] = useState(false);
  const [planoAcaoAnteriorUrl, setPlanoAcaoAnteriorUrl] = useState<string>("");

  const resumo = useMemo(() => calcularResumoTF(respostas), [respostas]);

  const setResposta = (id: string, status: TFResposta) =>
    setRespostas((p) => ({ ...p, [id]: { ...p[id], status } }));

  const setObs = (id: string, observacao: string) =>
    setRespostas((p) => ({ ...p, [id]: { status: p[id]?.status ?? "NA", observacao } }));

  const handleSalvar = async (status: "rascunho" | "finalizado") => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: sess, error } = await (supabase.from("tf_autocontroles_sessoes" as any) as any)
        .insert({
          user_id: user.id,
          empresa_id: empresaAtiva?.id ?? null,
          respostas,
          status,
          score_pct: resumo.scorePct,
          total_nc: resumo.ncs,
          total_nc_obrigatorios: resumo.ncObrigatorios,
          plano_acao_anterior_url: planoAcaoAnteriorUrl || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Gera NCs automáticas no módulo de Não Conformidades para itens marcados NC
      if (status === "finalizado") {
        const ncsParaCriar = TF_AUTOCONTROLES.flatMap((m) =>
          m.itens
            .filter((it) => respostas[it.id]?.status === "NC")
            .map((it) => ({
              user_id: user.id,
              empresa_id: empresaAtiva?.id ?? null,
              data: new Date().toISOString().slice(0, 10),
              setor: `TF-Autocontroles / ${m.titulo}`,
              descricao:
                respostas[it.id]?.observacao ||
                `[${it.id}${it.obrigatorio ? " · OBRIGATÓRIO" : ""}${it.riscoRegulatorio ? " · RR" : ""}] ${it.texto}`,
              status: "pendente",
            }))
        );
        if (ncsParaCriar.length > 0) {
          await (supabase.from("nao_conformidades" as any) as any).insert(ncsParaCriar);
        }
      }

      toast.success(
        status === "finalizado"
          ? `Simulação finalizada! ${resumo.ncs} NC(s) geradas no módulo.`
          : "Rascunho salvo."
      );
      if (sess && status === "finalizado") setRespostas({});
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e?.message ?? "desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Simulador TF-Autocontroles (MAPA/DIPOA v3.0)"
        description="Espelho do Termo de Fiscalização baseado em Autocontroles aplicado pelo AFFA. Marque C / NC / NA por item. Itens (O) são Obrigatórios e (RR) impactam Risco Regulatório."
      />

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Prontidão</div><div className="text-2xl font-bold text-primary">{resumo.scorePct}%</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Conformes</div><div className="text-2xl font-bold text-green-600">{resumo.conformes}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Não Conformes</div><div className="text-2xl font-bold text-destructive">{resumo.ncs}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">NC Obrigatórios (O)</div><div className="text-2xl font-bold text-orange-600">{resumo.ncObrigatorios}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">NC Risco Reg. (RR)</div><div className="text-2xl font-bold text-red-700">{resumo.ncRR}</div></CardContent></Card>
      </div>

      {resumo.ncObrigatorios > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção — Itens Obrigatórios em Não Conformidade</AlertTitle>
          <AlertDescription>
            {resumo.ncObrigatorios} item(ns) obrigatório(s) marcado(s) como NC. Em fiscalização real, isso pode disparar
            medida cautelar (suspensão, apreensão, intimação).
          </AlertDescription>
        </Alert>
      )}

      {/* Acordeão de módulos */}
      <Accordion type="multiple" className="space-y-2">
        {TF_AUTOCONTROLES.map((mod) => (
          <AccordionItem key={mod.codigo} value={mod.codigo} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4">
              <span className="text-left font-semibold">{mod.titulo}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {mod.itens.map((item) => {
                const r = respostas[item.id];
                return (
                  <div key={item.id} className="border-l-2 pl-3 py-2 space-y-2"
                       style={{ borderColor: item.obrigatorio ? "hsl(var(--destructive))" : "hsl(var(--border))" }}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                      {item.obrigatorio && <Badge variant="destructive" className="text-[10px]">O</Badge>}
                      {item.riscoRegulatorio && <Badge className="bg-orange-600 text-white text-[10px]">RR</Badge>}
                      <span className="text-sm flex-1">{item.texto}</span>
                    </div>
                    <div className="flex gap-2">
                      {(["C", "NC", "NA"] as TFResposta[]).map((opt) => (
                        <Button
                          key={opt}
                          size="sm"
                          variant={r?.status === opt ? "default" : "outline"}
                          className={r?.status === opt
                            ? opt === "C" ? "bg-green-600 hover:bg-green-700"
                              : opt === "NC" ? "bg-destructive hover:bg-destructive/90"
                              : "bg-muted-foreground hover:bg-muted-foreground/90"
                            : ""}
                          onClick={() => setResposta(item.id, opt)}
                        >
                          {opt === "C" ? <><CheckCircle2 className="w-3 h-3 mr-1" />Conforme</>
                            : opt === "NC" ? <><FileWarning className="w-3 h-3 mr-1" />Não Conforme</>
                            : "Não Aplicável"}
                        </Button>
                      ))}
                    </div>
                    {r?.status === "NC" && item.sugestoesNC && item.sugestoesNC.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.sugestoesNC.map((s, i) => (
                          <Button key={i} size="sm" variant="ghost" className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                                  onClick={() => setObs(item.id, s)}>
                            + {s.slice(0, 60)}{s.length > 60 ? "..." : ""}
                          </Button>
                        ))}
                      </div>
                    )}
                    {(r?.status === "NC" || r?.status === "NA") && (
                      <Textarea
                        placeholder={r.status === "NC" ? "Descreva a não conformidade observada..." : "Justifique a não aplicabilidade..."}
                        value={r.observacao ?? ""}
                        onChange={(e) => setObs(item.id, e.target.value)}
                        className="text-xs"
                        rows={2}
                      />
                    )}
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex gap-3 mt-6 sticky bottom-4 bg-background p-3 border rounded-lg shadow-lg">
        <Button variant="outline" onClick={() => handleSalvar("rascunho")} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
        </Button>
        <Button onClick={() => handleSalvar("finalizado")} disabled={saving || resumo.ncs + resumo.conformes === 0}>
          <ShieldCheck className="w-4 h-4 mr-2" /> Finalizar e Gerar NCs ({resumo.ncs})
        </Button>
      </div>
    </>
  );
}
