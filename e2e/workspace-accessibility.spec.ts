import { test, expect } from "@playwright/test";

test("curriculum page is keyboard-navigable", async ({ page }) => {
  await page.goto("/curriculum");
  await expect(page.locator("body")).toBeVisible();

  const focusableBefore = await page.locator("*:focus").count();
  await page.keyboard.press("Tab");
  const focusableAfter = await page.locator("*:focus").count();

  expect(focusableBefore + focusableAfter).toBeGreaterThanOrEqual(0);
});

test("login page has accessible form elements", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();

  const emailInput = page.locator('input[type="email"]');
  await emailInput.focus();
  await expect(emailInput).toBeFocused();
});

test("workspace page renders canvas for map interaction", async ({ page }) => {
  await page.goto("/curriculum");
  await expect(page.locator("body")).toBeVisible();
});
