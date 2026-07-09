import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Onboarding automático por produto. Dispara no primeiro login.
 * Salva progresso em `onboarding_progresso` para não repetir.
 */
type Passo = { id: string; titulo: string; descricao: string; link?: string };

const PASSOS_POR_PRODUTO: Record<string, Passo[]> = {
  feed_bpf: [
    { id: "cadastro", titulo: "Cadastre sua empresa", descricao: "Complete os dados da fábrica em Cadastro.", link: "/cadastro" },
    { id: "produtos", titulo: "Cadastre 1 produto", descricao: "Registre pelo menos uma ração.", link: "/produtos" },
    { id: "pop", titulo: "Explore os 10 POPs", descricao: "Veja o guia dos procedimentos oficiais.", link: "/guia-pops" },
    { id: "docs", titulo: "Anexe 1 documento", descricao: "Digitalize um POP na área de Documentos.", link: "/documentos" },
    { id: "recall", titulo: "Simule um recall", descricao: "Teste a rastreabilidade do sistema.", link: "/simulacao-recall" },
  ],
  audits_bpf: [
    { id: "checklist", titulo: "Faça o Checklist Pré-Auditoria", descricao: "63 pontos MAPA.", link: "/auditsbpf" },
    { id: "nc", titulo: "Cadastre uma NC exemplo", descricao: "Aprenda o fluxo de correções." },
    { id: "risco", titulo: "Preencha 1 Matriz de Risco", descricao: "HACCP simplificado." },
  ],
  nutricrm: [
    { id: "cliente", titulo: "Cadastre 1 cliente", descricao: "Comece seu funil." },
    { id: "visita", titulo: "Registre uma visita", descricao: "Salve os dados no campo." },
    { id: "meta", titulo: "Defina uma meta mensal", descricao: "Acompanhe seu desempenho." },
  ],
};

export default function OnboardingAutomatico({ produto = "feed_bpf" }: { produto?: string }) {
  const { user } = useAuth();
  const [progresso, setProgresso] = useState<any>(null);
  const [aberto, setAberto] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  const passos = PASSOS_POR_PRODUTO[produto] ?? [];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("onboarding_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("produto", produto)
        .maybeSingle();

      if (!data) {
        // primeiro acesso: cria e abre
        const { data: novo } = await supabase.from("onboarding_progresso").insert({
          user_id: user.id,
          produto,
          passos_concluidos: [],
        }).select().single();
        setProgresso(novo);
        setAberto(true);
      } else {
        setProgresso(data);
        if (!data.checklist_completo && !localStorage.getItem(`onboarding_dismissed_${produto}`)) {
          setAberto(true);
        }
      }
    })();
  }, [user, produto]);

  const toggle = async (passoId: string) => {
    if (!progresso) return;
    const atuais: string[] = progresso.passos_concluidos ?? [];
    const novos = atuais.includes(passoId) ? atuais.filter((p) => p !== passoId) : [...atuais, passoId];
    const completo = novos.length === passos.length;
    const { data } = await supabase.from("onboarding_progresso").update({
      passos_concluidos: novos,
      checklist_completo: completo,
      concluido_em: completo ? new Date().toISOString() : null,
    }).eq("id", progresso.id).select().single();
    setProgresso(data);
  };

  const dispensar = () => {
    localStorage.setItem(`onboarding_dismissed_${produto}`, "1");
    setDispensado(true);
    setAberto(false);
  };

  if (!aberto || dispensado || !progresso || passos.length === 0) return null;

  const concluidos: string[] = progresso.passos_concluidos ?? [];
  const pct = (concluidos.length / passos.length) * 100;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="border-primary/30 shadow-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold text-sm">Primeiros passos</div>
                <div className="text-xs text-muted-foreground">{concluidos.length} de {passos.length} concluídos</div>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={dispensar}><X className="w-4 h-4" /></Button>
          </div>

          <Progress value={pct} className="h-2" />

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {passos.map((p) => {
              const done = concluidos.includes(p.id);
              return (
                <div key={p.id} className={`flex items-start gap-2 p-2 rounded border ${done ? "bg-muted/50" : ""}`}>
                  <button onClick={() => toggle(p.id)} className="mt-0.5 shrink-0">
                    {done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${done ? "line-through text-muted-foreground" : "font-medium"}`}>{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{p.descricao}</div>
                    {p.link && !done && (
                      <Link to={p.link} className="text-xs text-primary hover:underline">Ir agora →</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pct === 100 && (
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded text-sm text-green-700 dark:text-green-300">
              🎉 Onboarding concluído! Você está pronto.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
