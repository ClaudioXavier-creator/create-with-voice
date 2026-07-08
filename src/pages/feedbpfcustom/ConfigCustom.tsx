import { Settings, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ConfigCustom() {
  const { empresaAtiva } = useEmpresa();
  return (
    <div className="space-y-6">
      <PageHeader icon={Settings} title="Configurações" description="Ajustes da conta e da empresa" />
      <EmpresaSelector />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p><strong>Empresa ativa:</strong> {empresaAtiva?.nome || "nenhuma"}</p>
              <p className="text-muted-foreground">Feed_BPF Custom usa o mesmo cadastro de empresas do restante da plataforma. Convide membros, configure PIN de aprovação e gerencie licenças no painel principal.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm"><Link to="/cadastro">Gerenciar empresa</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/configurar-pin">Configurar PIN</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
