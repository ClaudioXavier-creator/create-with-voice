import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister stale service workers and clear caches when running in browser
// contexts that are prone to serving outdated chunks after publish. Never
// reload here — reloading inside the Lovable preview iframe causes loops.
function cleanupStaleServiceWorkers() {
  if (typeof window === "undefined") return;

  // Manual cache busting version - update this string to force a full refresh for all users
  const APP_VERSION = "2024.05.14.v1"; 

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

  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  
  // Always cleanup in preview/iframe. 
  // In published host, cleanup if version mismatch or not standalone.
  const storedVersion = localStorage.getItem("__app_version__");
  const versionMismatch = storedVersion !== APP_VERSION;
  
  const shouldCleanup = isPreviewHost || isInIframe || (isPublishedHost && !isStandalone) || versionMismatch;

  if (!shouldCleanup) return;

  // Only run once per session if the version matches
  if (!versionMismatch && sessionStorage.getItem("__sw_cleanup_done__")) return;
  
  console.log("[CacheBuster] Cleaning up stale service workers and caches...", { 
    isPreviewHost, isInIframe, isPublishedHost, isStandalone, versionMismatch 
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((r) => {
          console.log("[CacheBuster] Unregistering SW:", r.scope);
          r.unregister();
        });
      })
      .catch(() => {});
  }

  if ("caches" in window) {
    window.caches
      .keys()
      .then((keys) => {
        keys.forEach((k) => {
          console.log("[CacheBuster] Deleting cache:", k);
          window.caches.delete(k);
        });
      })
      .catch(() => {});
  }

  localStorage.setItem("__app_version__", APP_VERSION);
  sessionStorage.setItem("__sw_cleanup_done__", "1");
  
  // If there was a version mismatch, we might want to reload, 
  // but let's be careful not to loop in iframes.
  if (versionMismatch && !isInIframe) {
    console.log("[CacheBuster] Version mismatch detected, reloading...");
    setTimeout(() => window.location.reload(), 500);
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
