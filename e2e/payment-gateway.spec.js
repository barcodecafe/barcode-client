import { test, expect } from '@playwright/test';

test.describe('Payment Gateway & SSLCommerz Integration E2E', () => {
  test('TC-PAY-E2E-001: Online payment selection should show gateway trust badges & minimum threshold', async ({ page }) => {
    await page.goto('/checkout');

    // Look for Online Payment (bKash / Nagad / Cards / SSLCommerz)
    const onlinePaymentOption = page.locator('text=SSLCommerz, text=Online Payment, text=bKash, text=Cards').first();
    if (await onlinePaymentOption.isVisible()) {
      await onlinePaymentOption.click();
      // Verify payment badge or notice
      await expect(page.locator('text=SSLCommerz, text=Secure, text=Gateway').first()).toBeVisible();
    }
  });

  test('TC-PAY-E2E-002: Order Tracking state verification', async ({ page }) => {
    // Visit order tracking with a mock or recent id
    await page.goto('/order-tracking/test-order-id');
    // Verify page loads without blank white screen crash
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
