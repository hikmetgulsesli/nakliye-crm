import { test, expect } from '@playwright/test';
import { login, ADMIN_CREDS } from './helpers';

test.describe('Auth', () => {
  test('login + dashboard görünür', async ({ page }) => {
    await login(page, ADMIN_CREDS);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Sidebar logo (sadece heading)
    await expect(page.getByRole('heading', { name: /NakliyeCRM/i })).toBeVisible();
  });

  test('yanlış şifre hata verir', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_CREDS.email);
    await page.locator('input[type="password"]').fill('WrongPass1!');
    await page.getByRole('button', { name: /giriş|giris/i }).click();
    // Hata mesajı görünmeli (veya login sayfasında kalmali)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('dark mode toggle çalışır', async ({ page }) => {
    await login(page);
    const toggleBtn = page.getByRole('button', { name: /tema/i });
    const initialClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    await toggleBtn.click();
    await page.waitForTimeout(200);
    const afterClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    expect(afterClass).not.toBe(initialClass);
  });
});
