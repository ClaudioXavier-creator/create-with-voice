import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ExternalRedirectProps {
  to: string;
  preservePath?: boolean;
  basePath?: string;
}

/**
 * Redireciona o navegador para uma URL externa.
 * Quando preservePath=true, anexa o path atual (removendo basePath) à URL destino.
 */
export const ExternalRedirect = ({ to, preservePath = false, basePath = "" }: ExternalRedirectProps) => {
  useEffect(() => {
    let target = to;
    if (preservePath) {
      const current = window.location.pathname;
      const rest = basePath && current.startsWith(basePath) ? current.slice(basePath.length) : current;
      target = to.replace(/\/$/, "") + (rest.startsWith("/") ? rest : `/${rest}`);
      target += window.location.search + window.location.hash;
    }
    window.location.replace(target);
  }, [to, preservePath, basePath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecionando para o programa…</p>
      </div>
    </div>
  );
};

export default ExternalRedirect;
