import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  LogOut,
  Menu,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import EmpresaSelector from "@/components/EmpresaSelector";
import LicenseGate from "@/components/LicenseGate";
import TierGate from "@/components/TierGate";
import logoImg from "@/assets/logo-feed-bpf.png";
import { canAccessLeadsAdmin, canAccessLicenseAdmin } from "@/config/adminAccess";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { NAV_ENTRIES, isGroup } from "@/components/layout/nav-config";
import OfflineBanner from "@/components/OfflineBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  const canCRM = !!roles?.includes("admin") || !!roles?.includes("comercial");
  const visibleEntries = useMemo(
    () =>
      NAV_ENTRIES.filter((entry) => {
        if (isGroup(entry)) return true;
        if (entry.path === "/admin-licencas") {
          return canAccessLicenseAdmin(roles, user?.email);
        }
        if (entry.path === "/admin-leads") {
          return canAccessLeadsAdmin(roles);
        }
        return true;
      }),
    [roles],
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (location.pathname !== "/busca-global") {
          navigate("/busca-global");
        }
      }

      if (isTyping) return;
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <img src={logoImg} alt="Feed_BPF Logo" className="w-10 h-10 rounded-lg object-contain" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">Feed_BPF</h1>
            <p className="text-xs text-sidebar-foreground/60">by CLXN</p>
          </div>
        </div>
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent px-3 py-3">
            <div className="rounded-md bg-sidebar-primary/20 p-2 text-sidebar-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground">Navegação inteligente</p>
              <p className="text-xs text-sidebar-foreground/60">Use favoritos e acesso rápido para chegar mais rápido aos módulos que você usa todo dia.</p>
            </div>
          </div>
        </div>
        <SidebarNav currentPath={location.pathname} entries={visibleEntries} />
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
        <div className="flex items-center gap-2 min-w-0">
          <img src={logoImg} alt="Feed_BPF Logo" className="w-8 h-8 rounded object-contain" />
          <div className="min-w-0">
            <span className="font-display font-bold block truncate">Feed_BPF</span>
            <span className="text-[11px] text-sidebar-foreground/60 flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> Acesso rápido</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside className="w-72 h-full bg-sidebar text-sidebar-foreground pt-16 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <SidebarNav currentPath={location.pathname} entries={visibleEntries} onNavigate={() => setMobileOpen(false)} />
            <div className="px-4 py-3 border-t border-sidebar-border space-y-3">
              <EmpresaSelector />
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
        <OfflineBanner />
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <LicenseGate>
            <TierGate>{children}</TierGate>
          </LicenseGate>
        </div>
      </main>

      {/* Botão flutuante CRM (apenas admin/comercial) */}
      {canCRM && location.pathname !== "/crm" && (
        <Button
          onClick={() => navigate("/crm")}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          title="CRM Comercial"
          aria-label="Abrir CRM Comercial"
        >
          <Target className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}