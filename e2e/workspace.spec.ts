import { test, expect } from "@playwright/test";

test("workspace route renders with panels and map", async ({ page }) => {
  // Navigate to a known project workspace
  await page.goto("/workspace/p1-sample-aerial");

  // Verify top bar shows project title
  await expect(page.locator("header")).toContainText("Sample Aerial");

  // Verify left panel tabs exist
  await expect(page.locator("text=Layers")).toBeVisible();
  await expect(page.locator("text=Data Catalog")).toBeVisible();

  // Verify map canvas renders
  await expect(page.locator("canvas")).toBeVisible();

  // Verify right panel inspector placeholder
  await expect(page.locator("text=Select a feature on the map")).toBeVisible();
});
