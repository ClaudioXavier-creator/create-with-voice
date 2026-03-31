import { Link } from "react-router-dom";
import { 
  LayoutDashboard, FileText, ClipboardCheck, AlertTriangle, PackageSearch, 
  Users, Factory, CalendarClock, GitBranch, Bug, GraduationCap, Activity, 
  BarChart3, FileBarChart, Scale, Truck, Droplets, HeartPulse, UserCheck,
  ShieldCheck, Beaker, Wrench, Trash2, FlaskConical, Sparkles, CalendarRange,
  Award, Briefcase, BookOpen, FileSpreadsheet, Lock, ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

const produtos = [
  {
    nome: "FeedBPF",
    desc: "Plataforma completa de Boas Práticas de Fabricação para nutrição animal, em conformidade com IN 04/2007 e Decreto 12.031/2024.",
    link: "/feedbpf",
    cor: "border-primary/30 bg-primary/5",
  },
  {
    nome: "Audits_BPF",
    desc: "Sistema de auditoria interna com checklist completo baseado no Decreto 12.031/2024 e sala exclusiva do auditor.",
    link: "/audits-bpf",
    cor: "border-accent/30 bg-accent/5",
  },
  {
    nome: "NutriCRM",
    desc: "CRM especializado para profissionais de nutrição animal. Gestão de clientes, visitas e acompanhamentos.",
    link: "/nutricrm",
    cor: "border-secondary/30 bg-secondary/5",
  },
];

const destaques = [
  { icon: BookOpen, label: "Manual BPF & POPs" },
  { icon: ClipboardCheck, label: "Auditoria Interna" },
  { icon: Factory, label: "Produção & PCP" },
  { icon: GitBranch, label: "Rastreabilidade" },
  { icon: Beaker, label: "Análises Laboratoriais" },
  { icon: ShieldCheck, label: "Higiene & Sanitização" },
  { icon: Bug, label: "Controle de Pragas" },
  { icon: GraduationCap, label: "Treinamentos" },
  { icon: Wrench, label: "Manutenção Preventiva" },
  { icon: BarChart3, label: "Matriz de Risco (APPCC)" },
  { icon: CalendarRange, label: "Planejamento Anual" },
  { icon: Activity, label: "Indicadores & Relatórios" },
];

export default function Vitrine() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <img src={logoBpfConsult} alt="BPF_Consult Logo" className="mx-auto w-28 h-28 sm:w-36 sm:h-36 mb-6 object-contain" />
          <Badge variant="secondary" className="mb-4 text-xs tracking-wider uppercase">
            Consultoria & Sistemas para Nutrição Animal
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
            BPF_<span className="text-primary">Consult</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Soluções completas em Boas Práticas de Fabricação, auditoria e gestão para a indústria de nutrição animal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8">
                <Lock className="h-4 w-4" />
                Acessar Sistema
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Nossos Programas */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">Nossos Programas</h2>
          <p className="text-muted-foreground">Conheça as soluções da BPF_Consult</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {produtos.map((p) => (
            <Link key={p.nome} to={p.link}>
              <Card className={`${p.cor} transition-all hover:shadow-lg hover:-translate-y-1 h-full`}>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold font-display text-foreground">{p.nome}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  <div className="flex items-center gap-1 text-primary text-sm font-medium">
                    Ver planos e detalhes <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Funcionalidades em destaque */}
        <div className="border-t border-border pt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Funcionalidades em Destaque</h2>
            <p className="text-muted-foreground">Principais módulos disponíveis em nossos programas</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {destaques.map((d) => (
              <div key={d.label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-center h-9 w-9 shrink-0 rounded-lg bg-primary/10">
                  <d.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>BPF_Consult © {new Date().getFullYear()} — Soluções em BPF para Nutrição Animal</p>
      </footer>
    </div>
  );
}
