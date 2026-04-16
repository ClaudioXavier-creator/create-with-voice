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
type NivelKey = "entrada" | "intermediario" | "avancado";

interface PlanInfo {
  key: string;
  label: string;
  priceFull: number;     // preço cheio mensal-equivalente do período
  priceTotal: number;    // total do período
  desc: string;
}

interface NivelInfo {
  key: NivelKey;
  label: string;
  porte: string;
  destaque?: boolean;
  features: string[];
  plans: PlanInfo[];
}

// Lançamento 2026: 50% off em todos os planos até 31/12/2026
const LAUNCH_END = new Date("2026-12-31T23:59:59");
const isLaunchActive = () => new Date() <= LAUNCH_END;

const NIVEIS: NivelInfo[] = [
  {
    key: "entrada",
    label: "Entrada",
    porte: "Pequeno porte",
    features: [
      "Essencial MAPA (IN 04/2007)",
      "Arquivamento digital de registros físicos",
      "Até 1 empresa",
    ],
    plans: [
      { key: "mensal", label: "Mensal", priceFull: 495, priceTotal: 495, desc: "30 dias" },
      { key: "semestral", label: "Semestral", priceFull: 420.75, priceTotal: 2524.5, desc: "15% off — 6 meses" },
      { key: "anual", label: "Anual", priceFull: 371.25, priceTotal: 4455, desc: "25% off — 12 meses" },
    ],
  },
  {
    key: "intermediario",
    label: "Intermediário",
    porte: "Médio porte",
    destaque: true,
    features: [
      "Modelo híbrido (físico + digital)",
      "PCP, fórmulas versionadas, planilhas POP",
      "Auditoria interna e até 3 empresas",
    ],
    plans: [
      { key: "mensal", label: "Mensal", priceFull: 890, priceTotal: 890, desc: "30 dias" },
      { key: "semestral", label: "Semestral", priceFull: 756.5, priceTotal: 4539, desc: "15% off — 6 meses" },
      { key: "anual", label: "Anual", priceFull: 667.5, priceTotal: 8010, desc: "25% off — 12 meses" },
    ],
  },
  {
    key: "avancado",
    label: "Avançado",
    porte: "Grande porte",
    features: [
      "100% digital, multi-empresa",
      "IA, integração SIPEAGRO, todas as features",
      "Empresas ilimitadas",
    ],
    plans: [
      { key: "mensal", label: "Mensal", priceFull: 1490, priceTotal: 1490, desc: "30 dias" },
      { key: "semestral", label: "Semestral", priceFull: 1266.5, priceTotal: 7599, desc: "15% off — 6 meses" },
      { key: "anual", label: "Anual", priceFull: 1117.5, priceTotal: 13410, desc: "25% off — 12 meses" },
    ],
  },
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

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
            <ContactFormDialog programa={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactFormDialog({ programa }: { programa?: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
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
      const { error } = await supabase.from("leads_contato").insert({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado.trim().toUpperCase() || null,
        mensagem: formData.mensagem.trim() || null,
        programa: programa || null,
        user_id: user?.id || null,
      });
      if (error) throw error;
      toast.success("Mensagem enviada com sucesso! Entraremos em contato.");
      setOpen(false);
      setFormData({ nome: "", email: "", telefone: "", cidade: "", estado: "", mensagem: "" });
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + (err.message || "Tente novamente."));
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
