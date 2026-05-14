import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const ClearCacheButton = ({ className, showLabel = true }: { className?: string; showLabel?: boolean }) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // 1. Limpar CacheStorage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }

      // 2. Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }

      // 3. Limpar localStorage específico se necessário (opcional)
      // localStorage.clear(); // Cuidado: isso desloga o usuário

      toast.success("Cache limpo! Reiniciando aplicação...");

      // 4. Reload forçado
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      toast.error("Falha ao limpar cache. Tente novamente.");
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isClearing}
      onClick={handleClearCache}
      className={cn(
        "w-full justify-start text-[10px] text-sidebar-foreground/40 hover:text-primary hover:bg-primary/5 h-8 px-2 gap-2 transition-all group",
        className
      )}
      title="Limpar Cache e Atualizar"
    >
      <RefreshCw className={cn("h-3 w-3 shrink-0", isClearing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
      {showLabel && <span className="truncate">Limpar Cache e Atualizar</span>}
    </Button>
  );
};

export default ClearCacheButton;
