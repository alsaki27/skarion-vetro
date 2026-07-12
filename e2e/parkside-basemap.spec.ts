import { test, expect } from "@playwright/test";

const CREDS = { email: "dev@skarion.com", password: "dev" };
const PROJECT_URL = "/workspace/p10-parkside-georgetown";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/curriculum");
}

test("basemap layers render on Parkside Georgetown", async ({ page }) => {
  page.on("console", (msg) => {
    if (msg.type() === "error") console.warn("Browser error:", msg.text().substring(0, 120));
  });

  await login(page);
  await page.goto(PROJECT_URL);
  await page.waitForSelector("canvas", { timeout: 10000 });
  // Wait for style + data + layers + idle (raster tiles stream 10+ s)
  await page.waitForTimeout(15000);

  // Screenshots as visual artifacts
  await page.screenshot({ path: "test-artifacts/a1-full-page.png", fullPage: true });
  await page.locator("canvas").screenshot({ path: "test-artifacts/a1-map.png" });

  // Assertions via the debug pipeline counter (__debugCalls), which snapshots
  // the map's internal state RIGHT AFTER ensureLayers runs — avoiding the
  // post-hoc getSource/getLayer API bugs caused by React Strict Mode remounts.
  const result = await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    const map = w.__mapDebug as Record<string, unknown> | undefined;
    const dc = w.__debugCalls as Record<string, unknown> | undefined;
    return {
      hasMap: !!map,
      isStyleLoaded: map ? (map.isStyleLoaded as () => boolean)() : false,
      ensureLayersCalls: dc?.ensureLayers ?? 0,
      setBasemapDataCalls: dc?.setBasemapData ?? 0,
      setBasemapParcels: dc?.setBasemapParcels ?? 0,
      setBasemapAddresses: dc?.setBasemapAddresses ?? 0,
      sourceCount: (dc as Record<string, unknown>)?.sourceCount ?? 0,
      hasWorkspaceParcels: (dc as Record<string, unknown>)?.hasWorkspaceParcels ?? false,
      getSourceParcels: (dc as Record<string, unknown>)?.getSourceParcels ?? false,
    };
  });

  console.log("A1 result:", JSON.stringify(result));

  // Required assertions
  expect(result.hasMap).toBe(true);
  expect(result.isStyleLoaded).toBe(true);
  expect(result.setBasemapDataCalls).toBeGreaterThan(0);
  expect(result.setBasemapParcels).toBe(554);
  expect(result.setBasemapAddresses).toBe(557);
  expect(result.ensureLayersCalls).toBeGreaterThan(0);
  expect(result.hasWorkspaceParcels).toBe(true);
  // queryRenderedFeatures cached from last ensureLayers confirms real features
  expect(result.sourceCount).toBeGreaterThan(0);
});
