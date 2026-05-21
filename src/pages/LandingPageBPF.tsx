import React from "react";
import { 
  ArrowRight, CheckCircle2, Factory, ClipboardCheck, 
  Search, BarChart3, ShieldCheck, Tag, Building2, 
  MessageCircle, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function LandingPageBPF() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#173404] py-20 px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">Sua fábrica em conformidade. Seus processos no digital. Seu negócio no controle.</h1>
          <p className="text-lg sm:text-xl text-green-100/80 mb-10">Plataforma e consultoria especializada em BPF, auditorias digitais, rastreabilidade e CRM para fábricas de rações e suplementos animais - com total aderência à IN 17/2023 do MAPA.</p>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" className="bg-[#97C459] hover:bg-[#86b14d] text-[#173404] font-bold text-lg px-8 py-6 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95">
              🟢 Agendar demonstração gratuita
            </Button>
            <Button variant="link" className="text-white underline">Conhecer a plataforma →</Button>
            <p className="text-xs text-green-100/60 uppercase">Sem burocracia. Sem compromisso. Em 30 minutos você vê como funciona na prática.</p>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#173404] text-center mb-4">Você ainda lida com alguma dessas situações?</h2>
          <p className="text-gray-600 text-center mb-12">São problemas comuns no setor. Mas nenhum deles precisa continuar assim.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "A documentação de BPF está espalhada em pastas, planilhas e e-mails.",
              "Não sei se meus rótulos estão conforme a IN 17/2023.",
              "Se houver um problema com um lote, não consigo rastrear.",
              "Minha equipe comercial trabalha de forma informal.",
              "Já passei por uma auditoria difícil e não quero repetir.",
              "Cresci como empresa, mas meu controle de qualidade ainda é manual."
            ].map((text, i) => (
              <Card key={i} className="p-6 border-l-4 border-l-[#97C459] shadow-sm">
                <CardContent className="p-0 text-gray-700 italic">"{text}"</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#173404] text-center mb-12">Uma plataforma feita para quem fabrica. Uma consultoria para quem quer resultado.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center shadow-lg border-t-4 border-t-[#173404]">
              <Factory className="h-12 w-12 text-[#173404] mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-3">Plataforma Digital</h3>
              <p className="text-gray-600">Módulos integrados para BPF, auditorias, rastreabilidade, rotulagem e CRM.</p>
            </Card>
            <Card className="p-6 text-center shadow-lg border-t-4 border-t-[#173404]">
              <ClipboardCheck className="h-12 w-12 text-[#173404] mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-3">Consultoria Especializada</h3>
              <p className="text-gray-600">Diagnóstico, implantação e acompanhamento contínuo por especialistas.</p>
            </Card>
            <Card className="p-6 text-center shadow-lg border-t-4 border-t-[#173404]">
              <ShieldCheck className="h-12 w-12 text-[#173404] mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-3">Conformidade Garantida</h3>
              <p className="text-gray-600">Desenvolvido com base na IN 17/2023 e nas normas MAPA vigentes.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA final section abbreviated for now... */}
    </div>
  );
}
