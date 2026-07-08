import { useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface Props {
  popCodigo: string;         // ex: "POP-07"
  popNome?: string;          // ex: "Controle de Pragas"
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  label?: string;
}

const CATEGORIAS = [
  { value: "planilha", label: "Planilha preenchida (escaneada)" },
  { value: "pop", label: "POP (documento oficial)" },
  { value: "it", label: "Instrução de Trabalho (IT)" },
  { value: "certificado", label: "Certificado / Laudo" },
  { value: "outro", label: "Outro" },
];

/**
 * Botão reutilizável de anexação de documentos já vinculados ao POP do módulo.
 * Facilita o operador: não precisa escolher POP manualmente.
 */
export function AnexarPlanilhaPop({
  popCodigo,
  popNome,
  variant = "outline",
  size = "sm",
  label = "Anexar planilha preenchida",
}: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("planilha");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitulo(""); setCategoria("planilha"); setDescricao(""); setFile(null);
  };

  const handleUpload = async () => {
    if (!user || !file || !titulo.trim()) {
      toast.error("Preencha título e selecione um arquivo");
      return;
    }
    setSaving(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `bpf/${empresaAtiva?.id || user.id}/${popCodigo}/${categoria}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("feed-bpf").upload(path, file);
      if (upErr) {
        toast.error("Erro no upload: " + upErr.message);
        return;
      }
      const { data: urlData } = supabase.storage.from("feed-bpf").getPublicUrl(path);
      const { error } = await supabase.from("arquivos_bpf").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        titulo: titulo.trim(),
        categoria,
        descricao: descricao || null,
        arquivo_nome: file.name,
        arquivo_url: urlData?.publicUrl || path,
        pop_codigo: popCodigo,
      } as any);
      if (error) {
        toast.error("Erro ao salvar registro");
      } else {
        toast.success(`Documento anexado a ${popCodigo}`);
        setOpen(false);
        reset();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Paperclip className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Anexar documento
            <Badge className="font-mono">{popCodigo}</Badge>
          </DialogTitle>
          {popNome && (
            <p className="text-xs text-muted-foreground">{popNome}</p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={`Ex: ${popCodigo} — Registro ${new Date().toLocaleDateString("pt-BR")}`}
            />
          </div>
          <div>
            <Label>Tipo de documento</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              placeholder="Observações, período de referência, etc."
            />
          </div>
          <div>
            <Label>Arquivo * (PDF, imagem, Excel)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Este documento será automaticamente vinculado ao <strong>{popCodigo}</strong> e ficará pesquisável em <strong>Documentos → Arquivo BPF</strong>.
          </div>
          <Button className="w-full" onClick={handleUpload} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Anexar ao {popCodigo}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AnexarPlanilhaPop;
