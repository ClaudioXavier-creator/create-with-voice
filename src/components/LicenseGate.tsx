import { useState } from "react";
import { AlertTriangle, CreditCard, Loader2, Clock, ShieldCheck, Mail, MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLicense } from "@/hooks/useLicense";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

type ProductKey = "feedbpf" | "nutricrm" | "agrogestao" | "auditsbpf";

interface PlanInfo {
  key: string;
  label: string;
  priceTotal: string;
  priceMes: string | null;
  desc: string;
}

const PRODUCT_PLANS: Record<ProductKey, PlanInfo[]> = {
  feedbpf: [
    { key: "mensal", label: "Mensal", priceTotal: "R$ 495", priceMes: null, desc: "Pagamento único — 30 dias" },
    { key: "semestral", label: "Semestral", priceTotal: "R$ 2.475", priceMes: "equivale a R$ 412,50/mês", desc: "Pagamento único — 6 meses" },
    { key: "anual", label: "Anual", priceTotal: "R$ 4.455", priceMes: "equivale a R$ 371,25/mês", desc: "Pagamento único — 12 meses" },
  ],
  nutricrm: [
    { key: "mensal", label: "Mensal", priceTotal: "R$ 97", priceMes: null, desc: "Pagamento mensal recorrente" },
    { key: "semestral", label: "Semestral", priceTotal: "R$ 497", priceMes: "equivale a R$ 82,83/mês", desc: "Pagamento único — 6 meses" },
    { key: "anual", label: "Anual", priceTotal: "R$ 897", priceMes: "equivale a R$ 74,75/mês", desc: "Pagamento único — 12 meses" },
  ],
  agrogestao: [
    { key: "mensal", label: "Mensal", priceTotal: "R$ 495", priceMes: null, desc: "Pagamento único — 30 dias" },
    { key: "semestral", label: "Semestral", priceTotal: "R$ 2.475", priceMes: "equivale a R$ 412,50/mês", desc: "Pagamento único — 6 meses" },
    { key: "anual", label: "Anual", priceTotal: "R$ 4.455", priceMes: "equivale a R$ 371,25/mês", desc: "Pagamento único — 12 meses" },
  ],
  auditsbpf: [
    { key: "mensal", label: "Mensal", priceTotal: "R$ 249,90", priceMes: null, desc: "Pagamento único — 30 dias" },
    { key: "semestral", label: "Semestral", priceTotal: "R$ 1.274,49", priceMes: "equivale a R$ 212,42/mês", desc: "15% de desconto — 6 meses" },
    { key: "anual", label: "Anual", priceTotal: "R$ 2.249,10", priceMes: "equivale a R$ 187,43/mês", desc: "25% de desconto — 12 meses" },
  ],
};

const PRODUCT_LABELS: Record<ProductKey, string> = {
  feedbpf: "Feed_BPF",
  nutricrm: "NutriCRM",
  agrogestao: "AgroGestão CRM",
  auditsbpf: "Audits_BPF",
};

interface LicenseGateProps {
  children: React.ReactNode;
  product?: ProductKey;
}

export default function LicenseGate({ children, product = "feedbpf" }: LicenseGateProps) {
  const { license, loading, isActive, daysRemaining } = useLicense();
  const { empresaAtiva, loading: empresaLoading } = useEmpresa();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const plans = PRODUCT_PLANS[product];
  const productLabel = PRODUCT_LABELS[product];

  if (loading || empresaLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!empresaAtiva) return <>{children}</>;

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

  const handleCheckout = async (plano: string) => {
    if (!empresaAtiva) return;
    setCheckoutLoading(plano);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { empresa_id: empresaAtiva.id, plano, produto: product },
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
          <h2 className="text-2xl font-bold">Acesso expirado — {productLabel}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A licença da empresa <strong>{empresaAtiva.nome}</strong> expirou.
            Escolha um plano para continuar utilizando o {productLabel}.
          </p>
          {license && (
            <Badge variant="destructive">
              {license.status === "revogada" ? "Revogada" : "Expirada"} em{" "}
              {new Date(license.data_expiracao).toLocaleDateString("pt-BR")}
            </Badge>
          )}
        </div>

        <div id="license-plans" className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
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

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </p>
          <p className="text-xs text-muted-foreground">
            Inclui até <strong>10 empresas</strong>. Acima disso, acréscimo de 25% no valor do plano.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="mailto:contato@bpfconsult.com.br"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              contato@bpfconsult.com.br
            </a>
            <ContactFormDialog />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactFormDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    mensagem: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      toast.error("Preencha ao menos nome e e-mail.");
      return;
    }
    setSending(true);
    try {
      // Send via mailto as fallback
      const subject = encodeURIComponent(`Contato via ${window.location.hostname} — ${formData.nome}`);
      const body = encodeURIComponent(
        `Nome: ${formData.nome}\nE-mail: ${formData.email}\nTelefone: ${formData.telefone}\nCidade: ${formData.cidade}\nEstado: ${formData.estado}\n\nMensagem:\n${formData.mensagem}`
      );
      window.open(`mailto:contato@bpfconsult.com.br?subject=${subject}&body=${body}`, "_blank");
      toast.success("Janela de e-mail aberta! Envie sua mensagem.");
      setOpen(false);
      setFormData({ nome: "", email: "", telefone: "", cidade: "", estado: "", mensagem: "" });
    } catch {
      toast.error("Erro ao abrir o e-mail.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer bg-transparent border-none p-0">
          <MessageCircle className="w-3.5 h-3.5" />
          Fale Conosco
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Fale Conosco</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="contact-nome">Nome completo *</Label>
            <Input
              id="contact-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Seu nome"
              required
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contact-email">E-mail *</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="contact-telefone">Telefone</Label>
              <Input
                id="contact-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                maxLength={20}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contact-cidade">Cidade</Label>
              <Input
                id="contact-cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Sua cidade"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="contact-estado">Estado</Label>
              <Input
                id="contact-estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-mensagem">Mensagem</Label>
            <Textarea
              id="contact-mensagem"
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              placeholder="Como podemos ajudar?"
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Enviar Mensagem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
