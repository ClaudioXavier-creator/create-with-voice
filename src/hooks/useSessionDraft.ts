import { useState, useEffect, useCallback } from "react";

/**
 * Persists form state in sessionStorage so data survives navigation
 * but is lost when the browser tab/window is closed.
 * Call clearDraft() after a successful save.
 */
export function useSessionDraft<T>(key: string, initialValue: T) {
  const storageKey = `draft_${key}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as T;
    } catch {}
    return initialValue;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [value, storageKey]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  return [value, setValue, clearDraft] as const;
}
