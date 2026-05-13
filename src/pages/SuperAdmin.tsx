import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, TrendingUp, Key, CreditCard, Activity, Target, Award, Loader2 } from "lucide-react";
import { canAccessLicenseAdmin } from "@/config/adminAccess";
import CRM from "./CRM";
import AdminLicencas from "./AdminLicencas";
import AdminLeads from "./AdminLeads";

export default function SuperAdmin() {
  const { user, roles, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Acesso estrito ao superadmin
  if (!user || !canAccessLicenseAdmin(roles, user.email)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Painel Super Admin</h1>
          <p className="text-muted-foreground">Gestão pessoal de leads, vendas e licenças</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 w-full">
          <TabsTrigger value="dashboard" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Pipeline CRM</span>
          </TabsTrigger>
          <TabsTrigger value="licencas" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">Licenças</span>
          </TabsTrigger>
          <TabsTrigger value="assinaturas" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Assinaturas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Dashboard metrics can be added here or extracted from other components */}
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">Operacional</div>
                 <p className="text-xs text-muted-foreground">Painel SuperAdmin ativo</p>
               </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <AdminLeads isTab />
        </TabsContent>

        <TabsContent value="crm">
          <CRM isTab />
        </TabsContent>

        <TabsContent value="licencas">
          <AdminLicencas isTab />
        </TabsContent>

        <TabsContent value="assinaturas">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas & Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Funcionalidade em integração com Stripe...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
