import { Link } from "react-router-dom";
import { 
  LayoutDashboard, FileText, ClipboardCheck, AlertTriangle, PackageSearch, 
  Users, Factory, CalendarClock, GitBranch, Bug, GraduationCap, Activity, 
  BarChart3, FileBarChart, Scale, Truck, Droplets, HeartPulse, UserCheck,
  ShieldCheck, Beaker, Wrench, Trash2, FlaskConical, Sparkles, CalendarRange,
  Award, Briefcase, BookOpen, FileSpreadsheet, Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categorias = [
  {
    titulo: "Qualidade",
    cor: "border-primary/30 bg-primary/5",
    modulos: [
      { nome: "Manual BPF / POPs", desc: "Manual de Boas Práticas e Procedimentos Operacionais Padrão completos conforme IN 04/2007.", icon: BookOpen },
      { nome: "Guia de POPs", desc: "Todos os POPs com Instruções de Trabalho (ITs) detalhadas para cada procedimento.", icon: FileText },
      { nome: "Planilhas de POPs", desc: "Planilhas digitais de monitoramento mensal com assinatura do RT e supervisor.", icon: FileSpreadsheet },
      { nome: "Auditoria Interna", desc: "Checklist completo baseado no Decreto 12.031/2024 com cálculo automático de conformidade.", icon: ClipboardCheck },
      { nome: "Sala do Auditor", desc: "Área exclusiva para auditores do MAPA com visão consolidada de todos os registros.", icon: Briefcase },
      { nome: "Não Conformidades", desc: "Registro, análise de causa raiz e planos de ação corretiva/preventiva.", icon: AlertTriangle },
      { nome: "Qualidade Total", desc: "Reclamações de clientes, Recall e recolhimento conforme POP 08.", icon: Award },
    ],
  },
  {
    titulo: "Operacional",
    cor: "border-accent/30 bg-accent/5",
    modulos: [
      { nome: "Recebimento de MP", desc: "Controle de recebimento com análise sensorial, temperatura, contraprova e certificados.", icon: PackageSearch },
      { nome: "Fornecedores", desc: "Qualificação, avaliação periódica e verificação SIPEAGRO de fornecedores.", icon: Users },
      { nome: "Produção", desc: "Registro de produção com lote, operador, contraprova e tempo de mistura.", icon: Factory },
      { nome: "PCP", desc: "Ordens de produção, batidas, fórmulas, carryover e validação de limpeza de linha.", icon: CalendarClock },
      { nome: "Rastreabilidade", desc: "Rastreamento completo MP→Produto→Cliente com controle de Recall.", icon: GitBranch },
      { nome: "Produtos & Rótulos", desc: "Ficha técnica, níveis de garantia e editor de rótulos conforme MAPA.", icon: Sparkles },
      { nome: "Expedição & Transporte", desc: "Inspeção de veículos e armazenamento conforme IN 15/2009.", icon: Truck },
    ],
  },
  {
    titulo: "Controles",
    cor: "border-secondary/30 bg-secondary/5",
    modulos: [
      { nome: "Controle de Pragas", desc: "Monitoramento de pragas, armadilhas e expurgo com laudos da empresa controladora.", icon: Bug },
      { nome: "Treinamentos", desc: "Gestão de treinamentos obrigatórios com controle de validade e certificados.", icon: GraduationCap },
      { nome: "Saúde Pessoal / ASO", desc: "Controle de exames ocupacionais (Coprocultura, VDRL, Hemograma) e validade de ASOs.", icon: HeartPulse },
      { nome: "Potabilidade da Água", desc: "Cloro residual diário, análises microbiológicas e higienização de reservatórios.", icon: Droplets },
      { nome: "Controle de Visitantes", desc: "Registro de visitantes com orientação de biosseguridade e declaração.", icon: UserCheck },
      { nome: "Higiene & Sanitização", desc: "Cronogramas de limpeza pesada e concorrente com registros de execução.", icon: ShieldCheck },
      { nome: "Substâncias Controladas", desc: "Monitoramento de ractopamina, aflatoxinas, metais pesados e dioxinas.", icon: FlaskConical },
    ],
  },
  {
    titulo: "Gestão",
    cor: "border-muted/30 bg-muted/5",
    modulos: [
      { nome: "Indicadores", desc: "Dashboard com KPIs de conformidade, NCs, auditorias e treinamentos.", icon: Activity },
      { nome: "Relatórios", desc: "Geração de relatórios por módulo com exportação em CSV e PDF.", icon: FileBarChart },
      { nome: "Legislação & IA", desc: "Consulta inteligente de normas do MAPA, ANVISA e legislação vigente.", icon: Scale },
      { nome: "Análises Laboratoriais", desc: "Registro de laudos, métodos analíticos e conformidade de resultados.", icon: Beaker },
      { nome: "Manutenção Preventiva", desc: "Equipamentos, calibrações e cronograma de manutenção preventiva/corretiva.", icon: Wrench },
      { nome: "Controle de Resíduos", desc: "Classificação, destinação e manifestos de transporte de resíduos.", icon: Trash2 },
      { nome: "Planejamento Anual", desc: "Cronograma anual de atividades BPF com alertas de vencimento.", icon: CalendarRange },
      { nome: "Matriz de Risco", desc: "Identificação de perigos, avaliação de severidade e probabilidade (APPCC).", icon: BarChart3 },
    ],
  },
];

export default function Vitrine() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <Badge variant="secondary" className="mb-4 text-xs tracking-wider uppercase">
            Sistema de Gestão de Qualidade
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
            Feed<span className="text-primary">BPF</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Plataforma completa de Boas Práticas de Fabricação para nutrição animal, 
            em conformidade com IN 04/2007 e Decreto 12.031/2024.
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

      {/* Módulos */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">Funcionalidades</h2>
          <p className="text-muted-foreground">Conheça todos os módulos disponíveis no sistema</p>
        </div>

        <div className="space-y-12">
          {categorias.map((cat) => (
            <section key={cat.titulo}>
              <h3 className="text-xl font-semibold font-display text-foreground mb-4 flex items-center gap-2">
                <span className="h-1 w-6 rounded-full bg-primary inline-block" />
                {cat.titulo}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.modulos.map((mod) => (
                  <Card key={mod.nome} className={`${cat.cor} transition-all hover:shadow-md`}>
                    <CardContent className="flex gap-4 p-5">
                      <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-background border border-border">
                        <mod.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{mod.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-16 border-t border-border pt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Planos NutriCRM</h2>
            <p className="text-muted-foreground">Escolha o plano ideal para sua empresa</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Mensal */}
            <Card className="border-border hover:shadow-md transition-all">
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mensal</p>
                <div>
                  <span className="text-3xl font-bold text-foreground">R$ 97</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground">Sem compromisso de fidelidade</p>
              </CardContent>
            </Card>
            {/* Semestral */}
            <Card className="border-primary/50 bg-primary/5 hover:shadow-md transition-all relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                14% OFF
              </Badge>
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Semestral</p>
                <div>
                  <span className="text-3xl font-bold text-foreground">R$ 497</span>
                </div>
                <p className="text-xs text-muted-foreground">≈ R$ 83/mês</p>
              </CardContent>
            </Card>
            {/* Anual */}
            <Card className="border-primary/50 bg-primary/5 hover:shadow-md transition-all relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                23% OFF
              </Badge>
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Anual</p>
                <div>
                  <span className="text-3xl font-bold text-foreground">R$ 897</span>
                </div>
                <p className="text-xs text-muted-foreground">≈ R$ 75/mês</p>
              </CardContent>
            </Card>
          </div>
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

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>FeedBPF © {new Date().getFullYear()} — Sistema de Gestão de BPF para Nutrição Animal</p>
      </footer>
    </div>
  );
}