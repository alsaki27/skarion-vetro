import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("homepage loads and shows the landing title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Design Fiber Networks");
  });

  test("curriculum page renders project list", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.locator("h1")).toContainText("Curriculum");
  });
});
