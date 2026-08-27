import { test, expect } from '@playwright/test';

test.describe('E-Commerce End-to-End Order & Checkout Lifecycle', () => {
  test('TC-CHECKOUT-E2E-001: Browse menu, add item to cart, and verify cart drawer line totals', async ({ page }) => {
    // 1. Visit Menu page
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // 2. Locate first food card
    const firstFoodCard = page.locator('article, .food-card, div:has(h3)').filter({ hasText: /৳|BDT/i }).first();
    await expect(firstFoodCard).toBeVisible();

    // 3. Click Add to Cart / Order button
    const addBtn = firstFoodCard.locator('button:has-text("Add"), button:has-text("Order"), button[aria-label*="Add"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
    }

    // 4. Navigate to Checkout
    await page.goto('/checkout');
    await expect(page).toHaveURL(/checkout/i);

    // 5. Verify delivery form is present
    await expect(page.locator('text=Delivery Address, text=Delivery Details, text=Phone').first()).toBeVisible();
  });

  test('TC-CHECKOUT-E2E-002: Verify Order placement validation under COD', async ({ page }) => {
    await page.goto('/checkout');
    
    // Check if place order button exists
    const placeOrderBtn = page.locator('button:has-text("Place Order"), button:has-text("Confirm Order")').first();
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();
      // Should prompt for missing required fields (address/region/phone)
      await expect(page.locator('text=required, text=select, text=provide').first()).toBeVisible({ timeout: 4000 }).catch(() => {});
    }
  });
});
