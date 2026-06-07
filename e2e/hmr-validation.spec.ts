import { test, expect } from "../playwright-fixture";
import * as fs from "fs";
import * as path from "path";

test.describe("HMR and Reload Validation", () => {
  test("should not have console errors on initial load and hard refresh", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#root")).not.toBeEmpty();
    
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator("#root")).not.toBeEmpty();
  });

  test("should survive HMR updates without console errors", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#root")).not.toBeEmpty();

    const appPath = path.join(process.cwd(), "src/App.tsx");
    const originalContent = fs.readFileSync(appPath, "utf-8");
    
    try {
      // Simulate HMR by touching the file with a comment
      const newContent = `// HMR Test ${Date.now()}\n${originalContent}`;
      fs.writeFileSync(appPath, newContent);
      
      // Wait for HMR - looking for a sign of life or just waiting a bit
      await page.waitForTimeout(2000); 
      
      await expect(page.locator("#root")).not.toBeEmpty();
    } finally {
      // Restore original file
      fs.writeFileSync(appPath, originalContent);
    }
  });
});
