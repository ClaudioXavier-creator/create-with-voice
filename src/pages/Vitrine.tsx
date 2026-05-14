import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, ShieldCheck, Factory, Beaker, BarChart3, GraduationCap, ClipboardCheck, Sparkles, Building2, Users, LayoutDashboard, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoNutriCrm from "@/assets/logo-nutricrm.png";
import logoAgroGestao from "@/assets/logo-agrogestao.png";

type ProdutoCard = {
  nome: string;
  logo: string;
  desc: string;
  destaques: string[];
  link: string;
  appLink?: string;
  gradient: string;
  bgCard: string;
  borderColor: string;
  trial: string;
  trialLink: string;
  demoLink?: string;
  preco: string;
  external?: boolean;
  trialExternal?: boolean;
  adminOnly?: boolean;
  icon?: React.ElementType;
};

const produtos: ProdutoCard[] = [
  {
    nome: "Feed_BPF",
    icon: LayoutDashboard,
    logo: logoFeedBpf,
    desc: "Plataforma completa de Boas Práticas de Fabricação para nutrição animal. Manual BPF, POPs digitais, planilhas de monitoramento, produção, PCP, rastreabilidade, controle de pragas, higiene e muito mais.",
    destaques: ["Manual BPF & POPs", "Produção & PCP", "Rastreabilidade", "Higiene & Manutenção", "Matriz de Risco (APPCC)", "Indicadores & Relatórios"],
    link: "/feedbpf",
    appLink: "/feedbpf/dashboard",
    gradient: "from-[hsl(200,80%,45%)] to-[hsl(210,90%,30%)]",
    bgCard: "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30",
    borderColor: "border-sky-200 dark:border-sky-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=feedbpf&mode=signup&redirect=%2Ffeedbpf%2Fdashboard",
    demoLink: "/demo/feedbpf",
    preco: "A partir de R$ 495/mês",
  },
  {
    nome: "Audits_BPF",
    icon: ShieldCheck,
    logo: logoAuditsBpf,
    desc: "Sistema de auditoria interna com checklist completo baseado no Decreto 12.031/2024. Sala exclusiva do auditor MAPA, cálculo automático de conformidade e planos de ação.",
    destaques: ["Checklist Decreto 12.031", "Sala do Auditor", "Planos de Ação", "Cálculo de Conformidade", "Relatórios de Auditoria", "Histórico e Evolução"],
    link: "https://friendly-flame-igniter.lovable.app",
    appLink: "https://friendly-flame-igniter.lovable.app",
    gradient: "from-[hsl(140,60%,35%)] to-[hsl(160,70%,25%)]",
    bgCard: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    trial: "7 dias grátis",
    trialLink: "https://friendly-flame-igniter.lovable.app/auth?mode=signup",
    demoLink: "/demo/auditsbpf",
    preco: "A partir de R$ 249/mês",
    external: true,
    trialExternal: true,
  },
  {
    nome: "Agro RC CRM",
    icon: BarChart3,
    logo: logoAgrorc,
    desc: "Plataforma de gestão para Representantes Comerciais do agronegócio. Controle de clientes, metas, visitas, pipeline de oportunidades Kanban e painel RC com margens e scores.",
    destaques: ["Painel RC", "Pipeline Kanban", "Metas Comerciais", "Visitas a Campo", "Clientes & Carteira", "Scores de Desempenho"],
    link: "https://soil-to-client.lovable.app",
    appLink: "https://soil-to-client.lovable.app",
    gradient: "from-[hsl(270,70%,45%)] to-[hsl(290,80%,30%)]",
    bgCard: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    trial: "7 dias grátis",
    trialLink: "https://soil-to-client.lovable.app/auth?mode=signup",
    demoLink: "/demo/agrorc",
    preco: "A partir de R$ 97/mês",
    external: true,
    trialExternal: true,
  },
  {
    nome: "Nutri_Agro Labels",
    icon: Tag,
    logo: logoRotulos,
    desc: "Gerador de rótulos para impressão em Zebra, Word e Excel — desenvolvido para nutrição animal, fábricas de rações e suplementos. Conforme MAPA (RTPI).",
    destaques: ["Impressão Zebra (ZPL)", "Exportação Word & Excel", "Ficha Técnica RTPI", "Níveis de Garantia", "QR Code & Lote", "Templates p/ Rações"],
    link: "/rotulos",
    appLink: "/rotulos/dashboard",
    gradient: "from-[hsl(170,70%,40%)] to-[hsl(180,80%,25%)]",
    bgCard: "bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=rotulos&mode=signup&redirect=%2Frotulos%2Fdashboard",
    demoLink: "/demo/rotulos",
    preco: "A partir de R$ 97/mês",
  },
  {
    nome: "NutriCRM",
    icon: Users,
    logo: logoNutriCrm,
    desc: "CRM especializado para nutricionistas e representantes técnicos do agronegócio. Gestão de clientes, visitas, recomendações e acompanhamento de campo.",
    destaques: ["Gestão de Clientes", "Visitas Técnicas", "Recomendações", "Pipeline de Vendas", "Painel do Representante", "Relatórios"],
    link: "https://nutricrm.onrender.com",
    appLink: "https://nutricrm.onrender.com",
    gradient: "from-[hsl(20,80%,45%)] to-[hsl(35,90%,35%)]",
    bgCard: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    trial: "7 dias grátis",
    trialLink: "https://nutricrm.onrender.com/auth?mode=signup",
    demoLink: "/demo/nutricrm",
    preco: "A partir de R$ 97/mês",
    external: true,
    trialExternal: true,
  },
  {
    nome: "AgroGestão CRM",
    icon: Building2,
    logo: logoAgroGestao,
    desc: "Plataforma de CRM e gestão para o agronegócio. Controle completo de carteira, oportunidades, equipe comercial e indicadores de desempenho.",
    destaques: ["CRM Completo", "Carteira de Clientes", "Pipeline Comercial", "Equipe & Metas", "Indicadores", "Painel Gerencial"],
    link: "https://regional-fixer-charm.lovable.app",
    external: true,
    appLink: "https://regional-fixer-charm.lovable.app",
    gradient: "from-[hsl(220,70%,45%)] to-[hsl(240,80%,30%)]",
    bgCard: "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    trial: "7 dias grátis",
    trialLink: "https://regional-fixer-charm.lovable.app/auth?mode=signup",
    trialExternal: true,
    demoLink: "/demo/agrogestao",
    preco: "A partir de R$ 97/mês",
  },
  {
    nome: "Portal de Gestão",
    icon: ShieldCheck,
    logo: logoBpfConsult,
    desc: "Plataforma central de gestão da BPF_Consult. Controle total de leads, pipeline de vendas CRM e gestão centralizada de licenças para todos os programas do ecossistema.",
    destaques: ["Gestão de Leads", "CRM de Vendas", "Gestão de Licenças", "Painel Super Admin", "Consolidação de Dados", "Relatórios de Vendas"],
    link: "/admin",
    appLink: "/admin",
    gradient: "from-slate-700 to-slate-900",
    bgCard: "bg-slate-50 dark:bg-slate-900/40",
    borderColor: "border-slate-300 dark:border-slate-700",
    trial: "Acesso Restrito",
    trialLink: "/auth?product=admin",
    preco: "Uso Interno Admin",
    adminOnly: true,
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
  const produtosVisiveis = produtos;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-28">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
              <img
                src={logoBpfConsult}
                alt="BPF_Consult Logo"
                className="relative w-28 h-28 sm:w-44 sm:h-44 object-contain drop-shadow-xl"
              />
            </div>
            <Badge variant="secondary" className="mb-4 sm:mb-5 text-[10px] sm:text-xs tracking-widest uppercase px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
              Consultoria & Sistemas para Nutrição Animal
            </Badge>
            <h1 translate="no" className="text-3xl sm:text-6xl lg:text-7xl font-bold font-display text-foreground mb-4 sm:mb-5 tracking-tight leading-tight notranslate">
              BPF_<span className="text-primary">Consult</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Soluções completas em <strong className="text-foreground">Boas Práticas de Fabricação</strong>, auditoria e gestão para a indústria de nutrição animal. 
              Conformidade com IN 04/2007 e Decreto 12.031/2024.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto max-w-sm sm:max-w-none">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Lock className="h-4 w-4" />
                  Acessar Sistema
                </Button>
              </Link>
              <a href="#programas" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 px-8 text-base bg-background/50 backdrop-blur-sm">
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
            {produtosVisiveis.length} soluções, um ecossistema completo
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Clique em cada programa para ver o tutorial completo, funcionalidades e planos de preço.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosVisiveis.map((p) => (
            <div key={p.nome} className="group cursor-pointer" onClick={() => {
              const target = p.appLink || p.link;
              if (p.external) {
                window.open(target, "_blank", "noopener,noreferrer");
                return;
              }
              // Vai direto para o programa (ProtectedRoute redireciona para /auth se não logado)
              navigate(target);
            }}>
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
                    {p.trialExternal ? (
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
                    {p.demoLink && (
                      <Link to={p.demoLink} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          Ver demonstração
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-3">Por que escolher a <span translate="no" className="notranslate">BPF_Consult</span>?</h2>
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
        <p className="text-sm text-muted-foreground"><span translate="no" className="notranslate">BPF_Consult</span> © {new Date().getFullYear()} — Soluções em BPF para Nutrição Animal</p>
      </footer>
    </div>
  );
}
