import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
          <h1 className="text-xl font-bold text-[#173404]">Política de Reembolso</h1>
          <div className="w-20"></div>
        </div>
        
        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6 font-semibold">BPF_Consult / Claudio Luiz Nunes</p>
            <p className="text-slate-600 mb-6 text-sm italic">Última atualização: 27 de maio de 2026</p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Período de Reembolso</h2>
            <p className="text-slate-600 mb-4">
              Oferecemos uma garantia de reembolso de até 14 dias após a contratação inicial para todos os nossos planos. Caso não esteja satisfeito, você pode solicitar o estorno integral.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Solicitação via Paddle</h2>
            <p className="text-slate-600 mb-4 font-bold border-l-4 border-primary pl-4">
              Como utilizamos o Paddle como nosso parceiro oficial de pagamentos (Merchant of Record), você pode solicitar o reembolso diretamente através do portal <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">paddle.net</a> ou entrando em contato com nosso suporte.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Cancelamento</h2>
            <p className="text-slate-600 mb-4">
              Você pode cancelar sua assinatura recorrente a qualquer momento. O cancelamento interrompe cobranças futuras, mas não gera reembolso proporcional ao período já utilizado da mensalidade corrente, exceto se solicitado dentro dos primeiros 14 dias.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Processamento</h2>
            <p className="text-slate-600 mb-4">
              Os reembolsos são processados pelo Paddle no mesmo método de pagamento utilizado na compra e podem levar de 3 a 10 dias úteis para aparecer em sua fatura.
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
