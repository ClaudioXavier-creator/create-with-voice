import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <h1 className="text-4xl font-bold tracking-tight text-[#173404]">Termos de Uso</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar as plataformas da BPF_Consult, você concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte, não deve utilizar nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Uso do Serviço</h2>
            <p>
              Nossos serviços são destinados ao uso profissional e corporativo no setor de nutrição animal. Você é responsável por manter a confidencialidade de sua conta e senha.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Pagamentos e Assinaturas</h2>
            <p>
              Os pagamentos são processados pelo Paddle, que atua como nosso Merchant of Record. Ao realizar uma compra, você concorda com os termos de venda do Paddle. As assinaturas podem ser canceladas a qualquer momento através do painel do usuário ou solicitando via suporte.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, software e metodologias das plataformas (Feed_BPF, Audits_BPF, etc.) são de propriedade exclusiva da BPF_Consult ou de seus licenciadores.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Limitação de Responsabilidade</h2>
            <p>
              A BPF_Consult fornece ferramentas de apoio à conformidade técnica. A responsabilidade final pela conformidade regulatória e qualidade dos produtos fabricados é exclusiva do usuário/fábrica.
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
