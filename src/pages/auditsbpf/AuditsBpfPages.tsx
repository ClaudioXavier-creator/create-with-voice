import { AuditsDashboard, AuditsChecklist, AuditsSala, AuditsPlano, AuditsRelatorio, AuditsHistorico } from "@/components/demo/MockScreens";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const PreviewAlert = () => (
  <Alert variant="default" className="bg-blue-500/10 border-blue-500/20 mb-6">
    <Info className="h-4 w-4 text-blue-600" />
    <AlertTitle className="text-blue-700 font-bold">Audits_BPF — Ambiente de Auditoria</AlertTitle>
    <AlertDescription className="text-blue-600">
      Este é o novo módulo exclusivo para auditorias internas e consultoria técnica.
    </AlertDescription>
  </Alert>
);

export const AuditsDashboardPage = () => (
  <div className="space-y-6">
    <PreviewAlert />
    <AuditsDashboard />
  </div>
);

export const AuditsChecklistPage = () => <AuditsChecklist />;
export const AuditsSalaPage = () => <AuditsSala />;
export const AuditsPlanoPage = () => <AuditsPlano />;
export const AuditsRelatorioPage = () => <AuditsRelatorio />;
export const AuditsHistoricoPage = () => <AuditsHistorico />;
