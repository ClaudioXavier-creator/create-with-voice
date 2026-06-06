import * as Sentry from "@sentry/react";

// Sentry DSN é uma chave pública por design - seguro estar no código
const SENTRY_DSN = "https://d7a8cb48cdf7c7b4f4d554f6dd67d3fd@o4511515922006016.ingest.us.sentry.io/4511515977777152";

export const initSentry = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });
    console.log("Sentry initialized");
  }
};

export const captureError = (error: any, context?: any) => {
  console.error("Captured Error:", error, context);
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};
