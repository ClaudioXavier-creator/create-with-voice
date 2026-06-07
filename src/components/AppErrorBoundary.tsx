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
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.reload();
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
        </div>
      </div>
    );
  }
}
