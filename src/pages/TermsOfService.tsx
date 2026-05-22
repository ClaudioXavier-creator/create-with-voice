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
          <Button variant="ghost" onClick={() => navigate("/bpf-consult")} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#173404]">Termos de Uso</h1>
          <div className="w-20"></div>
        </div>
        
        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-slate-600 mb-4">
              Ao acessar a plataforma BPF_Consult, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Licença de Uso</h2>
            <p className="text-slate-600 mb-4">
              É concedida permissão para acessar os módulos contratados (Feed_BPF, Agro RC, NutriCRM, etc.) exclusivamente para fins de gestão interna e conformidade regulatória da sua empresa.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Responsabilidades</h2>
            <p className="text-slate-600 mb-4">
              A BPF_Consult fornece ferramentas para auxiliar na conformidade com a IN 17/2023 do MAPA. No entanto, a responsabilidade final pela veracidade das informações inseridas e pelo cumprimento das normas vigentes é do usuário e da empresa contratante.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Limitações</h2>
            <p className="text-slate-600 mb-4">
              Em nenhum caso a BPF_Consult ou seus fornecedores serão responsáveis por quaisquer danos decorrentes do uso ou da incapacidade de usar os materiais na plataforma, mesmo que tenhamos sido notificados da possibilidade de tais danos.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Modificações</h2>
            <p className="text-slate-600 mb-4">
              A BPF_Consult pode revisar estes termos de serviço a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos.
            </p>
            
            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">6. Lei Aplicável</h2>
            <p className="text-slate-600 mb-4">
              Estes termos e condições são regidos e interpretados de acordo com as leis brasileiras e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.
            </p>
          </div>
        </ScrollArea>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Button onClick={() => navigate("/bpf-consult")} className="bg-[#173404] text-white rounded-full px-8">
            Aceitar Termos
          </Button>
        </div>
      </div>
    </div>
  );
}
