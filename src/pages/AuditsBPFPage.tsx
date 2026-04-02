import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, ClipboardCheck, ShieldCheck, FileBarChart, AlertTriangle, BarChart3, History, Scale, Eye, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import dashboardPreview from "@/assets/auditsbpf-dashboard-preview.jpg";

const funcionalidades = [
  { icon: ClipboardCheck, title: "Checklist Completo", desc: "Checklist de auditoria interna baseado integralmente no Decreto 12.031/2024, com todos os itens exigidos pelo MAPA." },
  { icon: BarChart3, title: "Cálculo Automático", desc: "Cálculo automático de percentual de conformidade por área e geral, com classificação de criticidade." },
  { icon: ShieldCheck, title: "Sala do Auditor MAPA", desc: "Área exclusiva para o auditor acessar documentos, relatórios e evidências durante a auditoria." },
  { icon: FileBarChart, title: "Relatórios Completos", desc: "Relatórios detalhados de auditoria com gráficos, comparativos e exportação em PDF." },
  { icon: AlertTriangle, title: "Planos de Ação", desc: "Registro de não conformidades com plano de ação corretiva e preventiva, prazos e responsáveis." },
  { icon: History, title: "Histórico e Evolução", desc: "Acompanhe a evolução da conformidade ao longo do tempo com gráficos comparativos entre auditorias." },
];

const diferenciais = [
  { icon: Scale, title: "Decreto 12.031/2024", desc: "Checklist 100% atualizado com os itens de verificação exigidos pela nova legislação federal." },
  { icon: Eye, title: "Sala do Auditor", desc: "Área exclusiva onde o fiscal do MAPA acessa todos os documentos e evidências em um só lugar." },
];

export default function AuditsBPFPage() {
  const auditsAppAuthLink = "https://friendly-flame-igniter.lovable.app/auth?redirect=%2Fdashboard";
  const signupLink = auditsAppAuthLink;
  const loginLink = auditsAppAuthLink;

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(140,60%,40%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-2xl" />
              <img src={logoAuditsBpf} alt="Audits_BPF Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">Sistema de Auditoria</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Audits_<span className="text-primary">BPF</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Sistema completo de auditoria interna para BPF em nutrição animal, conforme <strong className="text-foreground">Decreto 12.031/2024</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={signupLink}>
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Testar grátis por 7 dias
                  </Button>
                </a>
                <a href={loginLink}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Já é cadastrado? Acesse o Sistema
                  </Button>
                </a>
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
            alt="Preview do dashboard Audits_BPF com checklist de auditoria, conformidade por área e planos de ação"
            className="w-full h-auto"
            width={1280}
            height={720}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Auditoria profissional completa</h2>
            <p className="text-muted-foreground">Ferramentas essenciais para auditorias internas e preparação para fiscalizações do MAPA</p>
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Por que escolher o Audits_BPF?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos Audits_BPF</h2>
            <p className="text-muted-foreground">Escolha o plano ideal para sua empresa</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { periodo: "Mensal", preco: "R$ 197", sub: "/mês", nota: "Sem compromisso de fidelidade", destaque: false },
              { periodo: "Semestral", preco: "R$ 1.004,70", sub: "", nota: "≈ R$ 167/mês • 15% OFF", destaque: true, badge: "Mais Popular" },
              { periodo: "Anual", preco: "R$ 1.773", sub: "", nota: "≈ R$ 148/mês • 25% OFF", destaque: true, badge: "Melhor Custo" },
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
            <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao Audits_BPF durante o período trial.</p>
            <a href={signupLink}>
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
        <p className="text-sm text-muted-foreground">Audits_BPF © {new Date().getFullYear()} — by BPF_Consult</p>
      </footer>
    </div>
  );
}
