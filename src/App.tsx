import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Cadastro from "./pages/Cadastro";
import Documentos from "./pages/Documentos";
import Auditoria from "./pages/Auditoria";
import NaoConformidades from "./pages/NaoConformidades";
import Recebimento from "./pages/Recebimento";
import Producao from "./pages/Producao";
import Rastreabilidade from "./pages/Rastreabilidade";
import Pragas from "./pages/Pragas";
import Treinamentos from "./pages/Treinamentos";
import Indicadores from "./pages/Indicadores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/nao-conformidades" element={<NaoConformidades />} />
            <Route path="/recebimento" element={<Recebimento />} />
            <Route path="/producao" element={<Producao />} />
            <Route path="/rastreabilidade" element={<Rastreabilidade />} />
            <Route path="/pragas" element={<Pragas />} />
            <Route path="/treinamentos" element={<Treinamentos />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
