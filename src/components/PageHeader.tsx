import { useState } from "react";
import { LucideIcon, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrientacaoModulo } from "@/components/OrientacaoModulo";
import { ORIENTACOES } from "@/config/orientacoesConfig";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  /** ID do módulo em ORIENTACOES — quando informado, exibe botão "Orientação" que abre tutorial + sandbox. */
  orientacaoModuloId?: string;
}

export default function PageHeader({ icon: Icon, title, description, orientacaoModuloId }: PageHeaderProps) {
  const [open, setOpen] = useState(false);
  const modulo = orientacaoModuloId ? ORIENTACOES.find((m) => m.id === orientacaoModuloId) : null;

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {Icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          </div>
          <p className={`text-muted-foreground ${Icon ? "ml-[52px]" : ""}`}>{description}</p>
        </div>

        {modulo && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <GraduationCap className="w-4 h-4" />
                Orientação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Como preencher: {modulo.titulo}</DialogTitle>
              </DialogHeader>
              <OrientacaoModulo modulo={modulo} showRouteLink={false} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
