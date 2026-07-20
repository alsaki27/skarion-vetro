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

  // Poll for map + style loaded, then check sources via the same call pattern
  // the live auditor used: getSource direct (with try/catch) and queryRenderedFeatures.
  await page.waitForFunction(() => {
    const map = (window as unknown as Record<string, unknown>).__mapDebug as Record<string, unknown> | undefined;
    if (!map || !(map.isStyleLoaded as () => boolean)()) return false;
    // Style is loaded — just need the canvas to exist (sources may arrive async)
    return true;
  }, { timeout: 30000 });

  // Give the layer rendering pipeline a generous window to complete.
  // The idle-based retry from fab2aea can take seconds after style load.
  await page.waitForTimeout(8000);

  // Full-page screenshot as artifact
  await page.screenshot({ path: "test-artifacts/a1-full-page.png", fullPage: true });
  await page.locator("canvas").screenshot({ path: "test-artifacts/a1-map.png" });

  // Assert real map state
  const result = await page.evaluate(() => {
    const map = (window as unknown as Record<string, unknown>).__mapDebug as Record<string, unknown> | undefined;
    if (!map) return { error: "__mapDebug not set" };
    try {
      const m = map as Record<string, unknown> & { getSource: (id: string) => unknown; queryRenderedFeatures: (...args: unknown[]) => unknown[] };
      const parcelSrc = m.getSource("workspace-parcels");
      const addrSrc = m.getSource("workspace-addresses");
      const qrf = m.queryRenderedFeatures.bind(m);
      return {
        parcelSourceExists: !!parcelSrc,
        addressSourceExists: !!addrSrc,
        renderedParcels: qrf(undefined, { layers: ["workspace-parcels-fill"] }).length as number,
        renderedAddresses: qrf(undefined, { layers: ["workspace-addresses-circle"] }).length as number,
      };
    } catch (e) { return { error: (e as Error).message }; }
  });

  console.log("A1 result:", JSON.stringify(result));

  expect(result.parcelSourceExists).toBe(true);
  expect(result.addressSourceExists).toBe(true);
  // Positive proof of rendering: features actually painted on the canvas
  expect(result.renderedParcels).toBeGreaterThan(0);
  expect(result.renderedAddresses).toBeGreaterThan(0);
});
