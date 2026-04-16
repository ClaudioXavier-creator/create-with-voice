import PageHeader from "@/components/PageHeader";
import { FileText } from "lucide-react";
import FormulasManager from "@/components/produtos/FormulasManager";

export default function Formulas() {
  return (
    <>
      <PageHeader
        icon={FileText}
        title="Fórmulas de Produção"
        description="Cadastro versionado de fórmulas — código automático: 'Produto - vXX-DDMMAAAA'"
      />
      <FormulasManager />
    </>
  );
}
