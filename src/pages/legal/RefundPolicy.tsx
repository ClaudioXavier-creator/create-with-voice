import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RefundPolicy() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <h1 className="text-4xl font-bold tracking-tight text-[#173404]">Política de Reembolso</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Garantia de Satisfação</h2>
            <p>
              Oferecemos um período de teste gratuito (Trial) de 7 dias para a maioria dos nossos produtos. Recomendamos fortemente o uso do período de teste para avaliar se a solução atende às suas necessidades antes de realizar a compra.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Prazo para Arrependimento</h2>
            <p>
              Em conformidade com o Código de Defesa do Consumidor, você tem o direito de solicitar o reembolso total em até 7 dias após a primeira contratação do serviço, caso não esteja satisfeito.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Como solicitar</h2>
            <p>
              Para solicitar um reembolso, você pode:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Entrar em contato através do e-mail contato@bpfconsult.com.br;</li>
              <li>Utilizar o portal de suporte do Paddle em <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">paddle.net</a>.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Cancelamento de Assinatura</h2>
            <p>
              O cancelamento de uma assinatura recorrente impede cobranças futuras, mas não gera reembolso proporcional ao período já utilizado, exceto nos casos previstos na cláusula de arrependimento inicial.
            </p>
          </section>
        </div>
        
        <footer className="pt-8 border-t text-sm text-muted-foreground">
          Última atualização: 27 de maio de 2026
        </footer>
      </div>
    </div>
  );
}
