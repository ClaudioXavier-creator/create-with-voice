import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister stale service workers and clear caches when running in browser
// contexts that are prone to serving outdated chunks after publish. Never
// reload here — reloading inside the Lovable preview iframe causes loops.
function cleanupStaleServiceWorkers() {
  if (typeof window === "undefined") return;

  // Manual cache busting version - update this to force a full refresh.
  const APP_VERSION = "2024.05.14.v5"; 

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const isPreviewHost =
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("id-preview--");

  const isPublishedHost =
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("bpfconsult.com.br");

  const storedVersion = localStorage.getItem("__app_version__");
  const versionMismatch = storedVersion !== APP_VERSION;
  
  // Nunca force cleanup no preview do Lovable: isso pode invalidar chunks durante a navegação
  // e deixar telas lazy-loaded presas em fallback infinito.
  const shouldCleanup = !isPreviewHost && versionMismatch;

  if (!shouldCleanup) return;

  console.log("[CacheBuster] Cleaning up stale service workers and caches...", { 
    isPreviewHost, isPublishedHost, versionMismatch 
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((r) => r.unregister());
      })
      .catch(() => {});
  }

  if ("caches" in window) {
    window.caches
      .keys()
      .then((keys) => {
        keys.forEach((k) => window.caches.delete(k));
      })
      .catch(() => {});
  }

  localStorage.setItem("__app_version__", APP_VERSION);
  sessionStorage.setItem("__sw_cleanup_done__", "1");
  
  // Reload only on version mismatch and not in an iframe to avoid loops
  if (versionMismatch && !isInIframe) {
    console.log("[CacheBuster] Version mismatch, reloading page...");
    setTimeout(() => window.location.reload(), 300);
  }
}

cleanupStaleServiceWorkers();

// Removed automatic logout in preview as it can interfere with testing session-based features.

createRoot(document.getElementById("root")!).render(<App />);
