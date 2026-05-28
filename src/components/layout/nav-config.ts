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
  // --- NAVEGAÇÃO PRINCIPAL (FLAT) ---
  { path: "/dashboard", label: "Dashboard Principal", icon: LayoutDashboard },
  { path: "/cadastro", label: "Dados da Empresa", icon: Building2 },

  // --- GESTÃO OPERACIONAL (AGORA SEPARADO) ---
  { path: "/pcp", label: "PCP / Sequenciamento", icon: CalendarDays, keywords: ["planejamento", "programação", "sequenciamento", "ordem"] },
  { path: "/producao", label: "Controle de Produção", icon: Layers, keywords: ["fabricação", "lote", "rendimento"] },
  { path: "/rastreabilidade", label: "Rastreabilidade", icon: History, keywords: ["lote", "origem", "destino", "recall"] },
  { path: "/expedicao", label: "Expedição", icon: Truck, keywords: ["carregamento", "transporte", "entrega"] },
  { path: "/fornecedores", label: "Controle de Fornecedores", icon: Users, keywords: ["parceiros", "compras", "homologação"] },
  { path: "/recebimento", label: "Recebimento de MP", icon: ClipboardList, keywords: ["matéria-prima", "conferência", "entrada"] },
  { path: "/produtos", label: "Cadastro de Produtos", icon: Package, keywords: ["itens", "mercadoria", "sku"] },
  { path: "/formulas", label: "Fórmulas de Produção", icon: FlaskConical, keywords: ["receita", "composição", "mistura"] },
  { path: "/status-lotes", label: "Status & Fila de Lotes", icon: Tag, keywords: ["estoque", "fifo", "bloqueio", "mp"] },

  // --- QUALIDADE & SEGURANÇA - POPs (SEPARADOS CONFORME SOLICITADO) ---
  { path: "/higiene", label: "POP 01 - Higiene e Sanitização", icon: Droplets, keywords: ["limpeza", "faxina", "sanitização"] },
  { path: "/validacao-limpeza", label: "Validação de Limpeza", icon: CheckCircle2, keywords: ["suabe", "microbiologia", "atp"] },
  { path: "/saude-pessoal", label: "POP 02 - Saúde Pessoal", icon: Activity, keywords: ["aso", "exames", "colaboradores"] },
  { path: "/treinamentos", label: "POP 03 - Treinamentos BPF", icon: GraduationCap, keywords: ["capacitação", "cursos", "conscientização"] },
  { path: "/potabilidade-agua", label: "POP 04 - Controle da Água", icon: Droplets, keywords: ["cloro", "ph", "análise"] },
  { path: "/monitoramento-pcc", label: "POP 05 - Monitoramento PCC", icon: Zap, keywords: ["perigo", "crítico", "limite"] },
  { path: "/manutencao", label: "POP 06 - Manutenção Preventiva", icon: Wrench, keywords: ["máquinas", "equipamentos", "reparo"] },
  { path: "/pragas", label: "POP 07 - Manejo de Pragas", icon: Bug, keywords: ["insetos", "roedores", "controle"] },
  { path: "/residuos", label: "POP 08 - Controle de Resíduos", icon: Trash2, keywords: ["lixo", "efluentes", "descarte"] },
  { path: "/autocontrole", label: "Monitoramento PAC", icon: ClipboardCheck, keywords: ["checklists", "diário", "fiscalização"] },
  { path: "/matriz-risco", label: "Matriz de Risco", icon: ShieldAlert, keywords: ["análise", "perigos", "severidade"] },

  // --- DOCUMENTAÇÃO & REGISTROS (FLAT) ---
  { path: "/manual", label: "Manual Feed_BPF", icon: BookOpen },
  { path: "/documentos", label: "Documentos e Registros", icon: FileText },
  { path: "/execucao-pops", label: "Execução ITs/POPs", icon: Clipboard },
  { path: "/planilhas-pop", label: "Planilhas de POPs", icon: Clipboard },
  { path: "/guia-geral-pops", label: "Guia Geral POPs", icon: ClipboardList },
  { path: "/guia-pops", label: "ITs Detalhadas", icon: FileText },
  { path: "/modelos", label: "Biblioteca de Modelos", icon: FolderOpen },
  { path: "/orientacoes", label: "Central de Orientações", icon: GraduationCap },

  // --- AUDITORIA & MELHORIA (FLAT) ---
  { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
  { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
  { path: "/sala-auditor", label: "🔍 Sala do Auditor", icon: ClipboardCheck },
  { path: "/audit-log", label: "Log de Atividades", icon: History },
  { path: "/checklist-pre-auditoria", label: "Checklist Pré-Auditoria", icon: ClipboardList },
  { path: "/qualidade-total", label: "Qualidade Total (SAC)", icon: MessageSquare },
  { path: "/indicadores", label: "Indicadores de Qualidade", icon: BarChart3 },

  // --- OUTROS ---
  { path: "/modo-tablet", label: "Factory / Modo Tablet", icon: Tablet },

  // --- PORTAL DE GESTÃO (RESTRITO AO ADMIN) ---
  {
    label: "Portal de Gestão & Vendas",
    icon: ShieldAlert,
    items: [
      { 
        path: "/admin", 
        label: "Painel Administrativo Total", 
        icon: ShieldCheck, 
        requiredEmail: [...SUPER_ADMIN_EMAILS] 
      },
      { 
        path: "/marketing", 
        label: "Marketing Hub", 
        icon: Megaphone,
        requiredEmail: [...SUPER_ADMIN_EMAILS]
      },
      { 
        path: "/whatsapp", 
        label: "Configurar WhatsApp", 
        icon: MessageSquare,
        requiredEmail: [...SUPER_ADMIN_EMAILS]
      },
      { 
        path: "/licencas-programa", 
        label: "Licenças do Programa", 
        icon: Key, 
        requiredEmail: [...SUPER_ADMIN_EMAILS] 
      },
      { path: "/rotulos/dashboard", label: "Nutri_Agro Labels", icon: Tag, logo: logoRotulos, requiredEmail: [...SUPER_ADMIN_EMAILS] },
      { path: "https://soil-to-client.lovable.app", label: "Agro RC CRM", icon: BarChart3, logo: logoAgrorc, external: true, requiredEmail: [...SUPER_ADMIN_EMAILS] },
      { path: "https://regional-fixer-charm.lovable.app", label: "AgroGestão CRM", icon: Building2, logo: logoAgrogestao, external: true, requiredEmail: [...SUPER_ADMIN_EMAILS] },
      { path: "https://friendly-flame-igniter.lovable.app", label: "Audits_BPF", icon: ShieldCheck, logo: logoAuditsBpf, external: true, requiredEmail: [...SUPER_ADMIN_EMAILS] },
    ],
  },
];
