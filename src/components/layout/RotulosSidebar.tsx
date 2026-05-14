import { Link, useLocation } from "react-router-dom";
import { 
  Tag, 
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  FileText,
  Layers,
  Printer,
  QrCode,
  Palette
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
import logoRotulos from "@/assets/logo-rotulos-bpf.png";

const items = [
  { title: "Dashboard Rótulos", icon: LayoutDashboard, url: "/rotulos/dashboard" },
  { title: "Editor de Rótulos", icon: Tag, url: "/rotulos/editor" },
  { title: "Ficha Técnica (RTPI)", icon: FileText, url: "/rotulos/rtpi" },
  { title: "Níveis de Garantia", icon: Layers, url: "/rotulos/niveis" },
  { title: "Templates", icon: Palette, url: "/rotulos/templates" },
  { title: "Configurações Zebra", icon: Printer, url: "/rotulos/zebra" },
];

export function RotulosSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoRotulos} alt="Rotulos" className="w-8 h-8 shrink-0 object-contain" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight truncate bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Labels
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="hidden md:flex shrink-0 hover:bg-teal-500/10 hover:text-teal-600 transition-colors"
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
                    ? "bg-teal-500/10 text-teal-600 font-medium" 
                    : "hover:bg-teal-500/5 hover:text-teal-600/80"
                }`}
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 ${location.pathname === item.url ? "text-teal-600" : "text-muted-foreground"}`} />
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
