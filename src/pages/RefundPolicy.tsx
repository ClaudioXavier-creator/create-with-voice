import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

const SELLER = "Cláudio Luiz Xavier Nunes";
const TRADING = "BPF_Consult";
const CONTACT = "contato@bpfconsult.com.br";

export default function RefundPolicy() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#173404]">Política de Reembolso</h1>
          <div className="w-20" />
        </div>

        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-2"><strong>Vendedor:</strong> {SELLER} (operando sob o nome comercial "{TRADING}").</p>
            <p className="text-slate-600 mb-6 text-sm italic">Última atualização: 27 de maio de 2026</p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Garantia de 30 dias</h2>
            <p className="text-slate-600 mb-4">
              Oferecemos uma <strong>garantia de satisfação de 30 dias</strong>. Se você não estiver satisfeito com sua compra, pode solicitar reembolso integral em até 30 dias corridos a partir da data do pedido.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Como solicitar o reembolso</h2>
            <p className="text-slate-600 mb-4 border-l-4 border-primary pl-4 bg-primary/5 py-3">
              Os reembolsos são processados pelo nosso provedor de pagamentos, <strong>Paddle</strong>, que atua como Merchant of Record de todas as nossas vendas. Para solicitar, acesse <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">paddle.net</a> e localize sua compra usando o e-mail utilizado no checkout, ou entre em contato com nosso suporte em <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Cancelamento de assinatura</h2>
            <p className="text-slate-600 mb-4">
              Você pode cancelar sua assinatura recorrente a qualquer momento através de paddle.net ou solicitando ao suporte. O cancelamento interrompe cobranças futuras; o acesso permanece ativo até o final do ciclo já pago. Reembolsos proporcionais ao período já utilizado não se aplicam fora da janela inicial de 30 dias, salvo disposição legal em contrário.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Processamento</h2>
            <p className="text-slate-600 mb-4">
              Reembolsos aprovados são creditados no mesmo método de pagamento utilizado na compra e podem levar de 3 a 10 dias úteis para serem refletidos pela operadora do cartão ou método de pagamento.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Mais informações</h2>
            <p className="text-slate-600 mb-4">
              Para informações adicionais, consulte também a <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Reembolso do Paddle</a>.
            </p>
          </div>
        </ScrollArea>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Button onClick={() => navigate(-1)} className="bg-[#173404] text-white rounded-full px-8">Entendido</Button>
        </div>
      </div>
    </div>
  );
}
