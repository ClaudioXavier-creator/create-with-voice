import { useEffect, useState } from "react";

/**
 * Hook que monitora o status de conexão do navegador.
 * Retorna `true` se o dispositivo está online, `false` caso contrário.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook que conta o número de itens pendentes nas filas offline armazenadas
 * em localStorage (chaves que começam com "tablet_offline_queue_").
 * Atualiza automaticamente quando o storage muda.
 */
export function useOfflineQueueCount(): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeCount = () => {
      let total = 0;
      try {
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const key = window.localStorage.key(i);
          if (!key || !key.startsWith("tablet_offline_queue_")) continue;
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) total += parsed.length;
          } catch {
            // ignora chaves inválidas
          }
        }
      } catch {
        // ignora erro de acesso ao storage
      }
      setCount(total);
    };

    computeCount();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("tablet_offline_queue_")) {
        computeCount();
      }
    };

    // Eventos do mesmo tab via custom event
    const handleCustom = () => computeCount();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("offline-queue-updated", handleCustom);
    const interval = window.setInterval(computeCount, 5000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("offline-queue-updated", handleCustom);
      window.clearInterval(interval);
    };
  }, []);

  return count;
}
