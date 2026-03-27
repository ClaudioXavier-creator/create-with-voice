import { Building2, ChevronDown } from "lucide-react";
import { useEmpresa } from "@/hooks/useEmpresa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function EmpresaSelector() {
  const { empresas, empresaAtiva, setEmpresaAtiva } = useEmpresa();

  if (empresas.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="truncate max-w-[180px]">{empresaAtiva?.nome || "Nenhuma empresa"}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[240px]">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{empresaAtiva?.nome || "Selecionar"}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {empresas.map(e => (
          <DropdownMenuItem
            key={e.id}
            onClick={() => setEmpresaAtiva(e)}
            className={e.id === empresaAtiva?.id ? "bg-accent" : ""}
          >
            <Building2 className="w-4 h-4 mr-2" />
            {e.nome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
