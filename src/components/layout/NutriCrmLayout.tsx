import React, { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NutriCrmSidebar } from "./NutriCrmSidebar";
import LicenseGate from "@/components/LicenseGate";
import EmpresaSelector from "@/components/EmpresaSelector";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const NutriCrmLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      sessionStorage.clear();
      localStorage.removeItem("post_login_redirect");
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Erro ao sair:", err);
      navigate("/auth", { replace: true });
    }
  }, [signOut, navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-hidden">
        <NutriCrmSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-4">
              <EmpresaSelector />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-foreground">{user?.email}</span>
                <span className="text-[10px] text-orange-600 uppercase tracking-widest font-bold">NutriCRM App</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden relative focus:outline-none custom-scrollbar bg-orange-500/[0.02]">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-20 sm:pb-8">
              <LicenseGate product="nutricrm">
                {children}
              </LicenseGate>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default memo(NutriCrmLayout);
