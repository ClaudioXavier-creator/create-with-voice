import React, { Suspense, lazy, useEffect } from "react";
import { Tag, FileText, Layers, Palette, Printer } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { EmpresaProvider } from "@/hooks/useEmpresa";
import AppLayout from "@/components/layout/AppLayout";
import LicenseGate from "@/components/LicenseGate";
import PageLoader from "@/components/PageLoader";



// Lazy-loaded pages
const Vitrine = lazy(() => import("./pages/Vitrine"));
const Index = lazy(() => import("./pages/Index"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const NaoConformidades = lazy(() => import("./pages/NaoConformidades"));
const Recebimento = lazy(() => import("./pages/Recebimento"));
const Producao = lazy(() => import("./pages/Producao"));
const PCP = lazy(() => import("./pages/PCP"));
const Rastreabilidade = lazy(() => import("./pages/Rastreabilidade"));
const Expedicao = lazy(() => import("./pages/Expedicao"));
const Pragas = lazy(() => import("./pages/Pragas"));
const Treinamentos = lazy(() => import("./pages/Treinamentos"));
const Indicadores = lazy(() => import("./pages/Indicadores"));
const ExecucaoPops = lazy(() => import("./pages/ExecucaoPops"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Legislacao = lazy(() => import("./pages/Legislacao"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Manual = lazy(() => import("./pages/Manual"));
const PlanilhasPop = lazy(() => import("./pages/PlanilhasPop"));
const GuiaPops = lazy(() => import("./pages/GuiaPops"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Formulas = lazy(() => import("./pages/Formulas"));
const AnalisesLaboratorio = lazy(() => import("./pages/AnalisesLaboratorio"));
const HigieneSanitizacao = lazy(() => import("./pages/HigieneSanitizacao"));
const ManutencaoPreventiva = lazy(() => import("./pages/ManutencaoPreventiva"));
const ControleResiduos = lazy(() => import("./pages/ControleResiduos"));
const ControleSubstancias = lazy(() => import("./pages/ControleSubstancias"));
const ValidacaoLimpezaLinha = lazy(() => import("./pages/ValidacaoLimpezaLinha"));
const MatrizRisco = lazy(() => import("./pages/MatrizRisco"));
const PlanejamentoAnual = lazy(() => import("./pages/PlanejamentoAnual"));
const QualidadeTotal = lazy(() => import("./pages/QualidadeTotal"));
const SalaAuditor = lazy(() => import("./pages/SalaAuditor"));
const RelatorioProducao = lazy(() => import("./pages/RelatorioProducao"));
const ArmazenamentoTransporte = lazy(() => import("./pages/ArmazenamentoTransporte"));
const PotabilidadeAgua = lazy(() => import("./pages/PotabilidadeAgua"));
const SaudePessoal = lazy(() => import("./pages/SaudePessoal"));
const ControleVisitantes = lazy(() => import("./pages/ControleVisitantes"));
const DocumentosBPF = lazy(() => import("./pages/DocumentosBPF"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const Modelos = lazy(() => import("./pages/Modelos"));
const Instalar = lazy(() => import("./pages/Instalar"));
const NutriCRMPage = lazy(() => import("./pages/NutriCRMPage"));
const FeedBPFPage = lazy(() => import("./pages/FeedBPFPage"));
const AuditsBPFPage = lazy(() => import("./pages/AuditsBPFPage"));
const AuditsBPFPlanos = lazy(() => import("./pages/AuditsBPFPlanos"));
const AgroGestaoCRMPage = lazy(() => import("./pages/AgroGestaoCRMPage"));
const AgroRCCRMPage = lazy(() => import("./pages/AgroRCCRMPage"));
const RotulosBPFPage = lazy(() => import("./pages/RotulosBPFPage"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const ChecklistPreAuditoria = lazy(() => import("./pages/ChecklistPreAuditoria"));
const SimulacaoRecall = lazy(() => import("./pages/SimulacaoRecall"));
const SimulacaoCarimbo = lazy(() => import("./pages/SimulacaoCarimbo"));
const Orientacoes = lazy(() => import("./pages/Orientacoes"));
const BuscaGlobal = lazy(() => import("./pages/BuscaGlobal"));
const ModoTablet = lazy(() => import("./pages/ModoTablet"));
const AnaliseTendencias = lazy(() => import("./pages/AnaliseTendencias"));
const GeracaoManualBPF = lazy(() => import("./pages/GeracaoManualBPF"));
const GeradorPopIA = lazy(() => import("./pages/GeradorPopIA"));
const ConsultaSipeagro = lazy(() => import("./pages/ConsultaSipeagro"));
const ConfigurarPin = lazy(() => import("./pages/ConfigurarPin"));
const AuditorPortal = lazy(() => import("./pages/AuditorPortal"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Agro RC CRM - Páginas Internas
const AgroRcLayout = lazy(() => import("./components/layout/AgroRcLayout"));
const AgroRcDashboard = lazy(() => import("./pages/agrorc/Dashboard"));
const AgroRcPipeline = lazy(() => import("./pages/agrorc/Pipeline"));
const AgroRcClientes = lazy(() => import("./pages/agrorc/Clientes"));
const AgroRcVisitas = lazy(() => import("./pages/agrorc/Visitas"));
const AgroRcMetas = lazy(() => import("./pages/agrorc/Metas"));
const AgroRcAdmin = lazy(() => import("./pages/agrorc/Admin"));

// NutriCRM - Páginas Internas
const NutriCrmLayout = lazy(() => import("./components/layout/NutriCrmLayout"));
const NutriDashboard = lazy(() => import("./pages/nutricrm/NutriCrmPages").then(m => ({ default: m.NutriDashboardPage })));
const NutriClientes = lazy(() => import("./pages/nutricrm/NutriCrmPages").then(m => ({ default: m.NutriClientesPage })));
const NutriVisitas = lazy(() => import("./pages/nutricrm/NutriCrmPages").then(m => ({ default: m.NutriVisitasPage })));
const NutriProjetos = lazy(() => import("./pages/nutricrm/NutriCrmPages").then(m => ({ default: m.NutriProjetosPage })));
const NutriMetas = lazy(() => import("./pages/nutricrm/NutriCrmPages").then(m => ({ default: m.NutriMetasPage })));
const NutriRelatorios = lazy(() => import("./pages/nutricrm/NutriCrmPages").then(m => ({ default: m.NutriRelatoriosPage })));

// AgroGestão - Páginas Internas
const AgroGestaoLayout = lazy(() => import("./components/layout/AgroGestaoLayout"));
const AgroDashboard = lazy(() => import("./pages/agrogestao/AgroGestaoPages").then(m => ({ default: m.AgroDashboardPage })));
const AgroClientes = lazy(() => import("./pages/agrogestao/AgroGestaoPages").then(m => ({ default: m.AgroClientesPage })));
const AgroRegioes = lazy(() => import("./pages/agrogestao/AgroGestaoPages").then(m => ({ default: m.AgroRegioesPage })));
const AgroVisitas = lazy(() => import("./pages/agrogestao/AgroGestaoPages").then(m => ({ default: m.AgroVisitasPage })));
const AgroMetas = lazy(() => import("./pages/agrogestao/AgroGestaoPages").then(m => ({ default: m.AgroMetasPage })));
const AgroRelatorios = lazy(() => import("./pages/agrogestao/AgroGestaoPages").then(m => ({ default: m.AgroRelatoriosPage })));

// Audits_BPF - Páginas Internas
const AuditsBpfLayout = lazy(() => import("./components/layout/AuditsBpfLayout"));
const AuditsDashboard = lazy(() => import("./pages/auditsbpf/AuditsBpfPages").then(m => ({ default: m.AuditsDashboardPage })));
const AuditsChecklist = lazy(() => import("./pages/auditsbpf/AuditsBpfPages").then(m => ({ default: m.AuditsChecklistPage })));
const AuditsSala = lazy(() => import("./pages/auditsbpf/AuditsBpfPages").then(m => ({ default: m.AuditsSalaPage })));
const AuditsPlano = lazy(() => import("./pages/auditsbpf/AuditsBpfPages").then(m => ({ default: m.AuditsPlanoPage })));
const AuditsRelatorio = lazy(() => import("./pages/auditsbpf/AuditsBpfPages").then(m => ({ default: m.AuditsRelatorioPage })));
const AuditsHistorico = lazy(() => import("./pages/auditsbpf/AuditsBpfPages").then(m => ({ default: m.AuditsHistoricoPage })));

// Nutri_Agro Labels - Páginas Internas
const RotulosLayout = lazy(() => import("./components/layout/RotulosLayout"));
const RotulosDashboard = lazy(() => import("./pages/rotulos/RotulosPages").then(m => ({ default: m.RotulosDashboardPage })));
const RotulosEditor = lazy(() => import("./pages/rotulos/RotulosPages").then(m => ({ default: (props: { name: string; icon: React.ElementType }) => <m.GenericModule name="Editor de Rótulos" icon={Tag} {...props} /> })));
const RotulosRTPI = lazy(() => import("./pages/rotulos/RotulosPages").then(m => ({ default: (props: { name: string; icon: React.ElementType }) => <m.GenericModule name="Ficha Técnica (RTPI)" icon={FileText} {...props} /> })));
const RotulosNiveis = lazy(() => import("./pages/rotulos/RotulosPages").then(m => ({ default: (props: { name: string; icon: React.ElementType }) => <m.GenericModule name="Níveis de Garantia" icon={Layers} {...props} /> })));
const RotulosTemplates = lazy(() => import("./pages/rotulos/RotulosPages").then(m => ({ default: (props: { name: string; icon: React.ElementType }) => <m.GenericModule name="Templates de Rótulos" icon={Palette} {...props} /> })));
const RotulosZebra = lazy(() => import("./pages/rotulos/RotulosPages").then(m => ({ default: (props: { name: string; icon: React.ElementType }) => <m.GenericModule name="Configuração Zebra" icon={Printer} {...props} /> })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 or specific Supabase errors
        if (error?.status === 401 || error?.status === 403 || error?.code === "PGRST301") return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { session, loading, roles, user } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!session) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    const redirect = encodeURIComponent(nextPath);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  // Proteção extra para módulos administrativos (BPF_Consult)
  if (requireAdmin) {
    const isSuperAdmin = user?.email?.toLowerCase() === "claudiolx.nunes@gmail.com";
    const isAdminRole = roles?.includes("admin") || roles?.includes("comercial");
    
    if (!isSuperAdmin && !isAdminRole) {
      console.warn("Acesso negado: Rota administrativa restrita.");
      return <Navigate to="/404" replace />;
    }
  }
  
  return <>{children}</>;
};

const InternalRoutes = () => (
  <Routes>
    <Route path="/dashboard" element={<Index />} />
    
    <Route path="/cadastro" element={<Cadastro />} />
    <Route path="/documentos" element={<Documentos />} />
    <Route path="/documentos-bpf" element={<DocumentosBPF />} />
    <Route path="/auditoria" element={<Auditoria />} />
    <Route path="/nao-conformidades" element={<NaoConformidades />} />
    <Route path="/recebimento" element={<Recebimento />} />
    <Route path="/fornecedores" element={<Fornecedores />} />
    <Route path="/producao" element={<Producao />} />
    <Route path="/pcp" element={<PCP />} />
    <Route path="/rastreabilidade" element={<Rastreabilidade />} />
    <Route path="/expedicao" element={<Expedicao />} />
    <Route path="/pragas" element={<Pragas />} />
    <Route path="/treinamentos" element={<Treinamentos />} />
    <Route path="/indicadores" element={<Indicadores />} />
    <Route path="/execucao-pops" element={<ExecucaoPops />} />
    <Route path="/relatorios" element={<Relatorios />} />
    <Route path="/legislacao" element={<Legislacao />} />
    <Route path="/manual" element={<Manual />} />
    <Route path="/guia-pops" element={<GuiaPops />} />
    <Route path="/planilhas-pop" element={<PlanilhasPop />} />
    <Route path="/produtos" element={<Produtos />} />
    <Route path="/formulas" element={<Formulas />} />
    <Route path="/analises" element={<AnalisesLaboratorio />} />
    <Route path="/higiene" element={<HigieneSanitizacao />} />
    <Route path="/manutencao" element={<ManutencaoPreventiva />} />
    <Route path="/residuos" element={<ControleResiduos />} />
    <Route path="/substancias" element={<ControleSubstancias />} />
    <Route path="/validacao-limpeza" element={<ValidacaoLimpezaLinha />} />
    <Route path="/matriz-risco" element={<MatrizRisco />} />
    <Route path="/planejamento-anual" element={<PlanejamentoAnual />} />
    <Route path="/qualidade-total" element={<QualidadeTotal />} />
    <Route path="/sala-auditor" element={<SalaAuditor />} />
    <Route path="/relatorio-producao" element={<RelatorioProducao />} />
    <Route path="/armazenamento-transporte" element={<ArmazenamentoTransporte />} />
    <Route path="/potabilidade-agua" element={<PotabilidadeAgua />} />
    <Route path="/saude-pessoal" element={<SaudePessoal />} />
    <Route path="/visitantes" element={<ControleVisitantes />} />
    <Route path="/modelos" element={<Modelos />} />
    <Route path="/checklist-pre-auditoria" element={<ChecklistPreAuditoria />} />
    <Route path="/simulacao-recall" element={<SimulacaoRecall />} />
    <Route path="/simulacao-carimbo" element={<SimulacaoCarimbo />} />
    <Route path="/orientacoes" element={<Orientacoes />} />
    <Route path="/orientacoes/:moduloId" element={<Orientacoes />} />
    <Route path="/busca-global" element={<BuscaGlobal />} />
    <Route path="/modo-tablet" element={<ModoTablet />} />
    <Route path="/analise-tendencias" element={<AnaliseTendencias />} />
    <Route path="/geracao-manual-bpf" element={<GeracaoManualBPF />} />
    <Route path="/gerador-pop-ia" element={<GeradorPopIA />} />
    <Route path="/consulta-sipeagro" element={<ConsultaSipeagro />} />
    <Route path="/configurar-pin" element={<ConfigurarPin />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Vitrine />} />
        <Route path="/vitrine" element={<Vitrine />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auditor/:token" element={<AuditorPortal />} />
        <Route path="/demo/:produto" element={<DemoPage />} />
        <Route path="/instalar" element={<Instalar />} />
        
        {/* Landings de Produtos */}
        <Route path="/nutricrm" element={<NutriCRMPage />} />
        <Route path="/feedbpf" element={<FeedBPFPage />} />
        <Route path="/auditsbpf/planos" element={<ProtectedRoute><AuditsBPFPlanos /></ProtectedRoute>} />
        <Route path="/audits-bpf/*" element={<Navigate to="/auditsbpf" replace />} />
        <Route path="/audits-bpf" element={<Navigate to="/auditsbpf" replace />} />
        <Route path="/agrogestao" element={<AgroGestaoCRMPage />} />
        <Route path="/agro-rc" element={<AgroRCCRMPage />} />
        <Route path="/rotulos" element={<RotulosBPFPage />} />

        {/* Agro RC CRM - Rotas Dedicadas */}
        <Route
          path="/agrorc/*"
          element={
            <ProtectedRoute>
              <AgroRcLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AgroRcDashboard />} />
                  <Route path="pipeline" element={<AgroRcPipeline />} />
                  <Route path="clientes" element={<AgroRcClientes />} />
                  <Route path="visitas" element={<AgroRcVisitas />} />
                  <Route path="metas" element={<AgroRcMetas />} />
                  <Route path="admin" element={<AgroRcAdmin />} />
                </Routes>
              </AgroRcLayout>
            </ProtectedRoute>
          }
        />

        {/* NutriCRM - Rotas Dedicadas */}
        <Route
          path="/nutricrm/*"
          element={
            <ProtectedRoute>
              <NutriCrmLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<NutriDashboard />} />
                  <Route path="clientes" element={<NutriClientes />} />
                  <Route path="visitas" element={<NutriVisitas />} />
                  <Route path="projetos" element={<NutriProjetos />} />
                  <Route path="metas" element={<NutriMetas />} />
                  <Route path="relatorios" element={<NutriRelatorios />} />
                </Routes>
              </NutriCrmLayout>
            </ProtectedRoute>
          }
        />

        {/* AgroGestão CRM - Rotas Dedicadas */}
        <Route
          path="/agrogestao/*"
          element={
            <ProtectedRoute>
              <AgroGestaoLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AgroDashboard />} />
                  <Route path="clientes" element={<AgroClientes />} />
                  <Route path="regioes" element={<AgroRegioes />} />
                  <Route path="visitas" element={<AgroVisitas />} />
                  <Route path="metas" element={<AgroMetas />} />
                  <Route path="relatorios" element={<AgroRelatorios />} />
                </Routes>
              </AgroGestaoLayout>
            </ProtectedRoute>
          }
        />

        {/* Audits_BPF - Rotas Dedicadas */}
        <Route path="/auditsbpf">
          <Route index element={<AuditsBPFPage />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <AuditsBpfLayout>
                  <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AuditsDashboard />} />
                    <Route path="checklist" element={<AuditsChecklist />} />
                    <Route path="sala" element={<AuditsSala />} />
                    <Route path="plano" element={<AuditsPlano />} />
                    <Route path="relatorio" element={<AuditsRelatorio />} />
                    <Route path="historico" element={<AuditsHistorico />} />
                  </Routes>
                </AuditsBpfLayout>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Nutri_Agro Labels - Rotas Dedicadas */}
        <Route
          path="/rotulos/*"
          element={
            <ProtectedRoute>
              <RotulosLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<RotulosDashboard />} />
                   <Route path="editor" element={<RotulosEditor name="Editor de Rótulos" icon={Tag} />} />
                   <Route path="rtpi" element={<RotulosRTPI name="Ficha Técnica (RTPI)" icon={FileText} />} />
                   <Route path="niveis" element={<RotulosNiveis name="Níveis de Garantia" icon={Layers} />} />
                   <Route path="templates" element={<RotulosTemplates name="Templates de Rótulos" icon={Palette} />} />
                   <Route path="zebra" element={<RotulosZebra name="Configuração Zebra" icon={Printer} />} />
                </Routes>
              </RotulosLayout>
            </ProtectedRoute>
          }
        />

        {/* Portal de Gestão (BPF_Consult) - rotas standalone, fora do AppLayout do Feed_BPF */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><SuperAdmin /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute requireAdmin><Navigate to="/admin?tab=crm" replace /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute requireAdmin><Navigate to="/admin?tab=leads" replace /></ProtectedRoute>} />
        <Route path="/licencas" element={<ProtectedRoute requireAdmin><Navigate to="/admin?tab=licencas" replace /></ProtectedRoute>} />
        <Route path="/assinaturas" element={<ProtectedRoute requireAdmin><Navigate to="/admin?tab=assinaturas" replace /></ProtectedRoute>} />

        <Route
          path="/:product/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InternalRoutes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InternalRoutes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EmpresaProvider>
            <AppRoutes />
          </EmpresaProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;