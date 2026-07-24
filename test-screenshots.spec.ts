import { test } from '@playwright/test';

test('take screenshots of all pages', async ({ page }) => {
  // Set window size for standard desktop layout
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Home page
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/screenshots/home.png' });

  // 2. Waiting Room
  await page.goto('http://localhost:3000/waiting-room');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/screenshots/waiting-room.png' });

  // 3. History
  await page.goto('http://localhost:3000/history');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/screenshots/history.png' });

  // 4. Untangle Log
  await page.goto('http://localhost:3000/untangle-log');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/screenshots/untangle-log.png' });

  // 5. Auth Modal (open from homepage)
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  // Click on "Sign In" or "Log In" button in Header
  const loginBtn = page.locator('button:has-text("Log In"), button:has-text("Sign In"), button:has-text("Get Started")').first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'public/screenshots/auth-modal.png' });
  }
});
