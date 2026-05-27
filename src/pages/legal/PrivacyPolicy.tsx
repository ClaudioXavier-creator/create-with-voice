import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        
        <h1 className="text-4xl font-bold tracking-tight text-[#173404]">Política de Privacidade</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introdução</h2>
            <p>
              A BPF_Consult está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais ao utilizar nossos serviços e plataformas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Coleta de Dados</h2>
            <p>
              Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e dados da empresa ao criar uma conta ou entrar em contato conosco. Também coletamos dados técnicos automaticamente, como endereço IP e logs de uso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Uso das Informações</h2>
            <p>
              Utilizamos seus dados para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e manter nossos serviços (Feed_BPF, Audits_BPF, etc.);</li>
              <li>Processar pagamentos via Paddle (nosso parceiro de cobrança e Merchant of Record);</li>
              <li>Enviar comunicações importantes sobre sua conta;</li>
              <li>Melhorar nossa plataforma e suporte técnico.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados. Compartilhamos informações com parceiros essenciais, como o Paddle (para processamento de pagamentos e conformidade fiscal) e o Supabase (para armazenamento seguro de dados).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Seus Direitos</h2>
            <p>
              Conforme a LGPD (Lei Geral de Proteção de Dados), você tem direito a acessar, corrigir, excluir ou portar seus dados pessoais. Entre em contato pelo e-mail contato@bpfconsult.com.br para exercer esses direitos.
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
