import { Link, useLocation } from "react-router-dom";
import {
  FolderOpen,
  Upload,
  Layers,
  FileSignature,
  ChevronLeft,
  LogOut,
  Settings,
  Home,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const items = [
  { title: "Como Usar", icon: GraduationCap, url: "/feedbpf-custom/tutorial" },
  { title: "Meu Acervo", icon: FolderOpen, url: "/feedbpf-custom/acervo" },
  { title: "Importação em Massa", icon: Upload, url: "/feedbpf-custom/importacao" },
  { title: "Importar Planilhas", icon: FileSpreadsheet, url: "/feedbpf-custom/planilhas" },
  { title: "Meus Modelos", icon: Layers, url: "/feedbpf-custom/modelos" },
  { title: "Registros Digitais", icon: FileSignature, url: "/feedbpf-custom/registros" },
  { title: "Análise por IA", icon: Sparkles, url: "/feedbpf-custom/analise-ia" },
  { title: "Configurações", icon: Settings, url: "/feedbpf-custom/config" },
];

export function FeedBpfCustomSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight truncate bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Feed_BPF Custom
                </span>
                <span className="text-[10px] text-muted-foreground truncate">Gestor de Documentos</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex shrink-0 hover:bg-emerald-500/10 hover:text-emerald-600"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {items.map((item) => {
            const active = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    "transition-all",
                    active ? "bg-emerald-500/10 text-emerald-600 font-medium" : "hover:bg-emerald-500/5 hover:text-emerald-600/80"
                  )}
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-emerald-600" : "text-muted-foreground")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <Button variant="ghost" asChild className={cn("w-full justify-start gap-3 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10", isCollapsed && "justify-center px-0")}>
          <Link to="/">
            <Home className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Vitrine</span>}
          </Link>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-0"
          )}
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
