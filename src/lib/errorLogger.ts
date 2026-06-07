/**
 * Centralized logger for critical app errors (white-screen, ChunkLoadError, boot failsafe).
 * - Logs to console with rich context
 * - Forwards to Sentry when available
 * - Persists to public.app_error_logs (admin-visible)
 */
import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";

export type AppErrorType =
  | "boundary"
  | "chunk_error"
  | "boot_failsafe"
  | "unhandled_error"
  | "promise_rejection";

interface LogPayload {
  type: AppErrorType;
  message?: string;
  stack?: string;
  componentStack?: string;
  extra?: Record<string, unknown>;
}

function safe<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

export async function logAppError(payload: LogPayload): Promise<void> {
  const now = Date.now();
  const bootT0 = safe(() => window.__BOOT_T0__);
  const bootElapsed = bootT0 ? now - bootT0 : null;
  const appVersion =
    safe(() => localStorage.getItem("__app_version__")) ?? "unknown";
  const route =
    safe(() => window.location.pathname + window.location.search) ?? null;
  const userAgent = safe(() => navigator.userAgent) ?? null;

  const enriched = {
    ...payload,
    route,
    userAgent,
    appVersion,
    bootElapsedMs: bootElapsed,
    timestamp: new Date().toISOString(),
  };

  // 1. Console (always, with grouping for visibility)
  // eslint-disable-next-line no-console
  console.groupCollapsed(
    `%c[AppError:${payload.type}]%c ${payload.message ?? "(no message)"}`,
    "color:#fff;background:#b91c1c;padding:2px 6px;border-radius:4px;font-weight:700",
    "color:inherit"
  );
  // eslint-disable-next-line no-console
  console.log("Context:", enriched);
  if (payload.stack) {
    // eslint-disable-next-line no-console
    console.log("Stack:", payload.stack);
  }
  if (payload.componentStack) {
    // eslint-disable-next-line no-console
    console.log("Component stack:", payload.componentStack);
  }
  // eslint-disable-next-line no-console
  console.groupEnd();

  // 2. Sentry
  try {
    Sentry.captureMessage(`[${payload.type}] ${payload.message ?? ""}`, {
      level: "error",
      extra: enriched,
    });
  } catch {
    // ignore
  }

  // 3. Persist to DB (best-effort, never block UI)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    await supabase.from("app_error_logs").insert({
      user_id: userId,
      error_type: payload.type,
      message: payload.message ?? null,
      stack: payload.stack ?? null,
      component_stack: payload.componentStack ?? null,
      route,
      user_agent: userAgent,
      app_version: appVersion,
      boot_elapsed_ms: bootElapsed,
      extra: payload.extra ? (payload.extra as Record<string, unknown>) : null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[errorLogger] Failed to persist error log:", err);
  }
}
