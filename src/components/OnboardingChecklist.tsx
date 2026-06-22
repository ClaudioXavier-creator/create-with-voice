import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Building2, Truck, FileText, Sparkles, X, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "feedbpf_checklist_dismissed";
const POP_KEY = "feedbpf_checklist_viewed_pop";
const TOUR_KEY = "feedbpf_onboarding_done";

export function markPopVisited() {
  try { localStorage.setItem(POP_KEY, "true"); } catch { /* ignore */ }
}

interface Props {
  onStartTour: () => void;
}

export function OnboardingChecklist({ onStartTour }: Props) {
  const { user } = useAuth();
  const { empresas, empresaAtiva } = useEmpresa();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [popVisited, setPopVisited] = useState<boolean>(() => {
    try { return localStorage.getItem(POP_KEY) === "true"; } catch { return false; }
  });
  const [tourDone, setTourDone] = useState<boolean>(() => {
    try { return localStorage.getItem(TOUR_KEY) === "true"; } catch { return false; }
  });

  // Re-check localStorage when component mounts or window focuses (handles tour completion)
  useEffect(() => {
    const refresh = () => {
      try {
        setPopVisited(localStorage.getItem(POP_KEY) === "true");
        setTourDone(localStorage.getItem(TOUR_KEY) === "true");
      } catch { /* ignore */ }
    };
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 2000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(interval); };
  }, []);

  const { data: fornecedoresCount = 0 } = useQuery({
    queryKey: ["onboarding-fornecedores", user?.id, empresaAtiva?.id],
    queryFn: async () => {
      if (!user) return 0;
      let q = supabase.from("fornecedores").select("id", { count: "exact", head: true });
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      else q = q.eq("user_id", user.id);
      const { count } = await q;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const hasEmpresa = (empresas?.length ?? 0) > 0;
  const hasFornecedor = fornecedoresCount > 0;

  const steps = [
    { id: "empresa", label: "Cadastrar sua empresa", icon: Building2, done: hasEmpresa, to: "/cadastro", cta: "Cadastrar empresa" },
    { id: "fornecedor", label: "Cadastrar 1º fornecedor de matéria-prima", icon: Truck, done: hasFornecedor, to: "/fornecedores", cta: "Cadastrar fornecedor" },
    { id: "pop", label: "Visualizar um POP (Procedimento Operacional)", icon: FileText, done: popVisited, to: "/guia-pops", cta: "Abrir POPs" },
    { id: "tour", label: "Assistir tour de 1 minuto da plataforma", icon: Sparkles, done: tourDone, action: onStartTour, cta: "Iniciar tour" },
  ] as const;

  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;

  if (dismissed || allDone) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Primeiros passos no Feed_BPF
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Complete os 4 passos para extrair o máximo do sistema</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1" onClick={dismiss} aria-label="Dispensar checklist">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{completed}/{total}</span>
        </div>
        <ul className="space-y-1.5">
          {steps.map((s) => {
            const Icon = s.icon;
            const inner = (
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                s.done ? "opacity-60" : "hover:bg-primary/5 cursor-pointer"
              )}>
                {s.done ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />}
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className={cn("text-sm flex-1", s.done && "line-through")}>{s.label}</span>
                {!s.done && (
                  <span className="text-xs font-medium text-primary flex items-center gap-0.5">
                    {s.cta} <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
            if (s.done) return <li key={s.id}>{inner}</li>;
            if ("action" in s && s.action) {
              return <li key={s.id}><button type="button" onClick={s.action} className="w-full text-left">{inner}</button></li>;
            }
            return <li key={s.id}><Link to={(s as any).to}>{inner}</Link></li>;
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
