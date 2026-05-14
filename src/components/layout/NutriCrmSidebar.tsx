import { Link, useLocation } from "react-router-dom";
import { 
  Users, 
  MapPin, 
  Target, 
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  CalendarDays,
  Briefcase,
  PieChart
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
import logoNutricrm from "@/assets/logo-nutricrm.png";

const items = [
  { title: "Painel de Vendas", icon: LayoutDashboard, url: "/nutricrm/dashboard" },
  { title: "Clientes (Agro)", icon: Users, url: "/nutricrm/clientes" },
  { title: "Agenda de Visitas", icon: CalendarDays, url: "/nutricrm/visitas" },
  { title: "Projetos Técnicos", icon: Briefcase, url: "/nutricrm/projetos" },
  { title: "Metas & Ranking", icon: Target, url: "/nutricrm/metas" },
  { title: "Relatórios IA", icon: PieChart, url: "/nutricrm/relatorios" },
];

export function NutriCrmSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoNutricrm} alt="NutriCRM" className="w-8 h-8 shrink-0 object-contain" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight truncate bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                NutriCRM
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="hidden md:flex shrink-0 hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
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
                    ? "bg-orange-500/10 text-orange-600 font-medium" 
                    : "hover:bg-orange-500/5 hover:text-orange-600/80"
                }`}
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 ${location.pathname === item.url ? "text-orange-600" : "text-muted-foreground"}`} />
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
