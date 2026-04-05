import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Users, MapPin, BarChart3, FileText, Target, HeadsetIcon, ShieldCheck, Lock, Globe, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoAgrogestao from "@/assets/logo-agrogestao.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

const funcionalidades = [
  { icon: Users, title: "Carteira de Clientes", desc: "Cadastro completo de clientes e prospects com dados regionais, histórico de compras e perfil produtivo." },
  { icon: MapPin, title: "Gestão Regional", desc: "Organize sua equipe por territórios e regiões, com metas e indicadores específicos por área geográfica." },
  { icon: TrendingUp, title: "Metas Comerciais", desc: "Defina metas de vendas por representante, produto e região com acompanhamento em tempo real." },
  { icon: Globe, title: "Visitas a Campo", desc: "Planeje e registre visitas técnicas com geolocalização, relatórios fotográficos e check-in/check-out." },
  { icon: BarChart3, title: "Dashboard de Vendas", desc: "Painel com indicadores de performance, ranking de vendedores, evolução mensal e previsão de receita." },
  { icon: FileText, title: "Relatórios por Região", desc: "Relatórios detalhados de desempenho por território, produto e período com exportação para PDF." },
];

const diferenciais = [
  { icon: Lock, title: "Multi-tenant Seguro", desc: "Cada representante vê apenas sua própria carteira — total privacidade e segurança entre equipes." },
  { icon: ShieldCheck, title: "Foco no Agronegócio", desc: "Desenvolvido especificamente para o mercado agro, com terminologia e fluxos adaptados ao setor." },
];

export default function AgroGestaoCRMPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-teal-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(150,70%,40%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-green-500/10 blur-2xl" />
              <img src={logoAgrogestao} alt="AgroGestão CRM Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">CRM para Agronegócio</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Agro<span className="text-primary">Gestão</span> CRM
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Plataforma de gestão regional de vendas no agronegócio. Controle clientes, territórios e metas comerciais em um só lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://agrocrm-gtijlihc.manus.space/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Testar grátis por 7 dias
                  </Button>
                </a>
                <a href="https://agrocrm-gtijlihc.manus.space/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Já é cadastrado? Acesse o Sistema
                  </Button>
                </a>
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">CRM feito para o agronegócio</h2>
            <p className="text-muted-foreground">Ferramentas específicas para gestão regional de vendas</p>
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Por que escolher o AgroGestão CRM?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{d.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preços Individuais */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Planos e Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos Individuais</h2>
            <p className="text-muted-foreground">Por usuário • Escolha o plano ideal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { periodo: "Mensal", preco: "R$ 97", sub: "/mês", nota: "Sem compromisso de fidelidade", destaque: false },
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
        </section>

        {/* Preços Grupo */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Planos de Grupo (20 usuários)</h2>
            <p className="text-muted-foreground">Ideal para equipes e consultorias</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { periodo: "Mensal", preco: "R$ 497", sub: "/mês", nota: "≈ R$ 25/usuário/mês" },
              { periodo: "Semestral", preco: "R$ 2.535", sub: "", nota: "≈ R$ 21/usuário/mês" },
              { periodo: "Anual", preco: "R$ 4.500", sub: "", nota: "≈ R$ 19/usuário/mês" },
            ].map((plan) => (
              <Card key={plan.periodo} className="border-border hover:shadow-xl transition-all">
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
            <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao AgroGestão CRM durante o período trial.</p>
            <a href="https://agrocrm-gtijlihc.manus.space/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                <Sparkles className="h-4 w-4" />
                Começar Trial Grátis
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <img src={logoBpfConsult} alt="BPF_Consult" className="mx-auto w-10 h-10 object-contain mb-2 opacity-60" />
        <p className="text-sm text-muted-foreground">AgroGestão CRM © {new Date().getFullYear()} — by BPF_Consult</p>
      </footer>
    </div>
  );
}
