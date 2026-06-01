import { useState, useEffect } from "react";
import { Check, Search, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Badge } from "@/components/ui/badge";

interface LoteProdutoPickerProps {
  value: string;
  onChange: (lote: string, produto?: string) => void;
  produtoNome?: string;
}

export function LoteProdutoPicker({ value, onChange, produtoNome }: LoteProdutoPickerProps) {
  const [open, setOpen] = useState(false);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { empresaAtiva } = useEmpresa();

  useEffect(() => {
    async function fetchLotes() {
      setLoading(true);
      try {
        let query = supabase
          .from("ordens_producao")
          .select("lote_produto, produto, data_programada, status")
          .eq("status", "concluida")
          .order("data_programada", { ascending: false })
          .limit(50);

        if (empresaAtiva) {
          query = query.eq("empresa_id", empresaAtiva.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Filter unique lots
        const uniqueLotes = (data || []).reduce((acc: any[], curr) => {
          if (curr.lote_produto && !acc.find(l => l.lote_produto === curr.lote_produto)) {
            acc.push(curr);
          }
          return acc;
        }, []);

        setLotes(uniqueLotes);
      } catch (error) {
        console.error("Erro ao buscar lotes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchLotes();
    }
  }, [open, empresaAtiva]);

  const filteredLotes = produtoNome 
    ? lotes.filter(l => l.produto?.toLowerCase().includes(produtoNome.toLowerCase()) || l.lote_produto === value)
    : lotes;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Selecionar lote..."}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <Package className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar lote ou produto..." />
          <CommandList>
            <CommandEmpty>Nenhum lote concluído encontrado.</CommandEmpty>
            <CommandGroup heading="Lotes Concluídos">
              {filteredLotes.map((l) => (
                <CommandItem
                  key={l.lote_produto}
                  value={`${l.lote_produto} ${l.produto}`}
                  onSelect={() => {
                    onChange(l.lote_produto, l.produto);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === l.lote_produto ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{l.lote_produto}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{l.produto}</span>
                  </div>
                  {l.data_programada && (
                    <Badge variant="outline" className="ml-auto text-[10px] px-1 h-4">
                      {new Date(l.data_programada).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Ações">
              <CommandItem onSelect={() => {
                const manual = prompt("Digite o lote manualmente:");
                if (manual) {
                  onChange(manual);
                  setOpen(false);
                }
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Digitar lote manualmente...
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

import { Plus } from "lucide-react";
