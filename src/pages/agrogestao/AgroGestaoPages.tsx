import { AgroDashboard, AgroClientes, AgroRegioes, AgroMetas, AgroVisitas, AgroRelatorios } from "@/components/demo/MockScreens";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const PreviewAlert = () => (
  <Alert variant="default" className="bg-emerald-500/10 border-emerald-500/20 mb-6">
    <Info className="h-4 w-4 text-emerald-600" />
    <AlertTitle className="text-emerald-700 font-bold">Portal AgroGestão — Dashboard Regional</AlertTitle>
    <AlertDescription className="text-emerald-600">
      Visualização do ambiente de gestão regional. Em breve, os dados de faturamento e performance serão consolidados aqui.
    </AlertDescription>
  </Alert>
);

export const AgroDashboardPage = () => (
  <div className="space-y-6">
    <PreviewAlert />
    <AgroDashboard />
  </div>
);

export const AgroClientesPage = () => <AgroClientes />;
export const AgroRegioesPage = () => <AgroRegioes />;
export const AgroMetasPage = () => <AgroMetas />;
export const AgroVisitasPage = () => <AgroVisitas />;
export const AgroRelatoriosPage = () => <AgroRelatorios />;
