import { Link } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, BookOpen, Factory, GitBranch, ShieldCheck, Beaker, Bug, Wrench, BarChart3, CalendarRange, ClipboardCheck, Droplets, GraduationCap, Activity, Lock, FileCheck, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import dashboardPreview from "@/assets/feedbpf-dashboard-preview.jpg";

const funcionalidades = [
  { icon: BookOpen, title: "Manual BPF Completo", desc: "Manual de Boas Práticas de Fabricação com todos os capítulos exigidos pela IN 04/2007." },
  { icon: ClipboardCheck, title: "POPs Digitais", desc: "Procedimentos Operacionais Padrão digitais com planilhas de monitoramento integradas." },
  { icon: Factory, title: "Produção & PCP", desc: "Ordens de produção, fórmulas, batidas, controle de lotes e planejamento da produção." },
  { icon: GitBranch, title: "Rastreabilidade Total", desc: "Rastreabilidade completa MP → Produto → Cliente com controle de recall." },
  { icon: ShieldCheck, title: "Higiene & Sanitização", desc: "Cronogramas de limpeza, registros de execução e validação de limpeza de linha." },
  { icon: Bug, title: "Controle de Pragas", desc: "Registro e monitoramento de ocorrências com plano de ação integrado." },
  { icon: Beaker, title: "Análises Laboratoriais", desc: "Registro de análises, laudos e controle de substâncias indesejáveis." },
  { icon: GraduationCap, title: "Treinamentos", desc: "Gestão completa de treinamentos dos colaboradores com controle de vencimento." },
  { icon: Wrench, title: "Manutenção Preventiva", desc: "Programação de manutenções, calibrações e histórico de equipamentos." },
  { icon: BarChart3, title: "Matriz de Risco (APPCC)", desc: "Análise de perigos e pontos críticos de controle com matriz de probabilidade x severidade." },
  { icon: CalendarRange, title: "Planejamento Anual", desc: "Cronograma anual de atividades com acompanhamento de execução." },
  { icon: Activity, title: "Indicadores & Relatórios", desc: "Dashboards em tempo real, indicadores de conformidade e relatórios automatizados." },
];

const diferenciais = [
  { icon: FileCheck, title: "100% Conforme IN 04/2007", desc: "Todos os documentos, procedimentos e registros exigidos pela legislação, prontos para uso." },
  { icon: Lock, title: "Dados Seguros & Isolados", desc: "Cada empresa acessa apenas seus próprios dados, com criptografia e backup automático na nuvem." },
];

export default function FeedBPFPage() {
  const signupLink = "/auth?product=feedbpf&mode=signup&redirect=%2Fdashboard";
  const loginLink = "/auth?product=feedbpf&mode=login&redirect=%2Fdashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(200,80%,50%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-sky-500/10 blur-2xl" />
              <img src={logoFeedBpf} alt="Feed_BPF Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">Sistema de Gestão BPF</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Feed_<span className="text-primary">BPF</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Plataforma completa de Boas Práticas de Fabricação para nutrição animal. 
                Em conformidade com <strong className="text-foreground">IN 04/2007</strong> e <strong className="text-foreground">Decreto 12.031/2024</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={signupLink}>
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Testar grátis por 7 dias
                  </Button>
                </Link>
                <Link to={loginLink}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Já é cadastrado? Acesse o Sistema
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sem cartão de crédito • Acesso completo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Preview do Dashboard */}
      <section className="max-w-5xl mx-auto px-4 -mt-4 mb-12 sm:mb-16">
        <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
          <img
            src={dashboardPreview}
            alt="Preview do dashboard Feed_BPF com ordens de produção, POPs e rastreabilidade"
            className="w-full h-auto"
            width={1280}
            height={720}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Funcionalidades */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Tudo que sua fábrica precisa</h2>
            <p className="text-muted-foreground">Mais de 30 módulos integrados em uma única plataforma</p>
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

        {/* Diferenciais */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Diferenciais</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Por que escolher o Feed_BPF?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-sky-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{d.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section>
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Planos e Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos Feed_BPF</h2>
            <p className="text-muted-foreground">Três níveis × três periodicidades — escolha o ideal para sua empresa</p>
          </div>

          {[
            {
              nivel: "Entrada",
              desc: "Para fábricas iniciando a estruturação BPF",
              destaque: false,
              planos: [
                { periodo: "Mensal", preco: "R$ 495", sub: "/mês", nota: "Sem compromisso de fidelidade" },
                { periodo: "Semestral", preco: "R$ 2.524,50", sub: "", nota: "≈ R$ 420,75/mês • 15% OFF", badge: "15% OFF" },
                { periodo: "Anual", preco: "R$ 4.455", sub: "", nota: "≈ R$ 371,25/mês • 25% OFF", badge: "25% OFF" },
              ],
            },
            {
              nivel: "Intermediário",
              desc: "Para fábricas em consolidação operacional",
              destaque: true,
              planos: [
                { periodo: "Mensal", preco: "R$ 890", sub: "/mês", nota: "Sem compromisso de fidelidade" },
                { periodo: "Semestral", preco: "R$ 4.539", sub: "", nota: "≈ R$ 756,50/mês • 15% OFF", badge: "15% OFF" },
                { periodo: "Anual", preco: "R$ 8.010", sub: "", nota: "≈ R$ 667,50/mês • 25% OFF", badge: "25% OFF" },
              ],
            },
            {
              nivel: "Avançado",
              desc: "Para fábricas com gestão completa e auditoria MAPA",
              destaque: false,
              planos: [
                { periodo: "Mensal", preco: "R$ 1.490", sub: "/mês", nota: "Sem compromisso de fidelidade" },
                { periodo: "Semestral", preco: "R$ 7.599", sub: "", nota: "≈ R$ 1.266,50/mês • 15% OFF", badge: "15% OFF" },
                { periodo: "Anual", preco: "R$ 13.410", sub: "", nota: "≈ R$ 1.117,50/mês • 25% OFF", badge: "25% OFF" },
              ],
            },
          ].map((tier) => (
            <div key={tier.nivel} className="mb-10">
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold font-display text-foreground">
                  Plano {tier.nivel}
                  {tier.destaque && (
                    <Badge className="ml-2 bg-primary text-primary-foreground text-xs">Mais Popular</Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{tier.desc}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
                {tier.planos.map((plan) => (
                  <Card
                    key={plan.periodo}
                    className={`transition-all hover:shadow-xl relative ${
                      tier.destaque ? "border-primary/40 bg-primary/5" : "border-border"
                    }`}
                  >
                    {plan.badge && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs shadow-lg">
                        {plan.badge}
                      </Badge>
                    )}
                    <CardContent className="p-5 text-center space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{plan.periodo}</p>
                      <div>
                        <span className="text-2xl font-bold text-foreground">{plan.preco}</span>
                        <span className="text-muted-foreground text-sm">{plan.sub}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.nota}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold font-display text-foreground mb-3">Experimente grátis por 7 dias!</h3>
            <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao Feed_BPF durante o período trial.</p>
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
        <img src={logoBpfConsult} alt="BPF_Consult" className="mx-auto w-10 h-10 object-contain mb-2 opacity-60" />
        <p className="text-sm text-muted-foreground">Feed_BPF © {new Date().getFullYear()} — by BPF_Consult</p>
      </footer>
    </div>
  );
}
