import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Admin panels', () => {
  test('/ayarlar sayfası (yeni Sistem Ayarları)', async ({ page }) => {
    await login(page);
    await page.goto('/ayarlar');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/ayarlar/);
    // 5 tab buton — Tabs component role="tab"
    await expect(page.getByRole('tab', { name: /genel/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /ai sağlayıcılar/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /entegrasyonlar/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /bildirim/i })).toBeVisible();
  });

  test('AI tab + sağlayıcı durum kartları', async ({ page }) => {
    await login(page);
    await page.goto('/ayarlar');
    await page.waitForLoadState('domcontentloaded');
    // API'den settings dönene kadar bekle
    await page.waitForResponse(
      (r) => r.url().includes('/api/settings') && r.status() === 200,
      { timeout: 10000 },
    );
    await page.getByRole('tab', { name: /ai sağlayıcılar/i }).click();
    // Saglayici kartlari ismen gorunmeli
    await expect(page.locator('text=/Claude/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/OpenAI/i').first()).toBeVisible();
    await expect(page.locator('text=/MiniMax/i').first()).toBeVisible();
    await expect(page.locator('text=/Kimi/i').first()).toBeVisible();
  });

  test('Audit log admin tarafından açılır', async ({ page }) => {
    await login(page);
    await page.goto('/loglar');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/loglar/);
  });

  test('Raporlar sayfası yüklenir', async ({ page }) => {
    await login(page);
    await page.goto('/raporlar');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/raporlar/);
  });
});
