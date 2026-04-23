import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { useOnlineStatus, useOfflineQueueCount } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

/**
 * Banner global que aparece no topo do app quando:
 * - O dispositivo está offline, OU
 * - Existem itens pendentes na fila offline aguardando sincronização.
 *
 * A reconexão é detectada automaticamente; mostra um aviso de "sincronizando"
 * por alguns segundos antes de desaparecer.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const pendingCount = useOfflineQueueCount();
  const [justReconnected, setJustReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setJustReconnected(false);
      return;
    }
    if (wasOffline) {
      setJustReconnected(true);
      setWasOffline(false);
      const t = window.setTimeout(() => setJustReconnected(false), 4000);
      return () => window.clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  // Não mostra nada se está online, sem pendências e sem reconexão recente
  if (isOnline && pendingCount === 0 && !justReconnected) return null;

  const variant: "offline" | "syncing" | "reconnected" = !isOnline
    ? "offline"
    : pendingCount > 0
      ? "syncing"
      : "reconnected";

  const styles: Record<typeof variant, string> = {
    offline: "border-destructive/40 bg-destructive/10 text-destructive",
    syncing: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    reconnected: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };

  const icon =
    variant === "offline" ? (
      <CloudOff className="h-4 w-4 shrink-0" />
    ) : variant === "syncing" ? (
      <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
    ) : (
      <Wifi className="h-4 w-4 shrink-0" />
    );

  const message =
    variant === "offline"
      ? pendingCount > 0
        ? `Sem conexão — ${pendingCount} ${pendingCount === 1 ? "registro pendente" : "registros pendentes"} na fila offline. Os dados serão sincronizados automaticamente quando a internet voltar.`
        : "Sem conexão — você pode continuar usando o Modo Tablet; novos registros entram na fila offline e sincronizam automaticamente."
      : variant === "syncing"
        ? `Sincronizando ${pendingCount} ${pendingCount === 1 ? "registro pendente" : "registros pendentes"}…`
        : "Conexão restabelecida — sincronizando dados.";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-full border-b px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-2",
        styles[variant],
      )}
    >
      {icon}
      <span className="text-center leading-snug">{message}</span>
    </div>
  );
}
