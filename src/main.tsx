import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister stale service workers and clear caches so the latest vitrine is
// always served instead of an older offline copy.
function cleanupStaleServiceWorkers() {
  if (typeof window === "undefined") return;

  // Manual cache busting version - update this to force a full refresh.
  const APP_VERSION = "2026.05.15.v04-FORCE-SITE-NOVO-CLEANUP";

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
  
  const shouldCleanup = versionMismatch;

  if (!shouldCleanup) return;

  console.log("[CacheBuster] Executing forced cleanup...", { 
    versionMismatch 
  });

  // 1. Unregister EVERY service worker found
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        console.log("[CacheBuster] Unregistering SW:", registration.scope);
        registration.unregister();
      }
    });
  }

  // 2. Clear ALL cache storage
  if ("caches" in window) {
    window.caches.keys().then((keys) => {
      for (const key of keys) {
        console.log("[CacheBuster] Deleting Cache:", key);
        window.caches.delete(key);
      }
    });
  }

  // 3. Clear storage that might hold old state
  if (versionMismatch) {
    localStorage.setItem("__app_version__", APP_VERSION);
    
    if (!isInIframe) {
      console.log("[CacheBuster] Version mismatch, forcing hard reload...");
      setTimeout(() => {
        // Force bypass of browser cache for the reload
        window.location.href = window.location.href.split('#')[0].split('?')[0] + '?v=' + Date.now();
      }, 500);
    }
  }
}

cleanupStaleServiceWorkers();

// Removed automatic logout in preview as it can interfere with testing session-based features.

createRoot(document.getElementById("root")!).render(<App />);
