import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AgroRcSidebar } from "./AgroRcSidebar";
import LicenseGate from "@/components/LicenseGate";
import Navbar from "./Navbar";

export default function AgroRcLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { empresaAtiva } = useEmpresa();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-hidden">
        <AgroRcSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Navbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative focus:outline-none custom-scrollbar">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-20 sm:pb-8">
              <LicenseGate product="agrorc">
                {children}
              </LicenseGate>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
