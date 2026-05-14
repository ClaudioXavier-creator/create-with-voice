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
  LayoutGrid,
  ClipboardList as AuditIcon,
  UserSquare2,
  Database,
  Users2,
  Tags,
  Settings2,
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
  // --- GRUPO 1: PROGRAMAS FIXOS BPF_CONSULT ---
  {
    label: "Programas BPF_Consult",
    icon: LayoutGrid,
    items: [
      { path: "/feedbpf/dashboard", label: "1. Feed_BPF", icon: Factory },
      { path: "https://friendly-flame-igniter.lovable.app/dashboard", label: "2. Audits_BPF", icon: AuditIcon, external: true },
      { path: "https://soil-to-client.lovable.app/dashboard", label: "3. Agro RC CRM", icon: UserSquare2, external: true },
      { path: "https://regional-fixer-charm.lovable.app/dashboard", label: "4. Agrogestão CRM", icon: Database, external: true },
      { path: "https://nutricrm.onrender.com/dashboard", label: "5. NutriCRM", icon: Users2, external: true },
      { path: "/rotulos/dashboard", label: "6. Nutri_Agro Labels", icon: Tags },
      { path: "/admin", label: "7. Gestão do Site BPF", icon: Settings2, requiredRoles: ["admin"] },
    ],
  },
  
  // --- GRUPO 2: OPERACIONAL FEED_BPF ---
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
