import { useState } from "react";
import {
  BookOpen, LayoutDashboard, Building2, FileText, ClipboardCheck, AlertTriangle,
  Package, Factory, Search, Bug, GraduationCap, BarChart3, PlayCircle, FileDown,
  Scale, Users, Settings, ChevronDown, ChevronRight, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  features: { title: string; text: string }[];
  tips?: string[];
}

const sections: ManualSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description:
      "Tela inicial do sistema com visão geral de todos os indicadores de BPF. Apresenta cards com métricas em tempo real e gráficos de evolução.",
    features: [
      { title: "Cards de Indicadores", text: "Exibe a conformidade BPF geral (%), total de NCs abertas, auditorias realizadas e treinamentos pendentes (vencidos ou a vencer em 30 dias)." },
      { title: "Conformidade por Área", text: "Barras de progresso mostrando o percentual de conformidade de cada área avaliada nas auditorias (Higiene, Instalações, etc.)." },
      { title: "NCs Recentes", text: "Lista as 5 não conformidades mais recentes com setor, descrição e status (Aberta, Em andamento, Fechada)." },
      { title: "Gráfico de NCs", text: "Gráfico de barras mostrando a evolução de NCs abertas vs. fechadas nos últimos 6 meses." },
      { title: "Gráfico de Conformidade", text: "Gráfico de linha mostrando a evolução do percentual de conformidade BPF ao longo dos últimos 6 meses." },
    ],
    tips: ["Os dados são atualizados em tempo real a cada acesso à tela."],
  },
  {
    id: "cadastro",
    title: "Cadastro da Empresa",
    icon: Building2,
    description:
      "Módulo para cadastrar e editar os dados da empresa: razão social, CNPJ, endereço, responsável técnico, CRMV, tipos de produção e capacidade instalada.",
    features: [
      { title: "Dados da Empresa", text: "Formulário para inserir nome, CNPJ, endereço completo, responsável técnico e número do CRMV." },
      { title: "Tipos de Produção", text: "Seleção múltipla dos tipos de produção (ração, suplemento, premix, sal mineral, etc.)." },
      { title: "Capacidade Instalada", text: "Informe a capacidade produtiva mensal da fábrica." },
    ],
  },
  {
    id: "documentos",
    title: "Documentos / POPs",
    icon: FileText,
    badge: "Qualidade",
    description:
      "Gerenciamento de todos os Procedimentos Operacionais Padrão (POPs) e documentos do sistema de qualidade. Controle de versão, status e responsáveis.",
    features: [
      { title: "Cadastro de POPs", text: "Registre código, nome, versão, data de revisão e responsável de cada POP." },
      { title: "Status do Documento", text: "Controle se o documento está Ativo, Em Revisão ou Obsoleto." },
      { title: "Versionamento", text: "Histórico de versões para rastreabilidade de alterações." },
    ],
    tips: ["Mantenha todos os POPs atualizados antes de uma auditoria oficial."],
  },
  {
    id: "execucao-pops",
    title: "Execução de ITs / POPs",
    icon: PlayCircle,
    badge: "Qualidade",
    description:
      "Registro da execução prática das Instruções de Trabalho e POPs no chão de fábrica. Permite rastrear quem executou, quando e qual o resultado.",
    features: [
      { title: "Registro de Execução", text: "Informe o POP executado, data, executor, setor e status (Pendente, Em execução, Concluído, Não conforme)." },
      { title: "Vinculação com Documentos", text: "Cada execução pode ser vinculada ao POP cadastrado no módulo de Documentos." },
      { title: "Observações", text: "Campo livre para anotações sobre desvios, condições especiais ou melhorias identificadas." },
    ],
  },
  {
    id: "auditoria",
    title: "Auditoria BPF",
    icon: ClipboardCheck,
    badge: "Qualidade",
    description:
      "Checklist de auditoria interna baseado no Decreto 12.031/2024 (MAPA). Avalie cada item como Conforme, Não Conforme ou Não Aplicável e gere relatórios de conformidade.",
    features: [
      { title: "Checklist por Área", text: "Itens organizados por áreas: Higiene, Instalações, Equipamentos, Controle de Qualidade, etc." },
      { title: "Avaliação Individual", text: "Marque cada item como conforme ou não conforme, com campo para observações." },
      { title: "Cálculo Automático", text: "O sistema calcula automaticamente o percentual de conformidade por área e geral." },
    ],
    tips: [
      "Realize auditorias periódicas (recomendado: mensal ou trimestral).",
      "Use as observações para registrar evidências fotográficas ou detalhes.",
    ],
  },
  {
    id: "nao-conformidades",
    title: "Não Conformidades",
    icon: AlertTriangle,
    badge: "Qualidade",
    description:
      "Registro e acompanhamento de todas as não conformidades identificadas. Inclui descrição, causa raiz, ação corretiva, responsável e prazo.",
    features: [
      { title: "Registro de NC", text: "Informe data, setor, descrição detalhada, causa raiz e ação corretiva planejada." },
      { title: "Plano de Ação", text: "Defina responsável e prazo para cada ação corretiva. O sistema alerta sobre prazos vencidos." },
      { title: "Status de Acompanhamento", text: "Acompanhe o ciclo: Aberta → Em andamento → Fechada." },
      { title: "IA para Plano de Ação", text: "Utilize inteligência artificial para sugerir causas e ações corretivas automaticamente." },
    ],
  },
  {
    id: "recebimento",
    title: "Recebimento de Matéria-Prima",
    icon: Package,
    badge: "Operacional",
    description:
      "Controle de recebimento e inspeção de matérias-primas. Avalie odor, umidade, presença de insetos e decida pela aprovação ou rejeição do lote.",
    features: [
      { title: "Registro de Recebimento", text: "Informe data, fornecedor, matéria-prima e lote recebido." },
      { title: "Inspeção Visual", text: "Avalie odor (normal/anormal), umidade e presença de insetos (ausente/presente)." },
      { title: "Aprovação/Rejeição", text: "Marque se o lote foi aprovado ou rejeitado. Lotes rejeitados podem gerar NCs automaticamente." },
    ],
  },
  {
    id: "fornecedores",
    title: "Qualificação de Fornecedores",
    icon: Users,
    badge: "Operacional",
    description:
      "Cadastro e avaliação de fornecedores de matérias-primas. Controle de qualificação, notas de avaliação e datas de reavaliação.",
    features: [
      { title: "Cadastro Completo", text: "Nome, CNPJ, endereço, contato, e-mail e tipo de produto fornecido." },
      { title: "Avaliação e Nota", text: "Atribua notas de 0 a 10 e defina o status de qualificação (Aprovado, Pendente, Reprovado)." },
      { title: "Controle de Validade", text: "Registre a última avaliação e a data da próxima avaliação programada." },
    ],
  },
  {
    id: "producao",
    title: "Produção",
    icon: Factory,
    badge: "Operacional",
    description:
      "Registro simplificado de produção diária. Informe produto, lote, operador, tempo de mistura e quantidade produzida.",
    features: [
      { title: "Registro Diário", text: "Cadastre cada produção com data, produto, lote, operador e quantidade." },
      { title: "Tempo de Mistura", text: "Registre o tempo de mistura para controle de qualidade e rastreabilidade." },
    ],
  },
  {
    id: "pcp",
    title: "PCP / Ordens de Produção",
    icon: Settings,
    badge: "Operacional",
    description:
      "Planejamento e Controle de Produção com ordens de produção detalhadas, fórmulas, batidas e rastreabilidade completa.",
    features: [
      { title: "Ordens de Produção", text: "Crie ordens com número, produto, fórmula, quantidade programada, lote e prioridade." },
      { title: "Fórmulas / Itens", text: "Cadastre os itens da fórmula com matéria-prima, quantidade, unidade, percentual e lote." },
      { title: "Batidas de Produção", text: "Registre cada batida com operador, horários, temperatura, tempo de mistura e observações." },
      { title: "Status da Ordem", text: "Acompanhe: Programada → Em produção → Concluída → Cancelada." },
    ],
    tips: ["Vincule os lotes de MP recebidos às fórmulas para rastreabilidade completa."],
  },
  {
    id: "rastreabilidade",
    title: "Rastreabilidade",
    icon: Search,
    badge: "Operacional",
    description:
      "Rastreabilidade bidirecional: do produto final até a matéria-prima e do lote vendido até o cliente. Inclui gestão de recall.",
    features: [
      { title: "Vínculo Produto ↔ MP", text: "Relacione cada produto final com suas matérias-primas, lotes e fornecedores." },
      { title: "Rastreio de Vendas", text: "Registre cliente, local de entrega, nota fiscal, data e quantidade vendida." },
      { title: "Gestão de Recall", text: "Ative recall em um lote, informe motivo e acompanhe o status (Em andamento, Concluído, Cancelado)." },
    ],
    tips: ["Em caso de recall, o sistema identifica rapidamente todos os clientes que receberam o lote afetado."],
  },
  {
    id: "pragas",
    title: "Controle de Pragas",
    icon: Bug,
    badge: "Controles",
    description:
      "Registro de monitoramento e ações de controle de pragas nas instalações da fábrica.",
    features: [
      { title: "Registro de Ocorrências", text: "Informe data, local, tipo de praga identificada e ação tomada." },
      { title: "Responsável", text: "Registre o responsável pela ação (equipe interna ou empresa terceirizada)." },
    ],
  },
  {
    id: "treinamentos",
    title: "Treinamentos",
    icon: GraduationCap,
    badge: "Controles",
    description:
      "Controle de treinamentos dos funcionários com data de realização, instrutor e validade.",
    features: [
      { title: "Cadastro de Treinamento", text: "Registre funcionário, nome do treinamento, data, instrutor e validade." },
      { title: "Alertas de Vencimento", text: "O sistema identifica treinamentos vencidos ou a vencer nos próximos 30 dias e exibe no Dashboard." },
    ],
    tips: ["Mantenha todos os treinamentos de BPF dentro da validade para estar em conformidade com a legislação."],
  },
  {
    id: "indicadores",
    title: "Indicadores",
    icon: BarChart3,
    badge: "Gestão",
    description:
      "Painel de indicadores de desempenho do sistema de qualidade com gráficos e métricas consolidadas.",
    features: [
      { title: "KPIs de Qualidade", text: "Visualize indicadores como taxa de conformidade, NCs por período, treinamentos realizados, etc." },
      { title: "Tendências", text: "Acompanhe a evolução dos indicadores ao longo do tempo com gráficos interativos." },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileDown,
    badge: "Gestão",
    description:
      "Geração e armazenamento de relatórios digitais e digitalizados, organizados por módulo.",
    features: [
      { title: "Relatórios Digitais", text: "Gere relatórios diretamente no sistema com dados consolidados de cada módulo." },
      { title: "Relatórios Digitalizados", text: "Faça upload de relatórios escaneados (laudos, certificados, etc.) e vincule ao módulo correspondente." },
      { title: "Status", text: "Organize relatórios como Ativos ou Arquivados." },
    ],
  },
  {
    id: "legislacao",
    title: "Legislação & IA",
    icon: Scale,
    badge: "Gestão",
    description:
      "Acompanhe atualizações da legislação de alimentação animal (MAPA) com alertas inteligentes gerados por IA.",
    features: [
      { title: "Alertas de Legislação", text: "Receba alertas sobre novas normas, atualizações e revogações relevantes para sua produção." },
      { title: "Classificação por Relevância", text: "Cada alerta é classificado como Alta, Média ou Baixa relevância automaticamente." },
      { title: "Resumo por IA", text: "A IA gera um resumo claro de cada publicação, facilitando o entendimento rápido." },
      { title: "Consulta à IA", text: "Faça perguntas sobre legislação diretamente ao assistente de IA integrado." },
    ],
    tips: ["Marque alertas como lidos para manter o controle do que já foi analisado."],
  },
];

