import { useMemo, useState } from "react";
import { Building2, Check, ChevronDown, Search, Star } from "lucide-react";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export default function EmpresaSelector() {
  const { empresas, empresaAtiva, setEmpresaAtiva } = useEmpresa();
  const [open, setOpen] = useState(false);
  const [favoritas, setFavoritas] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("feedbpf_empresas_favoritas") || "[]");
    } catch {
      return [];
    }
  });

  const favoritasList = useMemo(
    () => empresas.filter((empresa) => favoritas.includes(empresa.id)).slice(0, 4),
    [empresas, favoritas],
  );
  const recentes = useMemo(() => {
    if (!empresaAtiva) return favoritasList;
    return [empresaAtiva, ...favoritasList.filter((empresa) => empresa.id !== empresaAtiva.id)].slice(0, 4);
  }, [empresaAtiva, favoritasList]);

  const toggleFavorita = (empresaId: string) => {
    const next = favoritas.includes(empresaId)
      ? favoritas.filter((id) => id !== empresaId)
      : [...favoritas, empresaId].slice(-8);

    setFavoritas(next);
    localStorage.setItem("feedbpf_empresas_favoritas", JSON.stringify(next));
  };

  if (empresas.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="truncate max-w-[180px]">{empresaAtiva?.nome || "Nenhuma empresa"}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[260px] justify-between gap-2">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="truncate flex-1 text-left">{empresaAtiva?.nome || "Selecionar"}</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">{empresas.length}</Badge>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>

            {recentes.length > 0 && (
              <CommandGroup heading="Acesso rápido">
                {recentes.map((empresa) => (
                  <CommandItem
                    key={`recente-${empresa.id}`}
                    value={`${empresa.nome} ${empresa.cnpj || ""}`}
                    onSelect={() => {
                      setEmpresaAtiva(empresa);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{empresa.nome}</span>
                      {empresa.cnpj && <span className="text-xs text-muted-foreground">{empresa.cnpj}</span>}
                    </div>
                    {empresaAtiva?.id === empresa.id && <Check className="w-4 h-4 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recentes.length > 0 && <CommandSeparator />}

            <CommandGroup heading="Todas as empresas">
              {empresas.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.nome} ${e.cnpj || ""}`}
                  onSelect={() => {
                    setEmpresaAtiva(e);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{e.nome}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {e.cnpj || "Sem CNPJ"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleFavorita(e.id);
                    }}
                    aria-label={favoritas.includes(e.id) ? "Remover favorita" : "Favoritar empresa"}
                  >
                    <Star className={`w-4 h-4 ${favoritas.includes(e.id) ? "fill-current text-accent" : "text-muted-foreground"}`} />
                  </button>
                  {empresaAtiva?.id === e.id && <Check className="w-4 h-4 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
