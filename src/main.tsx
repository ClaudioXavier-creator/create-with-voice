import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/monitoring";
import AppErrorBoundary from "./components/AppErrorBoundary";

declare global {
  interface Window {
    __BOOT_FAILSAFE__?: ReturnType<typeof setTimeout>;
    __BOOT_T0__?: number;
  }
}

initSentry();

// Remove o boot loader assim que o React montar
function removeBootLoader() {
  const loader = document.getElementById("boot-loader");
  if (!loader) return;
  if (window.__BOOT_FAILSAFE__) clearTimeout(window.__BOOT_FAILSAFE__);
  loader.classList.add("fade-out");
  setTimeout(() => loader.remove(), 320);
}

// Captura erros não tratados (ex.: chunk falhou ao carregar após restart do dev server)
window.addEventListener("error", (e) => {
  const msg = e?.message || "";
  const isChunk = /Loading chunk|Failed to fetch dynamically imported module|ChunkLoadError/i.test(msg);
  // Import dinâmico para evitar bundle inicial pesado e quebrar se supabase falhar
  import("./lib/errorLogger").then(({ logAppError }) =>
    logAppError({
      type: isChunk ? "chunk_error" : "unhandled_error",
      message: msg,
      stack: e?.error?.stack,
      extra: { filename: e?.filename, lineno: e?.lineno, colno: e?.colno },
    })
  ).catch(() => {});
  if (isChunk && !sessionStorage.getItem("__chunk_reload__")) {
    console.warn("[main] Chunk load error — reloading", msg);
    sessionStorage.setItem("__chunk_reload__", "1");
    setTimeout(() => window.location.reload(), 500);
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const reason: any = e?.reason;
  const msg = (reason && (reason.message || String(reason))) || "";
  const isChunk = /Loading chunk|Failed to fetch dynamically imported module/i.test(msg);
  import("./lib/errorLogger").then(({ logAppError }) =>
    logAppError({
      type: isChunk ? "chunk_error" : "promise_rejection",
      message: msg,
      stack: reason?.stack,
    })
  ).catch(() => {});
  if (isChunk && !sessionStorage.getItem("__chunk_reload__")) {
    console.warn("[main] Dynamic import failed — reloading", msg);
    sessionStorage.setItem("__chunk_reload__", "1");
    setTimeout(() => window.location.reload(), 500);
  }
});

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

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

// Limpa flag de reload se o app montou com sucesso
sessionStorage.removeItem("__chunk_reload__");
removeBootLoader();
