import { BookOpen, ClipboardList, CheckCircle2, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { POPS_CONFIG } from "@/config/popsConfig";

export default function GuiaGeralPops() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <PageHeader 
        icon={ClipboardList} 
        title="Guia Geral de Programas POP" 
        description="Entenda o fluxo de preenchimento, controle e auditoria dos POPs obrigatórios." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Ciclo de Vida do Registro</CardTitle>
            <CardDescription>O caminho que cada registro percorre no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">1</div>
                <div><p className="font-bold text-sm">Preenchimento</p><p className="text-xs text-muted-foreground">O executor realiza a tarefa e registra o dado em tempo real.</p></div>
            </div>
            <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">2</div>
                <div><p className="font-bold text-sm">Verificação</p><p className="text-xs text-muted-foreground">O supervisor ou RT confere se o registro está correto e assina.</p></div>
            </div>
            <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">3</div>
                <div><p className="font-bold text-sm">Arquivamento</p><p className="text-xs text-muted-foreground">O sistema armazena o histórico por 2 anos para auditorias do MAPA.</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Auditoria e Conformidade</CardTitle>
            <CardDescription>Como se preparar para fiscalizações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-background border flex gap-3 items-center">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div className="flex-1"><p className="text-xs font-bold">Documentação Vigente</p><p className="text-[10px] text-muted-foreground">Sempre mantenha a versão 01 dos POPs assinada no sistema.</p></div>
            </div>
            <div className="p-3 rounded-lg bg-background border flex gap-3 items-center">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <div className="flex-1"><p className="text-xs font-bold">Assinaturas Digitais</p><p className="text-[10px] text-muted-foreground">O sistema Feed_BPF atende aos requisitos de autenticidade.</p></div>
            </div>
            <Button className="w-full mt-2" variant="outline" onClick={() => navigate("/auditoria")}>Acessar Módulo de Auditoria</Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5" /> Acesso Rápido aos POPs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {POPS_CONFIG.slice(0, 10).map((pop) => {
             const popNum = pop.codigo.split("-")[1]?.replace(/^0+/, "");
             return (
               <Button 
                key={pop.codigo} 
                variant="outline" 
                className="h-auto py-3 px-4 flex flex-col items-center gap-1 group"
                onClick={() => navigate(`/guia-pops?pop=${pop.codigo}`)}
               >
                 <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Pop {popNum}</span>
                 <span className="text-xs font-bold truncate w-full text-center">{pop.nome.split(" ")[0]}...</span>
                 <ArrowRight className="w-3 h-3 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-all" />
               </Button>
             );
          })}
        </div>
      </div>

      <Card className="border-dashed border-2">
          <CardContent className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Deseja ver as ITs (Instruções de Trabalho) detalhadas?</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                  Acesse o Guia de ITs para ver o passo a passo operacional, materiais necessários e EPIs para cada atividade da fábrica.
              </p>
              <Button size="lg" onClick={() => navigate("/guia-pops")} className="mt-4">Ver ITs Detalhadas</Button>
          </CardContent>
      </Card>
    </div>
  );
}
