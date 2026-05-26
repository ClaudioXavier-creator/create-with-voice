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
  Bug,
  Activity,
  Trash2,
  Zap,
  History,
  CheckCircle2,
  Key,
  ShieldAlert,
  Package,
  FlaskConical,
  Truck,
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

  // --- GESTÃO OPERACIONAL ---
  {
    label: "Gestão Operacional",
    icon: Layers,
    items: [
      { path: "/pcp", label: "PCP / Sequenciamento", icon: CalendarDays, keywords: ["planejamento", "programação", "sequenciamento", "ordem"] },
      { path: "/producao", label: "Controle de Produção", icon: Layers, keywords: ["fabricação", "lote", "rendimento"] },
      { path: "/rastreabilidade", label: "Rastreabilidade", icon: History, keywords: ["lote", "origem", "destino", "recall"] },
      { path: "/expedicao", label: "Expedição", icon: Truck, keywords: ["carregamento", "transporte", "entrega"] },
      { path: "/fornecedores", label: "Controle de Fornecedores", icon: Users, keywords: ["parceiros", "compras", "homologação"] },
      { path: "/recebimento", label: "Recebimento de MP", icon: ClipboardList, keywords: ["matéria-prima", "conferência", "entrada"] },
      { path: "/produtos", label: "Cadastro de Produtos", icon: Package, keywords: ["itens", "mercadoria", "sku"] },
      { path: "/formulas", label: "Fórmulas de Produção", icon: FlaskConical, keywords: ["receita", "composição", "mistura"] },
    ],
  },

  // --- QUALIDADE & SEGURANÇA (POPs) ---
  {
    label: "Qualidade & Segurança",
    icon: ShieldCheck,
    items: [
      { path: "/higiene", label: "Higiene / Sanitização", icon: Droplets },
      { path: "/validacao-limpeza", label: "Validação de Limpeza", icon: CheckCircle2 },
      { path: "/saude-pessoal", label: "Saúde Pessoal", icon: Activity },
      { path: "/treinamentos", label: "Treinamentos BPF", icon: GraduationCap },
      { path: "/potabilidade-agua", label: "Controle da Água", icon: Droplets },
      { path: "/monitoramento-pcc", label: "Monitoramento PCC", icon: Zap },
      { path: "/manutencao", label: "Manutenção Preventiva", icon: Wrench },
      { path: "/pragas", label: "Manejo de Pragas", icon: Bug },
      { path: "/residuos", label: "Controle de Resíduos", icon: Trash2 },
      { path: "/autocontrole", label: "Monitoramento PAC", icon: ClipboardCheck },
      { path: "/matriz-risco", label: "Matriz de Risco", icon: ShieldAlert },
    ],
  },

  // --- DOCUMENTAÇÃO & REGISTROS ---
  {
    label: "Documentação & Registros",
    icon: FileText,
    items: [
      { path: "/manual", label: "Manual Feed_BPF", icon: BookOpen },
      { path: "/documentos", label: "Documentos e Registros", icon: FileText },
      { path: "/execucao-pops", label: "Execução ITs/POPs", icon: Clipboard },
      { path: "/planilhas-pop", label: "Planilhas de POPs", icon: Clipboard },
      { path: "/guia-geral-pops", label: "Guia Geral POPs", icon: ClipboardList },
      { path: "/guia-pops", label: "ITs Detalhadas", icon: FileText },
      { path: "/modelos", label: "Biblioteca de Modelos", icon: FolderOpen },
    ],
  },

  // --- AUDITORIA & MELHORIA ---
  {
    label: "Auditoria & Melhoria",
    icon: ShieldCheck,
    items: [
      { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
      { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
      { path: "/sala-auditor", label: "🔍 Sala do Auditor", icon: ClipboardCheck },
      { path: "/checklist-pre-auditoria", label: "Checklist Pré-Auditoria", icon: ClipboardList },
      { path: "/qualidade-total", label: "Qualidade Total (SAC)", icon: MessageSquare },
      { path: "/indicadores", label: "Indicadores de Qualidade", icon: BarChart3 },
    ],
  },

  // --- ECOSSISTEMA & GROWTH ---
  {
    label: "Ecossistema & Growth",
    icon: Zap,
    items: [
      { path: "/marketing", label: "Marketing Hub", icon: Megaphone },
      { path: "/whatsapp", label: "Configurar WhatsApp", icon: MessageSquare },
      { path: "/modo-tablet", label: "Factory / Modo Tablet", icon: Tablet },
      { path: "/orientacoes", label: "Central de Orientações", icon: GraduationCap },
      { path: "/feedbpf/dashboard", label: "Feed_BPF", icon: LayoutDashboard, logo: logoFeedBpf },
      { path: "https://friendly-flame-igniter.lovable.app", label: "Audits_BPF", icon: ShieldCheck, logo: logoAuditsBpf, external: true },
      { path: "https://soil-to-client.lovable.app", label: "Agro RC CRM", icon: BarChart3, logo: logoAgrorc, external: true },
      { path: "/rotulos/dashboard", label: "Nutri_Agro Labels", icon: Tag, logo: logoRotulos },
      { path: "https://regional-fixer-charm.lovable.app", label: "AgroGestão CRM", icon: Building2, logo: logoAgrogestao, external: true },
    ],
  },

  // --- ADMINISTRAÇÃO ---
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