import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Kanban, 
  Users, 
  MapPin, 
  Target, 
  ShieldCheck,
  ChevronLeft,
  LayoutDashboard,
  LogOut
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
import logoAgrorc from "@/assets/logo-agrorc.png";

const items = [
  { title: "Painel do RC", icon: LayoutDashboard, url: "/agrorc/dashboard" },
  { title: "Pipeline Kanban", icon: Kanban, url: "/agrorc/pipeline" },
  { title: "Clientes", icon: Users, url: "/agrorc/clientes" },
  { title: "Visitas", icon: MapPin, url: "/agrorc/visitas" },
  { title: "Metas", icon: Target, url: "/agrorc/metas" },
  { title: "Painel Regional", icon: ShieldCheck, url: "/agrorc/admin" },
];

export function AgroRcSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoAgrorc} alt="Agro RC" className="w-8 h-8 shrink-0 object-contain" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight truncate bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                Agro RC
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="hidden md:flex shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
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
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-primary/5 hover:text-primary/80"
                }`}
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 ${location.pathname === item.url ? "text-primary" : "text-muted-foreground"}`} />
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
