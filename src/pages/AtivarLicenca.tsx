import { useState } from "react";
import { Key, Loader2, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLicense } from "@/hooks/useLicense";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { TIER_LABEL } from "@/config/tiers";

const PLAN_LABELS: Record<string, string> = {
  trial: "Teste Grátis (30 dias)",
  "3_meses": "Trimestral (3 meses)",
  "6_meses": "Semestral (6 meses)",
  "1_ano": "Anual (1 ano)",
};

export default function AtivarLicenca() {
  const { license, tier, isActive, isExpired, daysRemaining, activateKey } = useLicense();
  const { signOut } = useAuth();
  const [chave, setChave] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chave.trim()) return;
    setLoading(true);
    try {
      await activateKey(chave.trim());
      toast.success("Licença ativada com sucesso!");
      setChave("");
    } catch (err: any) {
      toast.error(err.message || "Chave inválida");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Key className="w-6 h-6" />
            Licença do Sistema
          </CardTitle>
          <CardDescription>Gerencie sua licença Feed_BPF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current license status */}
          {license && (
            <div className={`rounded-lg p-4 border ${isActive ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 mb-2">
                {isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )}
                <span className="font-semibold">
                  {isActive ? "Licença Ativa" : "Licença Expirada"}
                </span>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Plano: <strong>{PLAN_LABELS[license.plano] || license.plano}</strong></p>
                <p>Nível: <strong>{TIER_LABEL[tier]}</strong></p>
                <p>Expira em: <strong>{new Date(license.data_expiracao).toLocaleDateString("pt-BR")}</strong></p>
                {isActive && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {daysRemaining} dias restantes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Activation form */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              {isExpired ? "Ativar nova licença" : "Tem uma chave de licença?"}
            </h3>
            <form onSubmit={handleActivate} className="space-y-3">
              <Input
                placeholder="Cole sua chave aqui (ex: LIC-xxxx...)"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading || !chave.trim()}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ativar Licença
              </Button>
            </form>
          </div>

          {isExpired && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Entre em contato para adquirir uma licença:</p>
              <p className="font-medium text-foreground mt-1">WhatsApp: Fale conosco</p>
            </div>
          )}

          <Button variant="ghost" size="sm" className="w-full" onClick={signOut}>
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
