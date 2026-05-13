import React, { Suspense, lazy } from "react";
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
const AtivarLicenca = lazy(() => import("./pages/AtivarLicenca"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (session) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    if (nextPath !== "/auth") {
      sessionStorage.setItem("post_login_redirect", nextPath);
    }
  }

  if (loading) return <PageLoader />;

  if (!session) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
};

const InternalRoutes = () => (
  <Routes>
    <Route path="/dashboard" element={<Index />} />
    <Route path="/ativar-licenca" element={<AtivarLicenca />} />
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
    <Route path="/admin" element={<SuperAdmin />} />
    <Route path="/crm" element={<Navigate to="/admin?tab=crm" replace />} />
    <Route path="/leads" element={<Navigate to="/admin?tab=leads" replace />} />
    <Route path="/licencas" element={<Navigate to="/admin?tab=licencas" replace />} />
    <Route path="/assinaturas" element={<Navigate to="/admin?tab=assinaturas" replace />} />
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
        <Route path="/nutricrm" element={<NutriCRMPage />} />
        <Route path="/feedbpf" element={<FeedBPFPage />} />
        <Route path="/audits-bpf/planos" element={<ProtectedRoute><AuditsBPFPlanos /></ProtectedRoute>} />
        <Route path="/audits-bpf" element={<AuditsBPFPage />} />
        <Route path="/agrogestao" element={<AgroGestaoCRMPage />} />
        <Route path="/agro-rc" element={<AgroRCCRMPage />} />
        <Route path="/rotulos" element={<RotulosBPFPage />} />
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