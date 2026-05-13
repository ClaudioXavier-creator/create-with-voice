import { useState } from "react";
import { LucideIcon, GraduationCap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrientacaoModulo } from "@/components/OrientacaoModulo";
import { ORIENTACOES } from "@/config/orientacoesConfig";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="mb-10 animate-fade-in">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-2">
            {Icon && (
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group transition-all duration-300 hover:scale-110">
                <Icon className="w-6 h-6 text-primary group-hover:rotate-6 transition-transform" />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground tracking-tight leading-none mb-1">{title}</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{description}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground/40 hover:text-primary transition-colors">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-[11px]">
                      Padrão Feed_BPF de conformidade normativa
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {modulo && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shrink-0 rounded-full border-primary/20 hover:border-primary hover:bg-primary/5 shadow-sm px-5 h-10 transition-all active:scale-95">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary/80">Orientação Técnica</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary px-8 py-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <DialogHeader className="relative z-10">
                    <DialogTitle className="text-2xl font-display text-white">Manual do Usuário: {modulo.titulo}</DialogTitle>
                    <p className="text-white/70 text-sm mt-1">Siga as instruções para garantir a conformidade técnica com o MAPA.</p>
                  </DialogHeader>
                </div>
                <div className="p-8">
                  <OrientacaoModulo modulo={modulo} showRouteLink={false} />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Visual separator/border with gradient */}
      <div className="mt-8 h-px w-full bg-gradient-to-r from-border/50 via-border to-transparent" />
    </div>
  );
}
