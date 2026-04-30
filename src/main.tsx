import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

async function resetPreviewCacheIfNeeded() {
  if (typeof window === "undefined") return;

  const isLovablePreview = window.location.hostname.includes("lovableproject.com");
  if (!isLovablePreview) return;

  const hasServiceWorker = "serviceWorker" in navigator;
  const hasCacheApi = "caches" in window;
  const reloadFlag = "preview-cache-reset-v1";

  if (hasServiceWorker) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    if (registrations.length > 0) {
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  }

  if (hasCacheApi) {
    const cacheKeys = await window.caches.keys();
    await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
  }

  if (!sessionStorage.getItem(reloadFlag)) {
    sessionStorage.setItem(reloadFlag, "done");
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(reloadFlag);
}

resetPreviewCacheIfNeeded().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
