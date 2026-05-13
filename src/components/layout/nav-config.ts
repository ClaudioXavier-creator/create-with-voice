import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Factory,
  FileDown,
  FileSearch,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Package,
  Radar,
  Recycle,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Tablet,
  Tag,
  Timer,
  Truck,
  UserCheck,
  Wrench,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  keywords?: string[];
  requiredRoles?: string[];
  requiredEmail?: string;
}

export interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export const NAV_ENTRIES: NavEntry[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: ["início", "painel"] },
  { path: "/orientacoes", label: "🎓 Central de Orientações", icon: GraduationCap, keywords: ["ajuda", "guia"] },
  { path: "/cadastro", label: "Cadastro", icon: Building2, keywords: ["empresa", "registro"] },
  {
    label: "Documentação",
    icon: FileText,
    items: [
      { path: "/documentos", label: "Documentos / POPs", icon: FileText },
      { path: "/execucao-pops", label: "Execução ITs/POPs", icon: Clipboard },
      { path: "/planilhas-pop", label: "Planilhas de POPs", icon: Clipboard },
      { path: "/manual", label: "Manual Feed_BPF", icon: BookOpen },
      { path: "/guia-pops", label: "Guia POPs & ITs", icon: ClipboardList },
    ],
  },
  {
    label: "POP 01 — Fornecedores & MP",
    icon: Package,
    items: [
      { path: "/recebimento", label: "Recebimento MP", icon: Package },
      { path: "/fornecedores", label: "Qualificação Fornecedores", icon: UserCheck },
      { path: "/analises", label: "Análises Laboratoriais", icon: FlaskConical },
      { path: "/substancias", label: "Substâncias Proibidas", icon: ShieldAlert },
    ],
  },
  {
    label: "POP 02 — Limpeza & Higienização",
    icon: Droplets,
    items: [
      { path: "/higiene", label: "Higiene / Sanitização", icon: Droplets },
      { path: "/validacao-limpeza", label: "Validação Limpeza", icon: ShieldCheck },
    ],
  },
  {
    label: "POP 03 — Saúde do Pessoal",
    icon: HeartPulse,
    items: [
      { path: "/saude-pessoal", label: "Saúde / ASO", icon: HeartPulse },
      { path: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
      { path: "/visitantes", label: "Controle Visitantes", icon: UserCheck },
    ],
  },
  { path: "/potabilidade-agua", label: "POP 04 — Potabilidade da Água", icon: Droplets },
  {
    label: "POP 05 — Controle da Produção e Prevenção da Contaminação Cruzada",
    icon: ShieldAlert,
    items: [
      { path: "/producao", label: "Produção", icon: Factory },
      { path: "/pcp", label: "PCP / Sequenciamento", icon: Settings },
      { path: "/produtos", label: "Produtos / Rótulos", icon: Package },
      { path: "/rotulos", label: "Nutri_Agro Labels", icon: Tag },
      { path: "/formulas", label: "Fórmulas (versionadas)", icon: FileText },
      { path: "/armazenamento-transporte", label: "Armaz. & Transporte", icon: Truck },
    ],
  },
  {
    label: "POP 06 — Manutenção & Calibração",
    icon: Wrench,
    items: [{ path: "/manutencao", label: "Manutenção Preventiva", icon: Wrench }],
  },
  { path: "/pragas", label: "POP 07 — Controle de Pragas", icon: AlertTriangle },
  { path: "/residuos", label: "POP 08 — Resíduos / Efluentes", icon: Recycle },
  {
    label: "POP 09 — Rastreabilidade",
    icon: Search,
    items: [
      { path: "/rastreabilidade", label: "Rastreabilidade / Recall", icon: Search },
      { path: "/expedicao", label: "Expedição & Faturamento", icon: Truck },
      { path: "/simulacao-recall", label: "Simulação Recall", icon: Timer },
    ],
  },
  {
    label: "POP 10 — PAC / Auditoria",
    icon: ClipboardCheck,
    items: [
      { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
      { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
      { path: "/matriz-risco", label: "Matriz de Risco", icon: Radar },
      { path: "/qualidade-total", label: "Qualidade Total", icon: ClipboardList },
      { path: "/checklist-pre-auditoria", label: "Checklist Pré-Auditoria", icon: ShieldCheck },
    ],
  },
  { path: "/sala-auditor", label: "🔍 Sala do Auditor", icon: ClipboardCheck, keywords: ["auditor", "fiscal", "mapa"] },
  {
    label: "Gestão & Relatórios",
    icon: BarChart3,
    items: [
      { path: "/indicadores", label: "Indicadores", icon: BarChart3 },
      { path: "/relatorio-producao", label: "Rel. Produção Mensal", icon: FileDown },
      { path: "/relatorios", label: "Relatórios / Exportar", icon: ScrollText },
      { path: "/planejamento-anual", label: "Planejamento Anual", icon: CalendarDays },
      { path: "/legislacao", label: "Legislação & IA", icon: Globe },
      { path: "/analise-tendencias", label: "Tendências IA", icon: Brain },
      { path: "/geracao-manual-bpf", label: "Gerar Manual BPF", icon: BookOpen },
      { path: "/gerador-pop-ia", label: "Gerar POP por IA", icon: Brain },
      { path: "/consulta-sipeagro", label: "Consulta SIPEAGRO", icon: FileSearch },
      { path: "/busca-global", label: "Busca Global", icon: Search },
    ],
  },
  { 
    path: "/admin", 
    label: "Super Admin (CRM)", 
    icon: ShieldCheck,
    requiredEmail: "claudiolx.nunes@gmail.com"
  },
  { path: "/ativar-licenca", label: "🔑 Ativar Licença", icon: ShieldCheck },
  { path: "/modelos", label: "📁 Modelos", icon: FolderOpen },
  { path: "/modo-tablet", label: "🏭 Modo Tablet", icon: Tablet },
];
