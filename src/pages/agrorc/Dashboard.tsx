import { AgroRcDashboard } from "@/components/demo/MockScreens";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AgroRcDashboardPage() {
  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-primary/10 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Modo de Visualização</AlertTitle>
        <AlertDescription>
          Você está visualizando a nova estrutura do Agro RC CRM. Em breve, estas telas serão conectadas aos dados reais da sua empresa.
        </AlertDescription>
      </Alert>
      <AgroRcDashboard />
    </div>
  );
}
