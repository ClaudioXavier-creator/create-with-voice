import React, { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FeedBpfCustomSidebar } from "./FeedBpfCustomSidebar";
import LicenseGate from "@/components/LicenseGate";
import EmpresaSelector from "@/components/EmpresaSelector";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const FeedBpfCustomLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      sessionStorage.clear();
      navigate("/auth", { replace: true });
    } catch {
      navigate("/auth", { replace: true });
    }
  }, [signOut, navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-hidden">
        <FeedBpfCustomSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <EmpresaSelector />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-foreground">{user?.email}</span>
                <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Feed_BPF Custom</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-emerald-500/[0.015]">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-20 sm:pb-8">
              <LicenseGate product="feedbpfcustom">
                {children}
              </LicenseGate>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default memo(FeedBpfCustomLayout);
