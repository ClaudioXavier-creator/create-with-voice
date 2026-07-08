import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { POPS_CONFIG } from "@/config/popsConfig";

interface Props {
  arquivoId: string;
  currentPop?: string | null;
  onSaved?: () => void;
}

/**
 * Botão inline para vincular (ou reatribuir) o POP de um arquivo já enviado.
 * Uso: retroalimentar o acervo antigo sem precisar de reupload.
 */
export function VincularPopButton({ arquivoId, currentPop, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentPop || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!value) {
      toast.error("Escolha um POP");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("arquivos_bpf")
      .update({ pop_codigo: value } as any)
      .eq("id", arquivoId);
    setSaving(false);
    if (error) {
      toast.error("Erro ao vincular POP");
      return;
    }
    toast.success(`Vinculado a ${value}`);
    setOpen(false);
    onSaved?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={currentPop ? "Alterar POP vinculado" : "Vincular POP"}
        >
          <Link2 className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <div>
          <p className="text-xs font-medium mb-1">
            {currentPop ? "Alterar POP vinculado" : "Vincular a um POP"}
          </p>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger><SelectValue placeholder="Escolha o POP" /></SelectTrigger>
            <SelectContent>
              {POPS_CONFIG.map((p) => (
                <SelectItem key={p.codigo} value={p.codigo}>
                  <span className="font-mono">{p.codigo}</span> — {p.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
          Salvar
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default VincularPopButton;
