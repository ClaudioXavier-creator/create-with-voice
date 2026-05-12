import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Sparkles, Tag, FileText, Printer, ShieldCheck, Lock, Layers, Palette, QrCode, Building2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import SuperAdminBanner from "@/components/SuperAdminBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const funcionalidades = [
  { icon: Tag, title: "Editor de Rótulos", desc: "Crie e edite rótulos comerciais com 18 campos obrigatórios da RTPI, conforme exigências do MAPA." },
  { icon: FileText, title: "Ficha Técnica (RTPI)", desc: "Geração automática da Ficha Técnica do produto com todos os campos regulatórios." },
  { icon: Layers, title: "Níveis de Garantia", desc: "Cálculo e conversão automática (g↔mg) com tratamento de exceções (UFC, FTU, UI, KUI)." },
  { icon: Printer, title: "Impressão Zebra, Word & Excel", desc: "Exporte direto para impressoras Zebra (ZPL), documentos Word e planilhas Excel." },
  { icon: QrCode, title: "QR Code & Lote", desc: "Inclua QR Code de rastreabilidade e codificação de lote/validade automaticamente." },
  { icon: Palette, title: "Templates Customizáveis", desc: "Modelos prontos para ração, premix, suplementos, sal mineral e produtos veterinários." },
];

const diferenciais = [
  { icon: ShieldCheck, title: "100% Conforme MAPA", desc: "Atende IN 04/2007, Decreto 12.031/2024 e regras de rotulagem para nutrição animal." },
  { icon: Lock, title: "Multi-tenant Seguro", desc: "Cada empresa acessa apenas seus rótulos, com isolamento total de dados." },
];

export default function RotulosBPFPage() {
  const { session } = useAuth();
  const destino = "/rotulos";
  const signupLink = session ? destino : `/auth?product=rotulos&mode=signup&redirect=%2Frotulos`;
  const loginLink = session ? destino : `/auth?product=rotulos&mode=login&redirect=%2Frotulos`;

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminBanner programa="Nutri_Agro Labels" />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(170,70%,40%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-teal-500/10 blur-2xl" />
              <img src={logoRotulos} alt="Nutri_Agro Labels Logo" width={512} height={512} className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">Gerador de Rótulos para Nutrição Animal</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Nutri_Agro <span className="text-primary">Labels</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Gerador de rótulos para impressão em Zebra, Word e Excel — desenvolvido para nutrição animal, fábricas de rações e suplementos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={signupLink}>
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Começar — 7 dias grátis
                  </Button>
                </Link>
                <Link to={loginLink}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Já sou cliente
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sem cartão de crédito • Acesso completo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Tudo que você precisa para rotular conforme</h2>
            <p className="text-muted-foreground">Editor profissional com regras regulatórias embutidas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {funcionalidades.map((f) => (
              <div key={f.title} className="p-5 rounded-xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Diferenciais</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Por que escolher o Nutri_Agro Labels?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-teal-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{d.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Planos e Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos Individuais</h2>
            <p className="text-muted-foreground">Escolha o plano ideal para sua fábrica</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { periodo: "Mensal", preco: "R$ 97", sub: "/mês", nota: "Sem fidelidade", destaque: false },
              { periodo: "Semestral", preco: "R$ 497", sub: "", nota: "≈ R$ 83/mês • 14% OFF", destaque: true, badge: "Mais Popular" },
              { periodo: "Anual", preco: "R$ 897", sub: "", nota: "≈ R$ 75/mês • 23% OFF", destaque: true, badge: "Melhor Custo" },
            ].map((plan) => (
              <Card key={plan.periodo} className={`transition-all hover:shadow-xl ${plan.destaque ? "border-primary/50 bg-primary/5 scale-[1.02]" : "border-border"} relative`}>
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs shadow-lg">
                    {plan.badge}
                  </Badge>
                )}
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.periodo}</p>
                  <div>
                    <span className="text-3xl font-bold text-foreground">{plan.preco}</span>
                    <span className="text-muted-foreground">{plan.sub}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.nota}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold font-display text-foreground mb-3">Experimente grátis por 7 dias!</h3>
            <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao Nutri_Agro Labels durante o período trial.</p>
            <Link to={signupLink}>
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                <Sparkles className="h-4 w-4" />
                Começar Trial Grátis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <img src={logoBpfConsult} alt="BPF_Consult" width={40} height={40} loading="lazy" className="mx-auto w-10 h-10 object-contain mb-2 opacity-60" />
        <p className="text-sm text-muted-foreground">Nutri_Agro Labels © {new Date().getFullYear()} — by BPF_Consult</p>
      </footer>
    </div>
  );
}
