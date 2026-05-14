import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Sparkles, Tag, FileText, Layers, Printer, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const PreviewAlert = () => (
  <Alert variant="default" className="bg-teal-500/10 border-teal-500/20 mb-6">
    <Info className="h-4 w-4 text-teal-600" />
    <AlertTitle className="text-teal-700 font-bold">Nutri_Agro Labels — Ambiente Dedicado</AlertTitle>
    <AlertDescription className="text-teal-600">
      Este é o ambiente exclusivo para geração e gestão de rótulos comerciais.
    </AlertDescription>
  </Alert>
);

export const RotulosDashboardPage = () => (
  <div className="space-y-6">
    <PreviewAlert />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
        <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Acesso Rápido</h4>
        <div className="space-y-3">
          <Button className="w-full justify-start gap-3" variant="outline">
            <Tag className="h-4 w-4 text-teal-600" /> Criar Novo Rótulo
          </Button>
          <Button className="w-full justify-start gap-3" variant="outline">
            <FileText className="h-4 w-4 text-teal-600" /> Ficha Técnica RTPI
          </Button>
          <Button className="w-full justify-start gap-3" variant="outline">
            <Printer className="h-4 w-4 text-teal-600" /> Configurar Impressora
          </Button>
        </div>
      </div>
      <div className="md:col-span-2 p-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-2xl bg-teal-500/[0.02]">
        <Sparkles className="h-12 w-12 text-teal-200 mb-4" />
        <h3 className="text-xl font-bold mb-2 text-foreground">Gerador de Rótulos</h3>
        <p className="text-muted-foreground max-w-md">Em breve, o gerador de rótulos será totalmente integrado a esta nova interface com salvamento automático na nuvem.</p>
      </div>
    </div>
  </div>
);

export const GenericModule = ({ name, icon: Icon }: any) => (
  <div className="p-20 flex flex-col items-center justify-center text-center">
    <div className="h-20 w-20 rounded-full bg-teal-500/10 flex items-center justify-center mb-6">
      <Icon className="h-10 w-10 text-teal-600" />
    </div>
    <h2 className="text-2xl font-bold mb-2">{name}</h2>
    <p className="text-muted-foreground">Módulo do Nutri_Agro Labels em fase de migração para o novo ambiente isolado.</p>
  </div>
);
