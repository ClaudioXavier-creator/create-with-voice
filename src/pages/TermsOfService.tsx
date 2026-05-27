import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

const SELLER = "Cláudio Luiz Xavier Nunes";
const TRADING = "BPF_Consult";
const CONTACT = "contato@bpfconsult.com.br";

export default function TermsOfService() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#173404]">Termos e Condições de Uso</h1>
          <div className="w-20" />
        </div>

        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-2"><strong>Vendedor:</strong> {SELLER} (operando sob o nome comercial "{TRADING}").</p>
            <p className="text-slate-600 mb-6 text-sm italic">Última atualização: 27 de maio de 2026</p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Identificação do Vendedor</h2>
            <p className="text-slate-600 mb-4">
              Estes Termos e Condições ("Termos") regem o uso dos serviços e plataformas fornecidos por <strong>{SELLER}</strong>, atuando sob o nome comercial <strong>{TRADING}</strong> ("Vendedor", "nós"). Ao utilizar nossos serviços, você está contratando diretamente com {SELLER}.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Aceitação</h2>
            <p className="text-slate-600 mb-4">
              O uso continuado da plataforma implica concordância integral com estes Termos. Caso não concorde, interrompa o uso imediatamente. Você declara ter capacidade legal e, se contratando em nome de empresa, autoridade para vincular tal organização.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Descrição do Serviço</h2>
            <p className="text-slate-600 mb-4">
              Fornecemos software como serviço (SaaS) especializado em Boas Práticas de Fabricação, auditoria, CRM e gestão para o setor de nutrição animal — incluindo Feed_BPF, Audits_BPF, NutriCRM, AgroGestão CRM, Agro RC CRM e Nutri_Agro Labels.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Uso Aceitável e Proibições</h2>
            <p className="text-slate-600 mb-3">Você não pode:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
              <li>Usar a plataforma para fins ilegais, fraudulentos ou enganosos;</li>
              <li>Enviar spam, conteúdo malicioso, vírus ou malware;</li>
              <li>Violar direitos de propriedade intelectual de terceiros;</li>
              <li>Interferir na segurança ou integridade do serviço (probing, varredura, scraping massivo, tentativas de invasão);</li>
              <li>Realizar engenharia reversa, descompilar ou tentar extrair código-fonte;</li>
              <li>Revender, sublicenciar ou redistribuir o serviço sem autorização expressa;</li>
              <li>Contornar limites técnicos, controles de acesso ou cotas do plano contratado.</li>
            </ul>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Propriedade Intelectual</h2>
            <p className="text-slate-600 mb-4">
              Todos os direitos sobre a plataforma — software, código-fonte, documentação, marca, logotipos, layouts, templates de POPs, checklists e metodologias — pertencem exclusivamente a {SELLER}/{TRADING} ou seus licenciadores. Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável para usar o serviço conforme o plano contratado.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">6. Credenciais e Conteúdo do Usuário</h2>
            <p className="text-slate-600 mb-4">
              Você é responsável por manter a confidencialidade de suas credenciais e por toda atividade realizada em sua conta. Os dados operacionais que você insere permanecem de sua propriedade; você nos concede licença limitada para hospedá-los e processá-los exclusivamente para prestar o serviço.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">7. Pagamentos, Assinaturas e Merchant of Record</h2>
            <p className="text-slate-600 mb-4 border-l-4 border-primary pl-4 bg-primary/5 py-3">
              <strong>Nosso processo de pedido é conduzido pelo nosso revendedor online Paddle.com.</strong> Paddle.com é o Merchant of Record (MoR) de todos os nossos pedidos. O Paddle fornece atendimento ao cliente para todas as questões de pagamento e processa devoluções.
            </p>
            <p className="text-slate-600 mb-4">
              Para mecânicas detalhadas de pagamento, cobrança, impostos, renovação, cancelamento e estorno, consulte os <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Termos do Comprador do Paddle</a>. Assinaturas recorrentes são renovadas automaticamente até cancelamento. O cancelamento interrompe cobranças futuras conforme a <a href="/reembolso" className="text-primary underline">Política de Reembolso</a>.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">8. Nível de Serviço e Garantias</h2>
            <p className="text-slate-600 mb-4">
              Empenhamo-nos por alta disponibilidade, mas <strong>não garantimos operação ininterrupta ou livre de erros</strong>. Na máxima extensão permitida em lei, excluímos todas as garantias implícitas de comerciabilidade e adequação a um propósito específico. A plataforma é fornecida "como está".
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">9. Limitação de Responsabilidade</h2>
            <p className="text-slate-600 mb-4">
              Nossa responsabilidade agregada por quaisquer reivindicações está limitada ao valor pago por você nos 12 meses anteriores ao evento. Não respondemos por danos indiretos, consequenciais ou especiais, incluindo lucros cessantes, perda de dados ou de fundo de comércio. Não se excluem responsabilidades por dolo, fraude, morte ou lesão corporal onde a lei vedar.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">10. Suspensão e Rescisão</h2>
            <p className="text-slate-600 mb-4">
              Podemos suspender ou encerrar o acesso em caso de: (a) violação material destes Termos; (b) inadimplência; (c) risco de segurança ou fraude; (d) violações repetidas ou graves às políticas de uso. Encerrada a conta, disponibilizaremos janela razoável para exportação de dados antes da exclusão, salvo obrigação legal de guarda.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">11. Indenização</h2>
            <p className="text-slate-600 mb-4">
              Você concorda em indenizar e isentar {SELLER}/{TRADING} de quaisquer reclamações decorrentes de uso indevido da plataforma, do conteúdo que inserir ou de violação destes Termos.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">12. Lei Aplicável e Foro</h2>
            <p className="text-slate-600 mb-4">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do Vendedor para dirimir controvérsias, salvo disposição legal de proteção ao consumidor em contrário.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">13. Contato</h2>
            <p className="text-slate-600 mb-4">
              Dúvidas sobre estes Termos: <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>.
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
