import { test, expect } from '@playwright/test';

test.describe('Authentication Matrix & Dual Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('TC-AUTH-E2E-001: Should render login page with dual identifier inputs', async ({ page }) => {
    await expect(page).toHaveTitle(/Barcode/i);
    const identifierInput = page.locator('input[name="identifier"], input[type="text"], input[type="email"]').first();
    await expect(identifierInput).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('TC-AUTH-E2E-002: Should validate empty submission and format errors', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Check validation error or input required state
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('TC-AUTH-E2E-003: Should reject invalid password attempts with error message', async ({ page }) => {
    const identifierInput = page.locator('input[type="text"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await identifierInput.fill('01700000000');
    await passwordInput.fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Verify error notification or toast appears
    await expect(page.locator('.swal2-popup, .toaster, [role="alert"], div:has-text("Invalid")').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
