import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2, ShieldCheck, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Nivel = "individual" | "consultor";
type Periodo = "mensal" | "semestral" | "anual";

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

// Preço base mensal por nível
const PRECO_BASE: Record<Nivel, number> = {
  individual: 249,
  consultor: 499,
};

const NIVEIS: { key: Nivel; nome: string; descricao: string; icon: typeof ShieldCheck; features: string[] }[] = [
  {
    key: "individual",
    nome: "Individual",
    descricao: "Para 1 empresa / fábrica",
    icon: ShieldCheck,
    features: [
      "1 empresa cadastrada",
      "Acesso completo ao Audits BPF",
      "Checklists baseados no Decreto 12.031/2024",
      "Relatórios e exportação PDF",
      "Suporte por e-mail",
    ],
  },
  {
    key: "consultor",
    nome: "Consultor",
    descricao: "Para consultores — até 10 empresas",
    icon: Users,
    features: [
      "Até 10 empresas gerenciadas",
      "Painel multi-empresa",
      "Acesso completo ao Audits BPF",
      "Checklists baseados no Decreto 12.031/2024",
      "Relatórios e exportação PDF",
      "Suporte prioritário",
    ],
  },
];

const PERIODOS: { key: Periodo; nome: string; meses: number; desconto: number; badge?: string }[] = [
  { key: "mensal", nome: "Mensal", meses: 1, desconto: 0 },
  { key: "semestral", nome: "Semestral", meses: 6, desconto: 0.15, badge: "15% OFF" },
  { key: "anual", nome: "Anual", meses: 12, desconto: 0.25, badge: "25% OFF" },
];

export default function AuditsBPFPlanos() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [nivelSelecionado, setNivelSelecionado] = useState<Nivel>("individual");
  const [loading, setLoading] = useState<Periodo | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);

  const handleTrialConsultor = async () => {
    if (!session) {
      navigate("/auth?product=auditsbpf");
      return;
    }
    setTrialLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("audits-trial-consultor", { body: {} });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao ativar trial");
      toast.success("Trial Consultor ativado! 7 dias com até 10 empresas.");
      setTimeout(() => navigate("/auditsbpf"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Erro ao ativar trial");
    } finally {
      setTrialLoading(false);
    }
  };

  const handleCheckout = async (periodo: Periodo) => {
    if (!session) {
      navigate("/auth?product=auditsbpf");
      return;
    }
    setLoading(periodo);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-audits", {
        body: { plano: periodo, nivel: nivelSelecionado },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/auditsbpf")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Planos do Audits BPF</h1>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para sua operação
          </p>
        </div>

        {/* Seletor de Nível */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {NIVEIS.map((nivel) => {
            const Icon = nivel.icon;
            const ativo = nivelSelecionado === nivel.key;
            return (
              <Card
                key={nivel.key}
                onClick={() => setNivelSelecionado(nivel.key)}
                className={`cursor-pointer transition-all ${
                  ativo ? "border-primary border-2 shadow-lg" : "hover:border-primary/50"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ativo ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{nivel.nome}</CardTitle>
                      <CardDescription>{nivel.descricao}</CardDescription>
                    </div>
                    {ativo && <Badge>Selecionado</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {nivel.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Períodos */}
        <h2 className="text-2xl font-bold mb-4 text-center">
          Escolha a periodicidade — Plano {NIVEIS.find((n) => n.key === nivelSelecionado)?.nome}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {PERIODOS.map((p) => {
            const base = PRECO_BASE[nivelSelecionado];
            const totalCheio = base * p.meses;
            const totalComDesconto = totalCheio * (1 - p.desconto);
            const mensalEfetivo = totalComDesconto / p.meses;
            const destaque = p.key === "anual";

            return (
              <Card
                key={p.key}
                className={`relative ${destaque ? "border-primary border-2 shadow-xl" : ""}`}
              >
                {p.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {p.badge}
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{p.nome}</CardTitle>
                  <CardDescription>
                    {p.meses === 1 ? "Cobrança mensal" : `${p.meses} meses — pagamento único`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  {p.desconto > 0 && (
                    <p className="text-sm text-muted-foreground line-through">
                      De {formatBRL(totalCheio)}
                    </p>
                  )}
                  <div>
                    <p className="text-3xl font-bold">{formatBRL(totalComDesconto)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.meses === 1
                        ? "por mês"
                        : `total — equivale a ${formatBRL(mensalEfetivo)}/mês`}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    variant={destaque ? "default" : "outline"}
                    disabled={loading !== null}
                    onClick={() => handleCheckout(p.key)}
                  >
                    {loading === p.key ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Assinar agora"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {nivelSelecionado === "consultor" && (
          <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Experimente grátis por 7 dias</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Trial Consultor com até 10 empresas — sem cartão de crédito.
            </p>
            <Button onClick={handleTrialConsultor} disabled={trialLoading} variant="default">
              {trialLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Iniciar Trial Consultor — 7 dias grátis
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pagamento processado com segurança via Paddle. Você poderá cancelar a qualquer momento.
          {" "}Empresas excedentes (acima de 10) são cobradas automaticamente conforme o plano.
        </p>
      </div>
    </div>
  );
}
