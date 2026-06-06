---
name: configure-sentry
description: Installs and configures Sentry error monitoring in a React project with a hardcoded DSN.
---

# Configure Sentry Monitoring

Configure Sentry error tracking in a React project using a hardcoded DSN.

## Prerequisites
- The project must be a React project using Vite.

## Steps
1. Install `@sentry/react` dependency using `bun add @sentry/react`.
2. Create `src/lib/monitoring.ts` with Sentry initialization code.
3. Import and call `initSentry()` in `src/main.tsx`.

## Code Templates

### src/lib/monitoring.ts
```typescript
import * as Sentry from "@sentry/react";

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
  }
};

export const captureError = (error: any, context?: any) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};
```

### src/main.tsx Integration
Add `import { initSentry } from "./lib/monitoring";` and call `initSentry();` before app render.
