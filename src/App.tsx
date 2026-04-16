import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import { EmpresaProvider } from "@/hooks/useEmpresa";
import AppLayout from "@/components/layout/AppLayout";
import LicenseGate from "@/components/LicenseGate";

import Vitrine from "./pages/Vitrine";
import Index from "./pages/Index";
import Cadastro from "./pages/Cadastro";
import Documentos from "./pages/Documentos";
import Auditoria from "./pages/Auditoria";
import NaoConformidades from "./pages/NaoConformidades";
import Recebimento from "./pages/Recebimento";
import Producao from "./pages/Producao";
import PCP from "./pages/PCP";
import Rastreabilidade from "./pages/Rastreabilidade";
import Pragas from "./pages/Pragas";
import Treinamentos from "./pages/Treinamentos";
import Indicadores from "./pages/Indicadores";
import ExecucaoPops from "./pages/ExecucaoPops";
import Relatorios from "./pages/Relatorios";
import Legislacao from "./pages/Legislacao";
import Fornecedores from "./pages/Fornecedores";
import Manual from "./pages/Manual";
import PlanilhasPop from "./pages/PlanilhasPop";
import GuiaPops from "./pages/GuiaPops";
import Produtos from "./pages/Produtos";
import Formulas from "./pages/Formulas";
import AnalisesLaboratorio from "./pages/AnalisesLaboratorio";
import HigieneSanitizacao from "./pages/HigieneSanitizacao";
import ManutencaoPreventiva from "./pages/ManutencaoPreventiva";
import ControleResiduos from "./pages/ControleResiduos";
import ControleSubstancias from "./pages/ControleSubstancias";
import ValidacaoLimpezaLinha from "./pages/ValidacaoLimpezaLinha";
import MatrizRisco from "./pages/MatrizRisco";
import PlanejamentoAnual from "./pages/PlanejamentoAnual";
import QualidadeTotal from "./pages/QualidadeTotal";
import SalaAuditor from "./pages/SalaAuditor";
import RelatorioProducao from "./pages/RelatorioProducao";
import ArmazenamentoTransporte from "./pages/ArmazenamentoTransporte";
import PotabilidadeAgua from "./pages/PotabilidadeAgua";
import SaudePessoal from "./pages/SaudePessoal";
import ControleVisitantes from "./pages/ControleVisitantes";
import Auth from "./pages/Auth";

import Modelos from "./pages/Modelos";
import Instalar from "./pages/Instalar";
import NutriCRMPage from "./pages/NutriCRMPage";
import FeedBPFPage from "./pages/FeedBPFPage";
import AuditsBPFPage from "./pages/AuditsBPFPage";
import AgroGestaoCRMPage from "./pages/AgroGestaoCRMPage";
import AdminLicencas from "./pages/AdminLicencas";
// DocumentosBPF integrado como aba em Documentos — rota standalone removida
import ChecklistPreAuditoria from "./pages/ChecklistPreAuditoria";
import SimulacaoRecall from "./pages/SimulacaoRecall";
import BuscaGlobal from "./pages/BuscaGlobal";
import ModoTablet from "./pages/ModoTablet";
import AnaliseTendencias from "./pages/AnaliseTendencias";
import GeracaoManualBPF from "./pages/GeracaoManualBPF";
import ConsultaSipeagro from "./pages/ConsultaSipeagro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}



function AuthRoute() {
  return <Auth />;
}

const AppRoutes = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Vitrine />} />
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/instalar" element={<Instalar />} />
      <Route path="/nutricrm" element={<ProtectedRoute><LicenseGate product="nutricrm"><NutriCRMPage /></LicenseGate></ProtectedRoute>} />
      <Route path="/feedbpf" element={<ProtectedRoute><LicenseGate product="feedbpf"><FeedBPFPage /></LicenseGate></ProtectedRoute>} />
      <Route path="/audits-bpf" element={<ProtectedRoute><LicenseGate product="auditsbpf"><AuditsBPFPage /></LicenseGate></ProtectedRoute>} />
      <Route path="/agrogestao" element={<ProtectedRoute><LicenseGate product="agrogestao"><AgroGestaoCRMPage /></LicenseGate></ProtectedRoute>} />
      <Route path="/admin-licencas" element={<ProtectedRoute><AdminLicencas /></ProtectedRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
              <AppLayout>
                <LicenseGate>
                <Routes>
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/documentos" element={<Documentos />} />
                  <Route path="/auditoria" element={<Auditoria />} />
                  <Route path="/nao-conformidades" element={<NaoConformidades />} />
                  <Route path="/recebimento" element={<Recebimento />} />
                  <Route path="/fornecedores" element={<Fornecedores />} />
                  <Route path="/producao" element={<Producao />} />
                  <Route path="/pcp" element={<PCP />} />
                  <Route path="/rastreabilidade" element={<Rastreabilidade />} />
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
                  <Route path="/busca-global" element={<BuscaGlobal />} />
                  <Route path="/modo-tablet" element={<ModoTablet />} />
                  <Route path="/analise-tendencias" element={<AnaliseTendencias />} />
                  <Route path="/geracao-manual-bpf" element={<GeracaoManualBPF />} />
                  <Route path="/consulta-sipeagro" element={<ConsultaSipeagro />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </LicenseGate>
              </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
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
