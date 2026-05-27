import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#173404]">Política de Privacidade</h1>
          <div className="w-20"></div>
        </div>
        
        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6 font-semibold">BPF_Consult / Claudio Luiz Nunes</p>
            <p className="text-slate-600 mb-6 text-sm italic">Última atualização: 27 de maio de 2026</p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Introdução</h2>
            <p className="text-slate-600 mb-4">
              A BPF_Consult (representada por Claudio Luiz Nunes) está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais ao utilizar nossos serviços.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Coleta de Dados</h2>
            <p className="text-slate-600 mb-4">
              Coletamos informações que você fornece diretamente (nome, e-mail, telefone, CNPJ) e dados de uso da plataforma (logs, endereço IP) para garantir o funcionamento técnico e suporte.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Merchant of Record (Paddle)</h2>
            <p className="text-slate-600 mb-4 font-bold border-l-4 border-primary pl-4">
              Nossa plataforma utiliza o Paddle como nosso parceiro de faturamento e Merchant of Record. O Paddle processa todos os pagamentos e lida com a conformidade fiscal global em nosso nome. Ao realizar uma compra, seus dados de faturamento serão processados de acordo com a política do Paddle.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Finalidade do Tratamento</h2>
            <p className="text-slate-600 mb-4">
              Os dados são utilizados para: Fornecer acesso aos sistemas (Feed_BPF, Audits_BPF, etc.), processar pagamentos, cumprir obrigações legais (LGPD) e garantir a conformidade técnica com normas do MAPA.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Compartilhamento e Retenção</h2>
            <p className="text-slate-600 mb-4">
              Não vendemos seus dados. Compartilhamos apenas com provedores essenciais (Paddle, Supabase). Retemos seus dados enquanto sua conta estiver ativa ou conforme necessário para obrigações fiscais.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">6. Seus Direitos</h2>
            <p className="text-slate-600 mb-4">
              Você pode solicitar acesso, correção ou exclusão de seus dados através do e-mail: contato@bpfconsult.com.br.
            </p>
          </div>
        </ScrollArea>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Button onClick={() => navigate(-1)} className="bg-[#173404] text-white rounded-full px-8">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
