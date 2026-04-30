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
createRoot(document.getElementById("root")!).render(<App />);
