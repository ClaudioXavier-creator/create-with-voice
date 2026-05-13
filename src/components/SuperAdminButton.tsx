import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function SuperAdminButton() {
  const { user } = useAuth();
  
  // Acesso exclusivo para o seu e-mail ou admins
  const isAdmin = user?.email?.toLowerCase() === "claudiolx.nunes@gmail.com";
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <Link to="/admin">
        <button className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95">
          <ShieldCheck className="h-5 w-5 animate-pulse group-hover:animate-none" />
          <span className="font-semibold text-sm whitespace-nowrap">Super Admin (CRM)</span>
        </button>
      </Link>
    </div>
  );
}
