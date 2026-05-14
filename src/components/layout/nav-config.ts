import {
  AlertTriangle,
  BookOpen,
  Building2,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Tablet,
  Layers,
  Tag,
  BarChart3,
  Users,
  CalendarDays,
  Wrench,
  Droplets,
  Truck,
  Bug,
  Activity,
  Trash2,
  Zap,
  History,
  CheckCircle2,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  keywords?: string[];
  requiredRoles?: string[];
  requiredEmail?: string;
  external?: boolean;
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
  // --- ECOSSISTEMA BPF_CONSULT (7 PROGRAMAS) ---
  {
    label: "Programas BPF_Consult",
    icon: Layers,
    items: [
      { path: "/dashboard", label: "Feed_BPF", icon: LayoutDashboard },
      { path: "https://friendly-flame-igniter.lovable.app", label: "Audits_BPF", icon: ShieldCheck, external: true },
      { path: "https://soil-to-client.lovable.app/dashboard", label: "Agro RC CRM", icon: BarChart3, external: true },
      { path: "/rotulos/dashboard", label: "Nutri_Agro Labels", icon: Tag },
      { path: "https://nutricrm.onrender.com/dashboard", label: "NutriCRM", icon: Users, external: true },
      { path: "https://regional-fixer-charm.lovable.app/dashboard", label: "AgroGestão CRM", icon: Building2, external: true },
      { path: "/admin", label: "Portal de Gestão & CRM", icon: ShieldCheck, requiredRoles: ["admin", "comercial"] },
    ],
  },

  // --- OPERACIONAL FEED_BPF ---
  {
    label: "Operacional Feed_BPF",
    icon: ClipboardCheck,
    items: [
      { path: "/cadastro", label: "Dados da Empresa", icon: Building2 },
      { path: "/fornecedores", label: "Fornecedores", icon: Users },
    ],
  },

  // --- PROGRAMAS POP (IN 04/2007) ---
  {
    label: "POPs - Operacional",
    icon: ClipboardList,
    items: [
      { path: "/recebimento", label: "Recebimento MP", icon: ClipboardList },
      { path: "/producao", label: "Produção", icon: Layers },
      { path: "/pcp", label: "PCP / Sequenciamento", icon: CalendarDays },
      { path: "/rastreabilidade", label: "Rastreabilidade", icon: History },
      { path: "/expedicao", label: "Expedição", icon: Truck },
      { path: "/pragas", label: "Controle de Pragas", icon: Bug },
      { path: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
      { path: "/higiene", label: "Higiene / Sanitização", icon: Droplets },
      { path: "/manutencao", label: "Manutenção / Calibração", icon: Wrench },
      { path: "/potabilidade-agua", label: "Potabilidade da Água", icon: Droplets },
      { path: "/saude-pessoal", label: "Saúde Pessoal", icon: Activity },
      { path: "/visitantes", label: "Controle de Visitantes", icon: Users },
      { path: "/residuos", label: "Resíduos / Efluentes", icon: Trash2 },
      { path: "/substancias", label: "Substâncias e Medicamentos", icon: Zap },
      { path: "/armazenamento-transporte", label: "Armazenamento e Transporte", icon: Building2 },
      { path: "/validacao-limpeza", label: "Validação de Limpeza", icon: CheckCircle2 },
    ],
  },

  // --- GESTÃO DE POPS ---
  {
    label: "Documentos & POPs",
    icon: FileText,
    items: [
      { path: "/documentos", label: "Documentos / POPs", icon: FileText },
      { path: "/execucao-pops", label: "Execução ITs/POPs", icon: Clipboard },
    ],
  },

  // --- OUTROS MÓDULOS ---
  { path: "/orientacoes", label: "🎓 Central de Orientações", icon: GraduationCap },
  {
    label: "Documentação BPF",
    icon: FileText,
    items: [
      { path: "/manual", label: "Manual Feed_BPF", icon: BookOpen },
      { path: "/guia-pops", label: "Guia POPs & ITs", icon: ClipboardList },
      { path: "/planilhas-pop", label: "Planilhas de POPs", icon: Clipboard },
    ],
  },
  {
    label: "Auditoria & Qualidade",
    icon: ShieldCheck,
    items: [
      { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
      { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
      { path: "/sala-auditor", label: "🔍 Sala do Auditor", icon: ClipboardCheck },
    ],
  },
  { path: "/modelos", label: "📁 Modelos", icon: FolderOpen },
  { path: "/modo-tablet", label: "🏭 Modo Tablet", icon: Tablet },
];
