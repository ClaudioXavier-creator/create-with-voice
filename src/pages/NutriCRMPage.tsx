import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const recursos = [
  "CRM completo para nutrição animal",
  "Gestão de clientes e prospects",
  "Controle de visitas técnicas",
  "Relatórios de acompanhamento",
  "Dashboard de indicadores",
  "Suporte técnico dedicado",
];

export default function NutriCRMPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
            Nutri<span className="text-primary">CRM</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CRM especializado para profissionais de nutrição animal. Gerencie clientes, visitas e acompanhamentos em um só lugar.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Recursos */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-xl font-bold font-display text-foreground mb-6 text-center">Recursos inclusos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recursos.map((r) => (
              <div key={r} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {r}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">Planos NutriCRM</h2>
          <p className="text-muted-foreground">Por usuário • Escolha o plano ideal</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-border hover:shadow-md transition-all">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">30 dias</p>
              <div>
                <span className="text-3xl font-bold text-foreground">R$ 97</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground">Sem compromisso de fidelidade</p>
            </CardContent>
          </Card>
          <Card className="border-primary/50 bg-primary/5 hover:shadow-md transition-all relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
              14% OFF
            </Badge>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">6 meses</p>
              <div>
                <span className="text-3xl font-bold text-foreground">R$ 497</span>
              </div>
              <p className="text-xs text-muted-foreground">≈ R$ 83/mês por usuário</p>
            </CardContent>
          </Card>
          <Card className="border-primary/50 bg-primary/5 hover:shadow-md transition-all relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
              23% OFF
            </Badge>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">12 meses</p>
              <div>
                <span className="text-3xl font-bold text-foreground">R$ 897</span>
              </div>
              <p className="text-xs text-muted-foreground">≈ R$ 75/mês por usuário</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold font-display text-foreground mb-3">Experimente grátis por 7 dias!</h3>
          <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao NutriCRM durante o período trial.</p>
          <a href="https://nutricrm.onrender.com/register" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Começar Trial Grátis
            </Button>
          </a>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>NutriCRM © {new Date().getFullYear()} — by BPF_Consult</p>
      </footer>
    </div>
  );
}
