import { test, expect, type Page } from "../playwright-fixture";

const PROJECT_REF = "uyrcxfypdzasdminxizq";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

const products = [
  { path: "/feedbpf", product: "feedbpf" },
  { path: "/audits-bpf", product: "auditsbpf" },
  { path: "/agrogestao", product: "agrogestao" },
  { path: "/agro-rc", product: "agro-rc" },
  { path: "/rotulos", product: "rotulos" },
  { path: "/nutricrm", product: "nutricrm" },
];

function fakeJwt(expSecondsFromNow = 3600) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@test.local",
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    iat: Math.floor(Date.now() / 1000),
  };
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/=+$/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${b64(header)}.${b64(payload)}.signature`;
}

async function seedFakeSession(page: Page) {
  const accessToken = fakeJwt();
  const session = {
    access_token: accessToken,
    refresh_token: "fake-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: "e2e@test.local",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(session) },
  );
}

test.describe("Páginas de produto - usuário deslogado", () => {
  for (const { path, product } of products) {
    test(`${path} envia para /auth com product=${product}`, async ({ page }) => {
      await page.goto(path);

      const signupHref = await page
        .getByRole("link", { name: /testar.*7 dias|trial|grátis/i })
        .first()
        .getAttribute("href");
      const loginHref = await page
        .getByRole("link", { name: /já.*cadastrad|acesse.*sistema|entrar|login/i })
        .first()
        .getAttribute("href");

      expect(signupHref).toContain("/auth");
      expect(signupHref).toContain(`product=${product}`);
      expect(signupHref).toContain("mode=signup");
      expect(signupHref).toContain("redirect=%2Fdashboard");

      expect(loginHref).toContain("/auth");
      expect(loginHref).toContain(`product=${product}`);
      expect(loginHref).toContain("mode=login");
    });
  }
});

test.describe("Páginas de produto - usuário logado", () => {
  test.beforeEach(async ({ page }) => {
    await seedFakeSession(page);
  });

  for (const { path } of products) {
    test(`${path} aponta CTAs direto para /dashboard`, async ({ page }) => {
      await page.goto(path);

      // Aguarda o AuthProvider hidratar a sessão a partir do localStorage.
      await expect
        .poll(async () => {
          return await page
            .getByRole("link", { name: /testar.*7 dias|trial|grátis/i })
            .first()
            .getAttribute("href");
        }, { timeout: 5000 })
        .toBe("/dashboard");

      const loginHref = await page
        .getByRole("link", { name: /já.*cadastrad|acesse.*sistema|entrar|login/i })
        .first()
        .getAttribute("href");
      expect(loginHref).toBe("/dashboard");
    });
  }
});
