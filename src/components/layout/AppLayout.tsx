import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, FileText, ClipboardCheck, AlertTriangle,
  Package, Factory, Search, Bug, GraduationCap, BarChart3, Menu, X, Shield, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cadastro", label: "Cadastro", icon: Building2 },
  { path: "/documentos", label: "Documentos / POPs", icon: FileText },
  { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
  { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
  { path: "/recebimento", label: "Recebimento MP", icon: Package },
  { path: "/producao", label: "Produção", icon: Factory },
  { path: "/rastreabilidade", label: "Rastreabilidade", icon: Search },
  { path: "/pragas", label: "Controle de Pragas", icon: Bug },
  { path: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
  { path: "/indicadores", label: "Indicadores", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
            <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">FeedBPF</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão de BPF</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
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
          <Shield className="w-6 h-6 text-sidebar-primary" />
          <span className="font-display font-bold">FeedBPF</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 h-full bg-sidebar text-sidebar-foreground pt-16 px-3 py-4 space-y-1 overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-3 border-t border-sidebar-border">
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
          {children}
        </div>
      </main>
    </div>
  );
}
