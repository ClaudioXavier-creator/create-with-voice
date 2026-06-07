import { test, expect } from '@playwright/test';

test.describe('App Mount Validation', () => {
  test('should mount correctly and survive multiple reloads without error fallback', async ({ page }) => {
    // Escuta logs de erro durante toda a execução
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });

    // 1. Initial Load
    await page.goto('/');
    
    // Espera o app estabilizar
    await page.waitForLoadState('networkidle');

    for (let i = 1; i <= 5; i++) {
      console.log(`Validation cycle ${i}/5...`);
      
      // 1. Garantir que o loader de boot sumiu
      const loader = page.locator('#boot-loader');
      await expect(loader).not.toBeVisible({ timeout: 10000 });

      // 2. Garantir que o Fallback de erro NÃO está visível
      const errorHeading = page.locator('h1:has-text("Algo deu errado"), h1:has-text("Atualização disponível")');
      const isErrorVisible = await errorHeading.isVisible();
      if (isErrorVisible) {
        const errorMsg = await page.locator('pre').textContent();
        throw new Error(`App crashed on reload ${i}: ${errorMsg}`);
      }

      // 3. Verificar se o conteúdo principal montou
      // Procuramos por elementos comuns como o widget de chat ou navegação
      const rootChildren = page.locator('#root > *');
      await expect(rootChildren.first()).toBeVisible();

      // 4. Verificar logs fatais específicos
      const sentryDupeError = errorLogs.find(l => l.includes('Multiple Sentry Session Replay instances'));
      if (sentryDupeError) {
        throw new Error(`Sentry duplication detected on reload ${i}`);
      }

      if (i < 5) {
        // Reload "hard" para simular refresh do usuário
        await page.reload({ waitUntil: 'networkidle' });
      }
    }
    
    console.log('Mount validation successful across 5 reloads.');
  });
});
