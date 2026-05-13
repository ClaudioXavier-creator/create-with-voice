import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ["dashboard", "leads", "crm", "licencas", "assinaturas"];
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && validTabs.includes(initialTab) ? initialTab : "dashboard"
  );
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && validTabs.includes(t) && t !== activeTab) setActiveTab(t);
  }, [searchParams]);
  const handleTabChange = (t: string) => {
    setActiveTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadsPendente: 0,
    vendasGanhos: 0,
    valorTotalGanhos: 0,
    loading: true
  });

  useEffect(() => {
    if (!user || !canAccessLicenseAdmin(roles, user.email)) return;

    async function fetchStats() {
      try {
        const [leadsRes, crmRes] = await Promise.all([
          supabase.from("leads").select("id, notificado"),
          supabase.from("crm_pipeline").select("etapa, valor_estimado")
        ]);

        const leads = leadsRes.data || [];
        const crm = crmRes.data || [];

        const ganhos = crm.filter(i => i.etapa === "ganho");
        const valorGanhos = ganhos.reduce((acc, i) => acc + (Number(i.valor_estimado) || 0), 0);

        setStats({
          totalLeads: leads.length,
          leadsPendente: leads.filter(l => !l.notificado).length,
          vendasGanhos: ganhos.length,
          valorTotalGanhos: valorGanhos,
          loading: false
        });
      } catch (error) {
        console.error("Erro ao carregar métricas superadmin:", error);
        setStats(s => ({ ...s, loading: false }));
      }
    }

    void fetchStats();
  }, [user, roles]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 w-full h-auto gap-2 bg-transparent">
          <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 border">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 border">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 border">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Pipeline CRM</span>
          </TabsTrigger>
          <TabsTrigger value="licencas" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 border">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">Licenças</span>
          </TabsTrigger>
          <TabsTrigger value="assinaturas" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 border">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Assinaturas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card>
               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                 <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{stats.loading ? "..." : stats.totalLeads}</div>
                 <p className="text-xs text-muted-foreground">{stats.leadsPendente} pendentes de contato</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                 <CardTitle className="text-sm font-medium">Vendas Fechadas</CardTitle>
                 <Award className="h-4 w-4 text-emerald-500" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{stats.loading ? "..." : stats.vendasGanhos}</div>
                 <p className="text-xs text-muted-foreground">Leads convertidos no CRM</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                 <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
                 <Target className="h-4 w-4 text-blue-500" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">
                   {stats.loading ? "..." : stats.valorTotalGanhos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                 </div>
                 <p className="text-xs text-muted-foreground">Valor total de negócios ganhos</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                 <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
                 <Key className="h-4 w-4 text-amber-500" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">Verificar aba</div>
                 <p className="text-xs text-muted-foreground">Consulte na aba de Licenças</p>
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
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">O controle de assinaturas e faturamento via Stripe está centralizado aqui.</p>
              <div className="p-4 bg-muted rounded-lg border border-dashed text-center">
                 Consolidação de Webhooks do Stripe em desenvolvimento...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
