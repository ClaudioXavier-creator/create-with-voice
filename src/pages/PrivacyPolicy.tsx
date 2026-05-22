import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

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
            <p className="text-slate-600 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Introdução</h2>
            <p className="text-slate-600 mb-4">
              A BPF_Consult valoriza a sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nossa plataforma e serviços de consultoria técnica para nutrição animal.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Coleta de Dados</h2>
            <p className="text-slate-600 mb-4">
              Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e dados da empresa, ao solicitar uma demonstração ou utilizar nossos módulos (Feed_BPF, Audits_BPF, NutriCRM, etc.).
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Uso das Informações</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos seus dados para:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-4">
              <li>Fornecer e gerenciar o acesso à plataforma;</li>
              <li>Personalizar sua experiência de consultoria;</li>
              <li>Garantir a conformidade com a IN 17/2023 do MAPA;</li>
              <li>Enviar comunicações técnicas e atualizações do sistema.</li>
            </ul>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Segurança de Dados</h2>
            <p className="text-slate-600 mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, incluindo criptografia SSL e conformidade com a LGPD.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Seus Direitos</h2>
            <p className="text-slate-600 mb-4">
              Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento, conforme garantido pela Lei Geral de Proteção de Dados (LGPD).
            </p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">6. Contato</h2>
            <p className="text-slate-600 mb-4">
              Para questões sobre privacidade, entre em contato através do nosso suporte oficial.
            </p>
          </div>
        </ScrollArea>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Button onClick={() => navigate("/")} className="bg-[#173404] text-white rounded-full px-8">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
