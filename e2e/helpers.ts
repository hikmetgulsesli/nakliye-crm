import { Page, expect } from '@playwright/test';

export const ADMIN_CREDS = {
  email: 'admin@nakliyecrm.com',
  password: 'Admin123!',
};

export const USER_CREDS = {
  email: 'ahmet@nakliyecrm.com',
  password: 'User123!',
};

export async function login(page: Page, creds = ADMIN_CREDS) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.getByRole('button', { name: /giriş|giris/i }).click();
  // Login sonrası /login dışına çıkmış olmalı (/, /dashboard, veya /ayarlar gibi)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10000 });
}

export async function logout(page: Page) {
  // Sidebar'daki logout butonu (title="Çıkış Yap")
  const btn = page.getByTitle(/çıkış|cikis/i);
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await expect(page).toHaveURL(/\/login/);
  }
}