function SectionCard({ section, isOpen, onToggle }: { section: ManualSection; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;

  return (
    <Card className="border border-border transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center gap-3 cursor-pointer">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              {section.badge && (
                <Badge variant="secondary" className="text-xs">{section.badge}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{section.description}</p>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
        </CardHeader>
      </button>

      <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">{section.description}</p>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Funcionalidades:</h4>
            {section.features.map((f, i) => (
              <div key={i} className="flex gap-3 pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">{f.title}:</span>{" "}
                  <span className="text-sm text-muted-foreground">{f.text}</span>
                </div>
              </div>
            ))}
          </div>

          {section.tips && section.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <HelpCircle className="w-4 h-4 text-primary" />
                Dicas
              </div>
              {section.tips.map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-6">• {tip}</p>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export default function Manual() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    sections.forEach((s) => (all[s.id] = true));
    setOpenSections(all);
  };

  const collapseAll = () => setOpenSections({});

  return (
    <>
      <PageHeader icon={BookOpen} title="Manual de Utilização" description="Guia completo de todas as funcionalidades do sistema FeedBPF" />

      <div className="flex gap-2 mb-6">
        <button onClick={expandAll} className="text-sm text-primary hover:underline font-medium">
          Expandir tudo
        </button>
        <span className="text-muted-foreground">|</span>
        <button onClick={collapseAll} className="text-sm text-primary hover:underline font-medium">
          Recolher tudo
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            isOpen={openSections[section.id] ?? false}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </>
  );
}
