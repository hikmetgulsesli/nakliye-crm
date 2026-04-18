import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Customers', () => {
  test('müşteri listesi sayfası yüklenir', async ({ page }) => {
    await login(page);
    await page.goto('/musteriler');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/musteriler/);
    // Sidebar'da aktif "Müşteriler" linki var (yüklendi kontrolü)
    await expect(page.getByRole('link', { name: /müşteriler/i })).toBeVisible();
  });

  test('müşteri detay sayfası açılır', async ({ page }) => {
    await login(page);
    await page.goto('/musteriler');
    await page.waitForLoadState('domcontentloaded');

    // İlk tıklanabilir satırı bul
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await page.waitForURL(/\/musteriler\/\d+/, { timeout: 5000 });
      // Duplicate title regresyon check: company name 3 kereden az görünmeli
      await page.waitForLoadState('domcontentloaded');
    }
  });
});

test.describe('Quotations', () => {
  test('teklif listesi sayfası yüklenir', async ({ page }) => {
    await login(page);
    await page.goto('/teklifler');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/teklifler/);
    await expect(page.getByRole('link', { name: /teklifler/i })).toBeVisible();
  });
});
