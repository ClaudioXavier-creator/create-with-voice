import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Search, 
  ExternalLink, 
  Megaphone, 
  Smartphone, 
  Key, 
  Copy, 
  CheckCircle2,
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Marketing() {
  const navigate = useNavigate();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Marketing & Growth</h2>
        </div>
        <p className="text-muted-foreground">
          Ferramentas e guias para escalar seu negócio e melhorar sua comunicação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/gerador-headlines")}>
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Gerador de Headlines IA</CardTitle>
            <CardDescription>Crie chamadas irresistíveis para suas páginas e anúncios.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2">
              Acessar Gerador <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Adicione outros cards aqui se houver mais ferramentas */}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Tutoriais & Configurações</h3>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Smartphone className="h-6 w-6 text-[#F22F46]" />
                </div>
                <div>
                  <CardTitle>Twilio WhatsApp Sandbox</CardTitle>
                  <CardDescription>Como encontrar seu código de ativação "join word1-word2"</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-white">Tutorial Passo a Passo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                  Acesse o Console
                </div>
                <p className="text-sm text-muted-foreground">
                  Faça login na sua conta <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Twilio <ExternalLink className="h-3 w-3" /></a>.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                  Menu Messaging
                </div>
                <p className="text-sm text-muted-foreground">
                  No menu lateral esquerdo, clique em <strong>Messaging</strong> &gt; <strong>Try it out</strong> &gt; <strong>Send a WhatsApp message</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                  O Código Mágico
                </div>
                <p className="text-sm text-muted-foreground">
                  Você verá um quadro com um número de telefone (Sandbox Number) e uma instrução: <strong>"Join <span className="text-primary font-mono font-bold">word1-word2</span>"</strong>.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-dashed border-primary/40 space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Dica de Ouro
              </div>
              <p className="text-sm">
                O código é sempre composto pela palavra <strong>join</strong> seguida de duas palavras aleatórias (ex: <code className="bg-muted px-1 rounded">join glass-cow</code>).
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="bg-muted p-4 rounded-lg font-mono text-center flex-1 w-full sm:w-auto">
                  join [palavra1]-[palavra2]
                </div>
                <Button variant="secondary" onClick={() => copyToClipboard("join ")} className="gap-2">
                  <Copy className="h-4 w-4" /> Copiar Prefixo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                * Envie este código exatamente como aparece para o número do Sandbox informado na mesma tela para ativar sua conexão de teste.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
