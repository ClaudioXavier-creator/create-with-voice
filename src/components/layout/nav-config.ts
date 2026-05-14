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
  Users,
  CreditCard,
  Smartphone,
  Shield,
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
  // --- GRUPO 1: PROGRAMAS FIXOS ---
  {
    label: "Meus Programas (Fixos)",
    icon: LayoutDashboard,
    items: [
      { path: "https://regional-fixer-charm.lovable.app", label: "1. AgroGestão Completa", icon: Factory, external: true },
      { path: "https://soil-to-client.lovable.app", label: "2. CRM Clientes", icon: Users, external: true },
      { path: "/assinaturas", label: "3. Financeiro", icon: CreditCard },
      { path: "/recebimento", label: "4. Estoque", icon: Package },
      { path: "/indicadores", label: "5. Relatórios BI", icon: BarChart3 },
      { path: "/modo-tablet", label: "6. Vendas Mobile", icon: Smartphone },
      { path: "/admin", label: "7. Configurações Admin", icon: Shield, requiredRoles: ["admin"] },
    ],
  },
  
  // --- GRUPO 2: OPERACIONAL FEED_BPF (Mantendo compatibilidade) ---
  {
    label: "Operacional Feed_BPF",
    icon: ClipboardCheck,
    items: [
      { path: "/dashboard", label: "Painel Geral", icon: LayoutDashboard },
      { path: "/cadastro", label: "Dados da Empresa", icon: Building2 },
      { path: "/documentos", label: "Documentos / POPs", icon: FileText },
      { path: "/execucao-pops", label: "Execução ITs/POPs", icon: Clipboard },
    ],
  },

  // --- OUTROS MÓDULOS (Opcionais/Secundários) ---
  { path: "/orientacoes", label: "🎓 Central de Orientações", icon: GraduationCap },
  {
    label: "POP 05 — Produção",
    icon: ShieldAlert,
    items: [
      { path: "/producao", label: "Produção", icon: Factory },
      { path: "/pcp", label: "PCP / Sequenciamento", icon: Settings },
      { path: "/rotulos", label: "Nutri_Agro Labels", icon: Tag },
    ],
  },
  {
    label: "Auditoria & Qualidade",
    icon: ClipboardCheck,
    items: [
      { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
      { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
      { path: "/sala-auditor", label: "🔍 Sala do Auditor", icon: ClipboardCheck },
    ],
  },
  { path: "/modelos", label: "📁 Modelos", icon: FolderOpen },
];
