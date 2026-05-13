import { useMemo, useState } from "react";
import { Building2, Check, ChevronDown, Search, Star, Layers } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/30">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary shrink-0 shadow-inner">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/30 font-bold leading-none mb-1">Empresa Ativa</p>
          <p className="text-xs font-semibold text-sidebar-foreground/80 truncate leading-tight">
            {empresaAtiva?.nome || "Nenhuma empresa"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full h-auto px-4 py-3 justify-start gap-3 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/20 hover:bg-sidebar-accent/50 hover:border-sidebar-border/50 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary group-hover:scale-110 transition-transform shadow-inner shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/30 font-bold leading-none mb-1">Alterar Unidade</p>
            <p className="text-xs font-semibold text-sidebar-foreground/80 truncate leading-tight">
              {empresaAtiva?.nome || "Selecionar"}
            </p>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform opacity-30 group-hover:opacity-60", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0 rounded-2xl border-sidebar-border/50 shadow-2xl overflow-hidden bg-sidebar/95 backdrop-blur-xl">
        <div className="p-4 bg-primary/10 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-sidebar-foreground tracking-tight text-sm">Seletor de Unidade</h3>
          </div>
        </div>
        <Command className="bg-transparent text-sidebar-foreground">
          <CommandInput placeholder="Buscar por nome ou CNPJ..." className="border-none focus:ring-0 text-sidebar-foreground h-11" />
          <CommandList className="max-h-[300px] scrollbar-thin">
            <CommandEmpty className="p-4 text-center text-xs text-sidebar-foreground/50 italic">
              Nenhuma empresa encontrada para este critério.
            </CommandEmpty>

            {recentes.length > 0 && (
              <CommandGroup heading={<span className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1 block">Acesso Rápido</span>} className="px-2">
                {recentes.map((empresa) => (
                  <CommandItem
                    key={`recente-${empresa.id}`}
                    value={`${empresa.nome} ${empresa.cnpj || ""}`}
                    onSelect={() => {
                      setEmpresaAtiva(empresa);
                      setOpen(false);
                    }}
                    className="gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-primary/10 aria-selected:bg-primary/20 transition-colors mb-1"
                  >
                    <div className="w-7 h-7 rounded bg-sidebar-accent flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/60" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-xs">{empresa.nome}</span>
                      {empresa.cnpj && <span className="text-[10px] text-sidebar-foreground/40 font-mono tracking-tighter">{empresa.cnpj}</span>}
                    </div>
                    {empresaAtiva?.id === empresa.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recentes.length > 0 && <CommandSeparator className="my-2 bg-sidebar-border/30" />}

            <CommandGroup heading={<span className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1 block">Todas as Unidades</span>} className="px-2 pb-2">
              {empresas.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.nome} ${e.cnpj || ""}`}
                  onSelect={() => {
                    setEmpresaAtiva(e);
                    setOpen(false);
                  }}
                  className="gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-primary/10 aria-selected:bg-primary/20 transition-colors mb-1 group"
                >
                  <div className="w-7 h-7 rounded bg-sidebar-accent flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-xs">{e.nome}</span>
                    <span className="truncate text-[10px] text-sidebar-foreground/40 font-mono tracking-tighter">
                      {e.cnpj || "Sem registro CNPJ"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1.5 hover:bg-accent/20 transition-colors shrink-0"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleFavorita(e.id);
                    }}
                  >
                    <Star className={cn("w-3.5 h-3.5 transition-all", favoritas.includes(e.id) ? "fill-accent text-accent scale-110" : "text-sidebar-foreground/20")} />
                  </button>
                  {empresaAtiva?.id === e.id && <Check className="w-3.5 h-3.5 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="p-3 bg-sidebar-accent/30 border-t border-sidebar-border/30 text-center">
          <p className="text-[10px] text-sidebar-foreground/40 italic">Selecione uma unidade para alternar o contexto operacional</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
