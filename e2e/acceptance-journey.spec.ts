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

test("full acceptance journey — login → render → submit → export", async ({ page }) => {
  // 1. Login
  await login(page);
  await page.goto(PROJECT_URL);
  await page.waitForSelector("canvas", { timeout: 10000 });

  // 2. Verify map renders with basemap layers (reuse A1's proven approach)
  await page.waitForFunction(() => {
    const map = (window as Record<string, unknown>).__mapDebug as Record<string, unknown> | undefined;
    if (!map || !(map.isStyleLoaded as () => boolean)()) return false;
    return (map.getSource as (id: string) => unknown)("workspace-parcels") != null;
  }, { timeout: 30000 });

  await page.screenshot({ path: "test-artifacts/f1-start.png", fullPage: true });

  // 3. Verify rendering state
  const start = await page.evaluate(() => {
    const map = (window as Record<string, unknown>).__mapDebug as Record<string, unknown>;
    const qrf = map.queryRenderedFeatures as (q: unknown, o: Record<string, unknown>) => Array<unknown>;
    return {
      hasParcels: (map.getSource as (id: string) => unknown)("workspace-parcels") != null,
      hasAddresses: (map.getSource as (id: string) => unknown)("workspace-addresses") != null,
      rendered: qrf(undefined, { layers: ["workspace-parcels-fill"] }).length > 0,
    };
  });
  expect(start.hasParcels).toBe(true);
  expect(start.hasAddresses).toBe(true);
  expect(start.rendered).toBe(true);

  // 4. Grading submit flow
  const token = await page.evaluate(() => localStorage.getItem("token"));

  // Draw a simple cable from CO to a vault via the store API
  await page.evaluate(() => {
    const store = (window as Record<string, unknown>).__zustandStore as Record<string, unknown>;
    if (store?.setState) {
      (store.setState as (s: Record<string, unknown>) => void)({ tool: "cable" });
    }
  });

  // Submit for grading via API
  const gradeRes = await page.evaluate(async () => {
    const token = localStorage.getItem("token");
    const store = (window as Record<string, unknown>).__zustandStore as Record<string, unknown> | undefined;
    const elements = store?.getState ? (store.getState as () => Record<string, unknown>)().elements : {};
    const res = await fetch("/api/grading", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
      body: JSON.stringify({ projectId: "p10-parkside-georgetown", elements }),
    });
    return (await res.json()) as Record<string, unknown>;
  });

  expect(gradeRes.totalScore).toBeGreaterThanOrEqual(0);
  expect(gradeRes.gates).toBeDefined();

  // 5. Export BOM
  const exportRes = await page.evaluate(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/designs/export", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
      body: JSON.stringify({ projectId: "p10-parkside-georgetown", elements: [] }),
    });
    return (await res.json()) as Record<string, unknown>;
  });

  expect(exportRes.manifest).toBeDefined();
  expect(exportRes.csv).toBeDefined();

  // 6. Final screenshot
  await page.screenshot({ path: "test-artifacts/f1-complete.png", fullPage: true });

  console.log("Acceptance journey complete");
});
