import { Link, useLocation } from "react-router-dom";
import { 
  ClipboardCheck, 
  Search, 
  Target, 
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  FileText,
  History,
  Radar
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoAudits from "@/assets/logo-audits-bpf.png";

const items = [
  { title: "Painel Auditor", icon: LayoutDashboard, url: "/auditsbpf/dashboard" },
  { title: "Checklists Ativos", icon: ClipboardCheck, url: "/auditsbpf/checklist" },
  { title: "Sala do Auditor", icon: Search, url: "/auditsbpf/sala" },
  { title: "Planos de Ação", icon: Target, url: "/auditsbpf/plano" },
  { title: "Histórico Audits", icon: History, url: "/auditsbpf/historico" },
  { title: "Relatórios IA", icon: FileText, url: "/auditsbpf/relatorio" },
];

export function AuditsBpfSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoAudits} alt="Audits_BPF" className="w-8 h-8 shrink-0 object-contain" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight truncate bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Audits_BPF
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="hidden md:flex shrink-0 hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.url}
                tooltip={item.title}
                className={`transition-all duration-200 ${
                  location.pathname === item.url 
                    ? "bg-blue-500/10 text-blue-600 font-medium" 
                    : "hover:bg-blue-500/5 hover:text-blue-600/80"
                }`}
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 ${location.pathname === item.url ? "text-blue-600" : "text-muted-foreground"}`} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
