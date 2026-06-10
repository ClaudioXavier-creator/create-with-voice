import React from "react";
import * as Sentry from "@sentry/react";

interface State {
  hasError: boolean;
  error?: Error;
}

export default class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info);
    try {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    } catch {
      // ignore
    }
    // Persist to DB so admins can inspect later
    import("@/lib/errorLogger")
      .then(({ logAppError }) =>
        logAppError({
          type: "boundary",
          message: error.message,
          stack: error.stack,
          componentStack: info.componentStack ?? undefined,
        })
      )
      .catch(() => {});
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
      // Em caso de erro crítico, forçamos o cache buster a rodar
      localStorage.setItem("__boot_critical_error__", "true");
    } catch {}
    window.location.reload();
  };

  handleForceUpdate = () => {
    try {
      sessionStorage.clear();
      // Remove a versão atual para forçar o CacheBuster no main.tsx a limpar TUDO
      localStorage.removeItem("__app_version__");
      localStorage.setItem("__boot_critical_error__", "true");
      
      // Limpeza agressiva de caches via API antes do reload
      if ("caches" in window) {
        window.caches.keys().then((keys) => {
          Promise.all(keys.map(key => window.caches.delete(key)));
        });
      }
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) reg.unregister();
        });
      }
    } catch {}
    
    // Recarrega com cache bypass e timestamp para evitar cache do navegador/CDN
    const base = window.location.href.split("#")[0].split("?")[0];
    window.location.replace(base + "?v=" + Date.now());
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isChunkError =
      this.state.error?.name === "ChunkLoadError" ||
      /Loading chunk|Failed to fetch dynamically imported module/i.test(
        this.state.error?.message || ""
      );

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "hsl(145, 20%, 98%)",
          color: "hsl(155, 40%, 12%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "white",
            border: "1px solid hsl(150, 15%, 90%)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 10px 30px -10px hsl(158 75% 24% / 0.15)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "hsl(0, 84%, 60%, 0.1)",
              color: "hsl(0, 84%, 60%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              fontSize: 28,
            }}
            aria-hidden
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            {isChunkError ? "Atualização disponível" : "Algo deu errado"}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "hsl(155, 10%, 35%)",
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}
          >
            {isChunkError
              ? "Detectamos uma nova versão do sistema. Recarregue a página para continuar."
              : "Encontramos um problema inesperado. Tente recarregar a página — seus dados estão salvos."}
          </p>

          {this.state.error?.message && !isChunkError && (
            <pre
              style={{
                fontSize: 11,
                background: "hsl(150, 10%, 94%)",
                padding: 12,
                borderRadius: 8,
                textAlign: "left",
                overflowX: "auto",
                margin: "0 0 20px",
                color: "hsl(155, 10%, 35%)",
                maxHeight: 120,
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: "hsl(158, 75%, 24%)",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Recarregar página
              </button>
              <button
                onClick={this.handleHome}
                style={{
                  background: "transparent",
                  color: "hsl(155, 40%, 12%)",
                  border: "1px solid hsl(150, 15%, 90%)",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ir para o início
              </button>
            </div>

            <div 
              style={{ 
                marginTop: 8,
                paddingTop: 16,
                borderTop: "1px solid hsl(150, 15%, 90%)",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <span style={{ fontSize: 11, color: "hsl(155, 10%, 60%)" }}>
                Build: {import.meta.env.VITE_BUILD_TIME ? new Date(import.meta.env.VITE_BUILD_TIME).toLocaleString('pt-BR') : 'dev'}
              </span>
              <button
                onClick={this.handleForceUpdate}
                style={{
                  background: "transparent",
                  color: "hsl(0, 84%, 60%)",
                  border: "1px solid hsl(0, 84%, 90%)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Limpar cache e forçar atualização
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
