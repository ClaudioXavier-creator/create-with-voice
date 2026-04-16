import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, FileText, ClipboardCheck, AlertTriangle,
  Package, Factory, Search, Bug, GraduationCap, BarChart3, Menu, X, LogOut,
  PlayCircle, FileDown, Scale, ChevronDown, Wrench, Settings, BookOpen, FlaskConical,
  Droplets, Recycle, ShieldAlert, ShieldCheck, CalendarDays, ClipboardList, Truck, Timer,
  Brain, Globe, HeartPulse, UserCheck, Clipboard, FolderOpen, Radar, FileSearch,
  Tablet, ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import EmpresaSelector from "@/components/EmpresaSelector";
import LicenseGate from "@/components/LicenseGate";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo-feed-bpf.png";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const NAV_ENTRIES: NavEntry[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cadastro", label: "Cadastro", icon: Building2 },
  {
    label: "Documentação",
    icon: FileText,
    items: [
      { path: "/documentos", label: "Documentos / POPs", icon: FileText },
      { path: "/execucao-pops", label: "Execução ITs/POPs", icon: PlayCircle },
      { path: "/planilhas-pop", label: "Planilhas de POPs", icon: Clipboard },
      { path: "/manual", label: "Manual BPF", icon: BookOpen },
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
    label: "POP 05 — Contaminação Cruzada",
    icon: ShieldAlert,
    items: [
      { path: "/producao", label: "Produção", icon: Factory },
      { path: "/pcp", label: "PCP / Sequenciamento", icon: Settings },
      { path: "/produtos", label: "Produtos / Rótulos", icon: Package },
      { path: "/formulas", label: "Fórmulas (versionadas)", icon: FileText },
      { path: "/armazenamento-transporte", label: "Armaz. & Transporte", icon: Truck },
    ],
  },
  {
    label: "POP 06 — Manutenção & Calibração",
    icon: Wrench,
    items: [
      { path: "/manutencao", label: "Manutenção Preventiva", icon: Wrench },
    ],
  },
  { path: "/pragas", label: "POP 07 — Controle de Pragas", icon: Bug },
  { path: "/residuos", label: "POP 08 — Resíduos / Efluentes", icon: Recycle },
  {
    label: "POP 09 — Rastreabilidade",
    icon: Search,
    items: [
      { path: "/rastreabilidade", label: "Rastreabilidade / Recall", icon: Search },
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
      { path: "/sala-auditor", label: "Sala do Auditor", icon: ClipboardCheck },
    ],
  },
  {
    label: "Gestão & Relatórios",
    icon: BarChart3,
    items: [
      { path: "/indicadores", label: "Indicadores", icon: BarChart3 },
      { path: "/relatorio-producao", label: "Rel. Produção Mensal", icon: FileDown },
      { path: "/relatorios", label: "Relatórios / Exportar", icon: ScrollText },
      { path: "/planejamento-anual", label: "Planejamento Anual", icon: CalendarDays },
      { path: "/legislacao", label: "Legislação & IA", icon: Scale },
      { path: "/analise-tendencias", label: "Tendências IA", icon: Brain },
      { path: "/geracao-manual-bpf", label: "Gerar Manual BPF", icon: BookOpen },
      { path: "/consulta-sipeagro", label: "Consulta SIPEAGRO", icon: Globe },
      { path: "/busca-global", label: "Busca Global", icon: FileSearch },
    ],
  },
  { path: "/modelos", label: "📁 Modelos", icon: FolderOpen },
  { path: "/modo-tablet", label: "🏭 Modo Tablet", icon: Tablet },
];

function AdminLink({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (!isAdmin) return null;
  const isActive = currentPath === "/admin-licencas";
  return (
    <div className="px-3 pt-2">
      <Link
        to="/admin-licencas"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <ShieldCheck className="w-5 h-5 shrink-0" />
        Admin Licenças
      </Link>
    </div>
  );
}

function SidebarNav({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-open the group that contains the current route
    const initial: Record<string, boolean> = {};
    NAV_ENTRIES.forEach((entry) => {
      if (isGroup(entry)) {
        if (entry.items.some((item) => item.path === currentPath)) {
          initial[entry.label] = true;
        }
      }
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {NAV_ENTRIES.map((entry) => {
        if (!isGroup(entry)) {
          const isActive = currentPath === entry.path;
          return (
            <Link
              key={entry.path}
              to={entry.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <entry.icon className="w-5 h-5 shrink-0" />
              {entry.label}
            </Link>
          );
        }

        const groupOpen = openGroups[entry.label] ?? false;
        const hasActive = entry.items.some((item) => item.path === currentPath);

        return (
          <div key={entry.label}>
            <button
              onClick={() => toggleGroup(entry.label)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
                hasActive
                  ? "text-sidebar-primary-foreground bg-sidebar-primary/60"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <entry.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{entry.label}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-200",
                  groupOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                groupOpen ? "max-h-[800px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
              )}
            >
              <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                {entry.items.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <img src={logoImg} alt="Feed_BPF Logo" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">Feed_BPF</h1>
            <p className="text-xs text-sidebar-foreground/60">by CLXN</p>
          </div>
        </div>
        <SidebarNav currentPath={location.pathname} />
        <AdminLink currentPath={location.pathname} />
        <div className="px-4 py-3 border-t border-sidebar-border space-y-3">
          <EmpresaSelector />
          <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Feed_BPF Logo" className="w-8 h-8 rounded object-contain" />
          <span className="font-display font-bold">Feed_BPF</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 h-full bg-sidebar text-sidebar-foreground pt-16 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <SidebarNav currentPath={location.pathname} onNavigate={() => setMobileOpen(false)} />
            <AdminLink currentPath={location.pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="px-4 py-3 border-t border-sidebar-border">
              <p className="text-xs text-sidebar-foreground/60 truncate px-3 mb-2">{user?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <LicenseGate>
            {children}
          </LicenseGate>
        </div>
      </main>
    </div>
  );
}