import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister stale service workers and clear caches so the latest vitrine is
// always served instead of an older offline copy.
function cleanupStaleServiceWorkers() {
  if (typeof window === "undefined") return;

  // APP_VERSION is automatically generated from the build timestamp injected by Vite
  // (see `define` in vite.config.ts). Each new build produces a new version string,
  // which forces clients to clear stale service workers and cached chunks.
  const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || "dev";
  const APP_VERSION = `auto-${BUILD_TIME}`;

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const isPreviewHost =
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("id-preview--");

  const isPublishedHost =
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("bpfconsult.com.br");

  const storedVersion = localStorage.getItem("__app_version__");
  const versionMismatch = storedVersion !== APP_VERSION;

  // In preview environments, always force cleanup on every load to guarantee
  // the freshest build is served (avoids stale chunk import errors).
  const shouldCleanup = versionMismatch || isPreviewHost;

  if (!shouldCleanup) return;

  console.log("[CacheBuster] Executing forced cleanup...", {
    versionMismatch,
    isPreviewHost,
    APP_VERSION,
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

  localStorage.setItem("__app_version__", APP_VERSION);

  // Hard reload on real version mismatch (new build deployed). Use a session flag
  // to guarantee we never loop, even in preview iframes.
  if (versionMismatch && storedVersion !== null) {
    const reloadFlag = "__app_version_reloaded__";
    if (!sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, APP_VERSION);
      console.log("[CacheBuster] Version mismatch, forcing hard reload...");
      setTimeout(() => {
        const base = window.location.href.split("#")[0].split("?")[0];
        window.location.replace(base + "?v=" + Date.now());
      }, 300);
    }
  }
}

cleanupStaleServiceWorkers();

// Removed automatic logout in preview as it can interfere with testing session-based features.

createRoot(document.getElementById("root")!).render(<App />);
