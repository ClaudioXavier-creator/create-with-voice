import { NutriCrmDashboard, NutriCrmClientes, NutriCrmVisitas, NutriCrmProjetos, NutriCrmMetas, NutriCrmRelatorios } from "@/components/demo/MockScreens";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const PreviewAlert = () => (
  <Alert variant="default" className="bg-orange-500/10 border-orange-500/20 mb-6">
    <Info className="h-4 w-4 text-orange-600" />
    <AlertTitle className="text-orange-700 font-bold">Ambiente Isolado NutriCRM</AlertTitle>
    <AlertDescription className="text-orange-600">
      Você está no novo ambiente exclusivo do NutriCRM. Em breve, esta interface será conectada à sua base de dados real.
    </AlertDescription>
  </Alert>
);

export const NutriDashboardPage = () => (
  <div className="space-y-6">
    <PreviewAlert />
    <NutriCrmDashboard />
  </div>
);

export const NutriClientesPage = () => <NutriCrmClientes />;
export const NutriVisitasPage = () => <NutriCrmVisitas />;
export const NutriProjetosPage = () => <NutriCrmProjetos />;
export const NutriMetasPage = () => <NutriCrmMetas />;
export const NutriRelatoriosPage = () => <NutriCrmRelatorios />;
