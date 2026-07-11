import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});

test("curriculum page loads", async ({ page }) => {
  await page.goto("/curriculum");
  await expect(page.locator("body")).toBeVisible();
});
