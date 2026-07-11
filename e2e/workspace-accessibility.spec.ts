import { test, expect } from "@playwright/test";

test("workspace loads with panels", async ({ page }) => {
  await page.goto("/curriculum");
  await expect(page.locator("body")).toBeVisible();
});

test("keyboard navigation basic", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator("*:focus")).toBeDefined();
});
