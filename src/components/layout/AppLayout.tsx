import { useEffect, useState, memo, Suspense, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LogOut,
  Menu,
  Target,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import EmpresaSelector from "@/components/EmpresaSelector";
import LicenseGate from "@/components/LicenseGate";
import TierGate from "@/components/TierGate";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutricrm from "@/assets/logo-nutricrm.png";
import logoAgrogestao from "@/assets/logo-agrogestao.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-rotulos-bpf.png";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { NAV_ENTRIES } from "@/components/layout/nav-config";
import OfflineBanner from "@/components/OfflineBanner";
import PageLoader from "@/components/PageLoader";

const PRODUCT_CONFIGS: Record<string, { logo: string; title: string; subtitle: string }> = {
  feedbpf: {
    logo: logoFeedBpf,
    title: "Feed_BPF",
    subtitle: "BPF Consult",
  },
  nutricrm: {
    logo: logoNutricrm,
    title: "NutriCRM",
    subtitle: "CRM Especializado",
  },
  agrogestao: {
    logo: logoAgrogestao,
    title: "AgroGestão CRM",
    subtitle: "Gestão Regional",
  },
  agrorc: {
    logo: logoAgrorc,
    title: "Agro RC CRM",
    subtitle: "Representantes",
  },
  auditsbpf: {
    logo: logoAuditsBpf,
    title: "Audits_BPF",
    subtitle: "Auditoria Interna",
  },
  rotulos: {
    logo: logoRotulos,
    title: "Nutri_Agro Labels",
    subtitle: "Gerador de Rótulos",
  },
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { product: urlProduct } = useParams();
  const product = urlProduct || "feedbpf";
  const config = PRODUCT_CONFIGS[product] || PRODUCT_CONFIGS.feedbpf;
  
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  
  const canCRM = !!roles?.includes("admin") || !!roles?.includes("comercial");

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);

      if (!isTyping && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (location.pathname !== "/busca-global") {
          navigate("/busca-global");
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [location.pathname, navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background/50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="relative group cursor-pointer" onClick={() => navigate("/")}>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img src={config.logo} alt={`${config.title} Logo`} className="relative w-10 h-10 rounded-lg object-contain bg-white p-1 shadow-sm" />
          </div>
          <div className="min-w-0 cursor-pointer" onClick={() => navigate("/")}>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground tracking-tight">{config.title}</h1>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-4">
            <button 
              onClick={() => navigate("/busca-global")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all text-xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar ferramentas...</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/40">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <SidebarNav 
            currentPath={location.pathname} 
            entries={NAV_ENTRIES} 
            userRoles={roles || []} 
            userEmail={user?.email || ""}
          />
        </div>

        <div className="mt-auto px-4 py-4 border-t border-sidebar-border/50 space-y-3 bg-sidebar/30">
          <EmpresaSelector />
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] font-medium text-sidebar-foreground/50 truncate max-w-[140px]">{user?.email}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-sidebar text-sidebar-foreground border-b border-sidebar-border/50 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0" onClick={() => navigate("/")}>
          <img src={config.logo} alt={`${config.title} Logo`} className="w-8 h-8 rounded bg-white p-0.5 object-contain" />
          <div className="min-w-0">
            <span className="font-display font-bold block truncate tracking-tight">{config.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate("/busca-global")} className="h-9 w-9 text-sidebar-foreground/70">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="h-9 w-9 text-sidebar-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={closeMobile}>
          <aside className="w-[280px] sm:w-80 h-full bg-sidebar text-sidebar-foreground pt-16 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-4 border-b border-sidebar-border/50">
              <EmpresaSelector />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <SidebarNav 
                currentPath={location.pathname} 
                entries={NAV_ENTRIES} 
                onNavigate={closeMobile} 
                userRoles={roles || []}
                userEmail={user?.email || ""}
              />
            </div>
            <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/20">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Premium</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 h-10 px-4 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sair da conta
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-[56px] lg:mt-0 overflow-x-hidden relative">
        <OfflineBanner />
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto min-h-full animate-fade-in">
          <LicenseGate product={product as any}>
            <TierGate>
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </TierGate>
          </LicenseGate>
        </div>
        
        {/* Floating elements backdrop decoration */}
        <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl opacity-50 pointer-events-none -translate-x-1/2 translate-y-1/2" />
      </main>

    </div>
  );
};

export default memo(AppLayout);