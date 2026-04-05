import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, ShieldCheck, Factory, Beaker, BarChart3, GraduationCap, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutricrm from "@/assets/logo-nutricrm.png";
import logoAgrogestao from "@/assets/logo-agrogestao.png";

const produtos = [
  {
    nome: "Feed_BPF",
    logo: logoFeedBpf,
    desc: "Plataforma completa de Boas Práticas de Fabricação para nutrição animal. Manual BPF, POPs digitais, planilhas de monitoramento, produção, PCP, rastreabilidade, controle de pragas, higiene e muito mais.",
    destaques: ["Manual BPF & POPs", "Produção & PCP", "Rastreabilidade", "Higiene & Manutenção", "Matriz de Risco (APPCC)", "Indicadores & Relatórios"],
    link: "/feedbpf",
    gradient: "from-[hsl(200,80%,45%)] to-[hsl(210,90%,30%)]",
    bgCard: "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30",
    borderColor: "border-sky-200 dark:border-sky-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=feedbpf&mode=signup&redirect=%2Fdashboard",
    preco: "A partir de R$ 497/mês",
  },
  {
    nome: "Audits_BPF",
    logo: logoAuditsBpf,
    desc: "Sistema de auditoria interna com checklist completo baseado no Decreto 12.031/2024. Sala exclusiva do auditor MAPA, cálculo automático de conformidade e planos de ação.",
    destaques: ["Checklist Decreto 12.031", "Sala do Auditor", "Planos de Ação", "Cálculo de Conformidade", "Relatórios de Auditoria", "Histórico e Evolução"],
    link: "/audits-bpf",
    gradient: "from-[hsl(140,60%,35%)] to-[hsl(160,70%,25%)]",
    bgCard: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    trial: "7 dias grátis",
    trialLink: "https://friendly-flame-igniter.lovable.app/auth",
    preco: "A partir de R$ 197/mês",
    external: true,
  },
  {
    nome: "NutriCRM",
    logo: logoNutricrm,
    desc: "CRM especializado para profissionais de nutrição animal. Gestão completa de clientes, prospects, visitas técnicas, acompanhamentos e relatórios de performance.",
    destaques: ["Gestão de Clientes", "Visitas Técnicas", "Dashboard Inteligente", "Relatórios", "Prospects & Pipeline", "Suporte Dedicado"],
    link: "/nutricrm",
    gradient: "from-[hsl(30,80%,45%)] to-[hsl(20,70%,35%)]",
    bgCard: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    trial: "7 dias grátis",
    trialLink: "https://nutricrm.onrender.com/register",
    preco: "A partir de R$ 97/mês",
    external: true,
  },
];

const estatisticas = [
  { valor: "30+", label: "Módulos Integrados" },
  { valor: "100%", label: "Digital & Paperless" },
  { valor: "24/7", label: "Acesso Cloud" },
  { valor: "MAPA", label: "Conformidade Total" },
];

export default function Vitrine() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-28">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
              <img
                src={logoBpfConsult}
                alt="BPF_Consult Logo"
                className="relative w-32 h-32 sm:w-44 sm:h-44 object-contain drop-shadow-xl"
              />
            </div>
            <Badge variant="secondary" className="mb-5 text-xs tracking-widest uppercase px-4 py-1.5 rounded-full">
              Consultoria & Sistemas para Nutrição Animal
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-foreground mb-5 tracking-tight leading-tight">
              BPF_<span className="text-primary">Consult</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Soluções completas em <strong className="text-foreground">Boas Práticas de Fabricação</strong>, auditoria e gestão para a indústria de nutrição animal. 
              Conformidade com IN 04/2007 e Decreto 12.031/2024.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Lock className="h-4 w-4" />
                  Acessar Sistema
                </Button>
              </Link>
              <a href="#programas">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
                  <Sparkles className="h-4 w-4" />
                  Conhecer Programas
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {estatisticas.map((s) => (
              <div key={s.label} className="text-center p-4 rounded-2xl bg-card/60 backdrop-blur border border-border">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{s.valor}</div>
                <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Nossos Programas */}
      <main id="programas" className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase px-4 py-1">
            Nossos Programas
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
            Três soluções, um ecossistema completo
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Clique em cada programa para ver o tutorial completo, funcionalidades e planos de preço.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {produtos.map((p) => (
            <div key={p.nome} className="group cursor-pointer" onClick={() => navigate(p.link)}>
              <div className={`h-full rounded-2xl border-2 ${p.borderColor} ${p.bgCard} p-1 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]`}>
                <div className="h-full rounded-xl bg-card/80 backdrop-blur-sm p-6 sm:p-8 flex flex-col">
                  {/* Logo */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className={`absolute -inset-3 rounded-full bg-gradient-to-br ${p.gradient} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />
                      <img
                        src={p.logo}
                        alt={`${p.nome} Logo`}
                        className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Nome */}
                  <h3 className="text-2xl font-bold font-display text-foreground text-center mb-3">{p.nome}</h3>

                  {/* Descrição */}
                  <p className="text-sm text-muted-foreground leading-relaxed text-center mb-6">{p.desc}</p>

                  {/* Destaques */}
                  <div className="grid grid-cols-2 gap-2 mb-5 flex-1">
                    {p.destaques.map((d) => (
                      <div key={d} className="flex items-center gap-2 text-xs text-foreground/80">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Preço + Trial */}
                  <div className="text-center mb-4 space-y-1">
                    <p className="text-xs text-muted-foreground">{p.preco}</p>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2">
                    {p.external ? (
                      <a href={p.trialLink} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" className="w-full gap-2 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5" />
                          Testar {p.trial}
                        </Button>
                      </a>
                    ) : (
                      <Link to={p.trialLink} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" className="w-full gap-2 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5" />
                          Testar {p.trial}
                        </Button>
                      </Link>
                    )}
                    <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                      Ver detalhes e preços
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Por que escolher */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-foreground mb-3">Por que escolher a BPF_Consult?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Tecnologia e expertise unidas para garantir a conformidade da sua fábrica</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: "Conformidade Garantida", desc: "100% alinhado com IN 04/2007 e Decreto 12.031/2024" },
              { icon: Factory, title: "Feito para Fábricas", desc: "Desenvolvido por especialistas em nutrição animal" },
              { icon: Beaker, title: "Qualidade Total", desc: "Controle completo de processos, análises e rastreabilidade" },
              { icon: BarChart3, title: "Dados em Tempo Real", desc: "Indicadores, dashboards e relatórios automatizados" },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <img src={logoBpfConsult} alt="BPF_Consult" className="mx-auto w-12 h-12 object-contain mb-3 opacity-60" />
        <p className="text-sm text-muted-foreground">BPF_Consult © {new Date().getFullYear()} — Soluções em BPF para Nutrição Animal</p>
      </footer>
    </div>
  );
}
