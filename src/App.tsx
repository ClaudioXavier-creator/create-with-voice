import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import AppLayout from "@/components/layout/AppLayout";
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
import Auth from "./pages/Auth";
import AtivarLicenca from "./pages/AtivarLicenca";
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

function LicenseGate({ children }: { children: React.ReactNode }) {
  const { loading, isActive } = useLicense();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isActive) {
    return <AtivarLicenca />;
  }

  return <>{children}</>;
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
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <LicenseGate>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
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
                  <Route path="/planilhas-pop" element={<PlanilhasPop />} />
                  <Route path="/manual" element={<Manual />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </LicenseGate>
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
