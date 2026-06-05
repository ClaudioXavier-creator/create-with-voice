import { Link } from "react-router-dom";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

export function PublicFooter() {
  return (
    <footer className="bg-[#173404] py-12 text-center mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <img 
          src={logoBpfConsult} 
          alt="BPF_Consult" 
          className="mx-auto w-16 h-16 object-contain mb-6 opacity-40" 
        />
        <p className="text-green-100/40 text-sm font-medium mb-6">
          BPF_Consult © {new Date().getFullYear()} — Soluções para Nutrição Animal
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-green-100/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
          <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <Link to="/termos" className="hover:text-white transition-colors">Termos</Link>
          <Link to="/reembolso" className="hover:text-white transition-colors">Reembolso</Link>
          <Link to="/admin" className="hover:text-[#97C459] transition-colors border-l border-green-100/10 pl-8">Portal de Gestão</Link>
          <a href="mailto:contato@bpfconsult.com.br" className="hover:text-white transition-colors">Suporte</a>
        </div>
        <p className="mt-8 text-[10px] text-green-100/20 max-w-2xl mx-auto">
          Pagamentos processados com segurança via Paddle. O Paddle atua como nosso Merchant of Record e revendedor oficial.
        </p>
      </div>
    </footer>
  );
}
