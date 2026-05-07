import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any leftover service workers and clear caches in preview/iframe
// contexts to avoid stale assets. Never reload — reloading inside the Lovable
// preview iframe causes infinite loops.
function cleanupStaleServiceWorkers() {
  if (typeof window === "undefined") return;

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const isPreviewHost =
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("id-preview--");

  if (!isInIframe && !isPreviewHost) return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }

  if ("caches" in window) {
    window.caches
      .keys()
      .then((keys) => keys.forEach((k) => window.caches.delete(k)))
      .catch(() => {});
  }
}

cleanupStaleServiceWorkers();

// Force logout in Lovable preview iframe so the app always starts as a visitor.
// Only runs once per preview tab (sessionStorage flag), and never on production.
async function forceLogoutInPreview() {
  if (typeof window === "undefined") return;
  let isInIframe = false;
  try { isInIframe = window.self !== window.top; } catch { isInIframe = true; }
  const isPreviewHost =
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("id-preview--");
  if (!isInIframe && !isPreviewHost) return;
  if (window.location.hostname === "www.bpfconsult.com.br") return;
  if (sessionStorage.getItem("__preview_logged_out__")) return;
  sessionStorage.setItem("__preview_logged_out__", "1");
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

void forceLogoutInPreview();
createRoot(document.getElementById("root")!).render(<App />);
