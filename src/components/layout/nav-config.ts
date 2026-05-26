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
  Megaphone,
  MessageSquare,
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
  Key,
  ShieldAlert,
} from "lucide-react";

import { SUPER_ADMIN_EMAILS } from "@/config/adminAccess";

import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutricrm from "@/assets/logo-nutricrm.png";
import logoAgrogestao from "@/assets/logo-agrogestao.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  logo?: string;
  keywords?: string[];
  requiredRoles?: string[];
  requiredEmail?: string | string[];
  external?: boolean;
}

export interface NavGroup {
  label: string;
  icon: React.ElementType;
  logo?: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export const NAV_ENTRIES: NavEntry[] = [
  // --- NAVEGAÇÃO PRINCIPAL ---
  { path: "/dashboard", label: "Dashboard Feed_BPF", icon: LayoutDashboard },
  { path: "/cadastro", label: "Dados da Empresa", icon: Building2 },

  // --- PROGRAMAS POP (IN 04/2007) ---
  {
    label: "POP 01 - Fornecedores & MP",
    icon: Users,
    items: [
      { path: "/fornecedores", label: "Controle de Fornecedores", icon: Users },
      { path: "/recebimento", label: "Recebimento de MP", icon: ClipboardList },
      { path: "/guia-pops?pop=POP-01", label: "ITs de Qualificação", icon: FileText },
    ],
  },
  {
    label: "POP 02 - Higiene & Limpeza",
    icon: Droplets,
    items: [
      { path: "/higiene", label: "Higiene / Sanitização", icon: Droplets },
      { path: "/validacao-limpeza", label: "Validação de Limpeza", icon: CheckCircle2 },
      { path: "/guia-pops?pop=POP-02", label: "ITs de Higienização", icon: FileText },
    ],
  },
  {
    label: "POP 03 - Saúde dos Colaboradores",
    icon: Activity,
    items: [
      { path: "/saude-pessoal", label: "Saúde Pessoal", icon: Activity },
      { path: "/treinamentos", label: "Treinamentos BPF", icon: GraduationCap },
      { path: "/guia-pops?pop=POP-03", label: "ITs de Saúde e Higiene", icon: FileText },
    ],
  },
  {
    label: "POP 04 - Potabilidade da Água",
    icon: Droplets,
    items: [
      { path: "/potabilidade-agua", label: "Controle da Água", icon: Droplets },
      { path: "/guia-pops?pop=POP-04", label: "ITs de Potabilidade", icon: FileText },
    ],
  },
  {
    label: "POP 05 - Produção & PCP",
    icon: Layers,
    items: [
      { path: "/produtos", label: "Cadastro de Produtos", icon: Package },
      { path: "/formulas", label: "Fórmulas de Produção", icon: FlaskConical },
      { path: "/producao", label: "Controle de Produção", icon: Layers },
      { path: "/pcp", label: "PCP / Sequenciamento", icon: CalendarDays },
      { path: "/guia-pops?pop=POP-05", label: "ITs de Produção", icon: FileText },
    ],
  },
  {
    label: "POP 06 - Manutenção & Calibração",
    icon: Wrench,
    items: [
      { path: "/manutencao", label: "Manutenção Preventiva", icon: Wrench },
      { path: "/guia-pops?pop=POP-06", label: "ITs de Manutenção", icon: FileText },
    ],
  },
  {
    label: "POP 07 - Controle de Pragas",
    icon: Bug,
    items: [
      { path: "/pragas", label: "Manejo de Pragas", icon: Bug },
      { path: "/guia-pops?pop=POP-07", label: "ITs de Pragas", icon: FileText },
    ],
  },
  {
    label: "POP 08 - Resíduos & Efluentes",
    icon: Trash2,
    items: [
      { path: "/residuos", label: "Controle de Resíduos", icon: Trash2 },
      { path: "/guia-pops?pop=POP-08", label: "ITs de Resíduos", icon: FileText },
    ],
  },
  {
    label: "POP 09 - Rastreabilidade & Recall",
    icon: History,
    items: [
      { path: "/rastreabilidade", label: "Rastreabilidade", icon: History },
      { path: "/expedicao", label: "Expedição", icon: Truck },
      { path: "/guia-pops?pop=POP-09", label: "ITs de Rastreabilidade", icon: FileText },
    ],
  },
  {
    label: "POPs 10/11/12 - Armazenamento & PAC",
    icon: Building2,
    items: [
      { path: "/armazenamento-transporte", label: "Armazenamento", icon: Building2 },
      { path: "/substancias", label: "Substâncias / Zap", icon: Zap },
      { path: "/guia-pops?pop=POP-10", label: "Programa PAC", icon: ClipboardCheck },
      { path: "/visitantes", label: "Visitantes", icon: Users },
      { path: "/whatsapp", label: "Configurar WhatsApp", icon: MessageSquare },
    ],
  },

  // --- GESTÃO DE DOCUMENTOS ---
  {
    label: "Gestão de Documentos",
    icon: FileText,
    items: [
      { path: "/documentos", label: "Documentos e Registros", icon: FileText },
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
      { path: "/guia-geral-pops", label: "Guia Geral POPs", icon: ClipboardList },
      { path: "/guia-pops", label: "ITs Detalhadas", icon: Clipboard },
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
  {
    label: "Marketing & Growth",
    icon: Megaphone,
    items: [
      { path: "/marketing", label: "Marketing Hub", icon: Megaphone },
      { path: "/gerador-headlines", label: "Gerador de Headlines", icon: Zap },
      { path: "/whatsapp", label: "Configurar WhatsApp", icon: MessageSquare },
    ],
  },

  // --- ECOSSISTEMA BPF_CONSULT ---
  {
    label: "Ecossistema BPF_Consult",
    icon: LayoutDashboard,
    items: [
      { path: "/feedbpf/dashboard", label: "Feed_BPF", icon: LayoutDashboard, logo: logoFeedBpf },
      { path: "https://friendly-flame-igniter.lovable.app", label: "Audits_BPF", icon: ShieldCheck, logo: logoAuditsBpf, external: true },
      { path: "https://soil-to-client.lovable.app", label: "Agro RC CRM", icon: BarChart3, logo: logoAgrorc, external: true },
      { path: "/rotulos/dashboard", label: "Nutri_Agro Labels", icon: Tag, logo: logoRotulos },
      // NutriCRM temporariamente removido — produto em manutenção.
      { path: "https://regional-fixer-charm.lovable.app", label: "AgroGestão CRM", icon: Building2, logo: logoAgrogestao, external: true },
    ],
  },
  
  // --- ADMINISTRAÇÃO (SUPERADMIN) ---
  {
    label: "Administração",
    icon: ShieldAlert,
    items: [
      { 
        path: "/licencas-programa", 
        label: "Licenças do Programa", 
        icon: Key, 
        requiredEmail: [...SUPER_ADMIN_EMAILS] 
      },
      { 
        path: "/admin", 
        label: "Portal de Gestão Total", 
        icon: ShieldCheck, 
        requiredEmail: [...SUPER_ADMIN_EMAILS] 
      },
    ],
  },
];