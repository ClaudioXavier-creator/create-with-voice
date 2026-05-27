import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-xl font-bold text-[#173404]">Termos de Uso</h1>
          <div className="w-20"></div>
        </div>
        
        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6 font-semibold">BPF_Consult / Claudio Luiz Nunes</p>
            <p className="text-slate-600 mb-6 text-sm italic">Última atualização: 27 de maio de 2026</p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Aceitação</h2>
            <p className="text-slate-600 mb-4">
              Ao acessar nossas plataformas, você aceita estes termos. O serviço é destinado ao setor agroindustrial e de nutrição animal.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Licenciamento e Assinaturas</h2>
            <p className="text-slate-600 mb-4">
              O acesso aos sistemas é concedido mediante assinatura recorrente ou pagamento único, conforme o plano escolhido. O uso é intransferível e vinculado ao CNPJ/Empresa cadastrada.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Pagamentos e Merchant of Record (Paddle)</h2>
            <p className="text-slate-600 mb-4 border-l-4 border-primary pl-4">
              Nossos pedidos são processados pelo nosso parceiro de faturamento, o Paddle. O Paddle atua como nosso revendedor autorizado e Merchant of Record, sendo responsável por todas as consultas de serviço ao cliente relacionadas ao pagamento e devoluções.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Proibições</h2>
            <p className="text-slate-600 mb-4">
              É proibido: Realizar engenharia reversa, sublicenciar o software sem autorização, ou utilizar a plataforma para fins ilegais ou fora do escopo técnico de boas práticas de fabricação.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Propriedade Intelectual</h2>
            <p className="text-slate-600 mb-4">
              Todos os algoritmos, templates de POPs, checklists baseados em decretos oficiais e interfaces são de propriedade intelectual da BPF_Consult.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">6. Suporte</h2>
            <p className="text-slate-600 mb-4">
              O suporte técnico é realizado via e-mail (contato@bpfconsult.com.br) ou WhatsApp oficial, dentro do horário comercial.
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
