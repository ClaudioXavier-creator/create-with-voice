import { test as base, expect } from "lovable-agent-playwright-config/fixture";

export const test = base.extend({
  page: async ({ page }, use) => {
    const logs: string[] = [];
    const errors: Error[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      errors.push(err);
    });

    await use(page);

    if (errors.length > 0) {
      throw new Error(
        `Page errors detected:\n${errors.map((e) => e.stack || e.message).join("\n")}`
      );
    }

    if (logs.length > 0) {
      // Filtrando warnings conhecidos se necessário, mas o usuário pediu para falhar em erros
      throw new Error(`Console errors detected:\n${logs.join("\n")}`);
    }
  },
});

export { expect };
