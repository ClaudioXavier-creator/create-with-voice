import { Link } from "react-router-dom";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

export default function AdminAccess() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="relative inline-block mb-4">
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl" />
          <img
            src={logoBpfConsult}
            alt="BPF_Consult Logo"
            className="relative w-32 h-32 object-contain mx-auto drop-shadow-2xl"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Portal de Gestão
          </h1>
          <p className="text-slate-400">
            Acesso restrito a administradores e equipe interna da BPF_Consult.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-primary font-medium">
              Ambiente Seguro e Monitorado
            </p>
          </div>
          
          <Link to="/auth?product=admin" className="block w-full">
            <Button size="lg" className="w-full gap-2 text-base font-semibold shadow-lg shadow-primary/20">
              <Lock className="h-4 w-4" />
              Entrar no Portal
            </Button>
          </Link>
          
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o site público
          </Link>
        </div>
        
        <p className="text-xs text-slate-600">
          © 2026 BPF_Consult. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
