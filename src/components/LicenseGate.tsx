import { useState } from "react";
import { AlertTriangle, CreditCard, Loader2, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLicense } from "@/hooks/useLicense";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  { key: "mensal", label: "Mensal", priceTotal: "R$ 150", priceMes: null, desc: "Pagamento único" },
  { key: "semestral", label: "Semestral", priceTotal: "R$ 840", priceMes: "equivale a R$ 140/mês", desc: "Pagamento único por 6 meses" },
  { key: "anual", label: "Anual", priceTotal: "R$ 1.500", priceMes: "equivale a R$ 125/mês", desc: "Pagamento único por 12 meses" },
];

export default function LicenseGate({ children }: { children: React.ReactNode }) {
  const { license, loading, isActive, daysRemaining } = useLicense();
  const { empresaAtiva, loading: empresaLoading } = useEmpresa();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  if (loading || empresaLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No empresa selected yet — let them through to cadastro
  if (!empresaAtiva) return <>{children}</>;

  // Active license — show children with optional trial banner
  if (isActive) {
    return (
      <>
        {license?.plano === "trial" && daysRemaining <= 3 && (
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3 text-sm">
            <Clock className="w-5 h-5 text-warning shrink-0" />
            <span>
              Seu período de teste expira em <strong>{daysRemaining} dia{daysRemaining !== 1 ? "s" : ""}</strong>.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto shrink-0"
              onClick={() => document.getElementById("license-plans")?.scrollIntoView({ behavior: "smooth" })}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Assinar agora
            </Button>
          </div>
        )}
        {children}
      </>
    );
  }

  // Expired or no license — block access and show plans
  const handleCheckout = async (plano: string) => {
    if (!empresaAtiva) return;
    setCheckoutLoading(plano);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { empresa_id: empresaAtiva.id, plano },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Acesso expirado</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A licença da empresa <strong>{empresaAtiva.nome}</strong> expirou.
            Escolha um plano para continuar utilizando o sistema.
          </p>
          {license && (
            <Badge variant="destructive">
              {license.status === "revogada" ? "Revogada" : "Expirada"} em{" "}
              {new Date(license.data_expiracao).toLocaleDateString("pt-BR")}
            </Badge>
          )}
        </div>

        <div id="license-plans" className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.key} className={plan.key === "anual" ? "border-primary ring-1 ring-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.label}</CardTitle>
                  {plan.key === "anual" && (
                    <Badge variant="default" className="text-xs">Melhor valor</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{plan.priceTotal}</p>
                  {plan.priceMes && (
                    <p className="text-sm font-medium text-primary">{plan.priceMes}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </div>
                <Button
                  className="w-full"
                  variant={plan.key === "anual" ? "default" : "outline"}
                  onClick={() => handleCheckout(plan.key)}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Assinar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <ShieldCheck className="w-3 h-3 inline mr-1" />
          Pagamento seguro via Stripe. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}
