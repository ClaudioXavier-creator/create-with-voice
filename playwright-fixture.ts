import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    const logs: string[] = [];
    const errors: Error[] = [];

    page.on("console", (msg) => {
      // Falhar explicitamente em erros de console
      if (msg.type() === "error") {
        // Opcional: Ignorar erros conhecidos do Sentry se necessário, 
        // mas o usuário pediu para incluir Sentry.
        logs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      errors.push(err);
    });

    await use(page);

    if (errors.length > 0) {
      throw new Error(
        `Page errors detected during test:\n${errors.map((e) => e.stack || e.message).join("\n")}`
      );
    }

    if (logs.length > 0) {
      throw new Error(`Console errors detected during test:\n${logs.join("\n")}`);
    }
  },
});

export { expect };
