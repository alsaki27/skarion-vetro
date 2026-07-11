import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { PROJECTS } from "@/lib/projects";
import { GET as getParcels } from "@/app/api/projects/[id]/layers/parcels/route";
import { GET as getAddresses } from "@/app/api/projects/[id]/layers/addresses/route";
import type { ProjectFixture } from "@/lib/types";
import type { AccessTokenPayload } from "@/lib/auth/tokens";

const TEST_PROJECT_ID = "test-basemap-routes";

vi.mock("@/lib/auth", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/auth")>();
  return { ...mod, getAuthFromRequest: vi.fn() };
});

import { getAuthFromRequest } from "@/lib/auth";

function mockRequest(projectId: string): NextRequest {
  return new NextRequest(`http://localhost/api/projects/${projectId}/layers/parcels`);
}

function mockParams(projectId: string) {
  return { params: Promise.resolve({ id: projectId }) };
}

function mockAuth(overrides: Partial<AccessTokenPayload> = {}): AccessTokenPayload {
  return { sub: "u1", email: "t@test.com", org_id: "org-test", role: "student", ...overrides } as AccessTokenPayload;
}

describe("basemap layer routes", () => {
  beforeAll(() => {
    (PROJECTS as Record<string, unknown>)[TEST_PROJECT_ID] = {
      id: TEST_PROJECT_ID,
      title: "Test Basemap Project",
      difficulty: "beginner",
      environment: "underground",
      splitArchitecture: "student_choice",
      scenario: "test",
      tasks: [],
      constraints: {},
      constraintNotes: [],
      deliverables: [],
      mapCenter: [-97.7653, 30.6048],
      mapZoom: 16,
      preloadedElements: [],
      requirements: [],
      optimalStats: { totalCableFt: 0 },
      passThreshold: 70,
      gradingWeights: {},
      orgId: "org-test",
      basemapId: "wilco-l131725c",
    } as ProjectFixture;
    (PROJECTS as Record<string, unknown>)["test-no-basemap"] = {
      ...PROJECTS[TEST_PROJECT_ID],
      id: "test-no-basemap",
      basemapId: undefined,
    } as ProjectFixture;
  });

  afterAll(() => {
    delete (PROJECTS as Record<string, unknown>)[TEST_PROJECT_ID];
    delete (PROJECTS as Record<string, unknown>)["test-no-basemap"];
  });

  describe("parcels", () => {
    it("requires authentication", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(null);
      const res = await getParcels(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID));
      expect(res.status).toBe(401);
      expect((await res.json()).error_code).toBe("UNAUTHORIZED");
    });

    it("returns 404 for cross-tenant", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-wrong" }));
      const res = await getParcels(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID));
      expect(res.status).toBe(404);
    });

    it("returns FeatureCollection for valid tenant", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-test" }));
      const res = await getParcels(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe("FeatureCollection");
      expect(body.features).toHaveLength(554);
      expect(body.metadata.source).toContain("WCAD");
    });

    it("returns 404 for unknown project", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-default" }));
      const res = await getParcels(mockRequest("nonexistent"), mockParams("nonexistent"));
      expect(res.status).toBe(404);
    });

    it("returns 404 when project is not linked to the county fixture", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-test" }));
      const res = await getParcels(mockRequest("test-no-basemap"), mockParams("test-no-basemap"));
      expect(res.status).toBe(404);
    });
  });

  describe("addresses", () => {
    it("requires authentication", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(null);
      const res = await getAddresses(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID));
      expect(res.status).toBe(401);
    });

    it("returns 404 for cross-tenant", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-wrong" }));
      const res = await getAddresses(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID));
      expect(res.status).toBe(404);
    });

    it("returns FeatureCollection with serviceable flag", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-test" }));
      const res = await getAddresses(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe("FeatureCollection");
      expect(body.features).toHaveLength(557);
      expect(typeof body.features[0].properties.serviceable).toBe("boolean");
    });

    it("517 serviceable addresses = OPEN + SINGLE FAMILY", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-test" }));
      const body = await (await getAddresses(mockRequest(TEST_PROJECT_ID), mockParams(TEST_PROJECT_ID))).json();
      type AddressFeature = { properties: { serviceable: boolean } };
      const serviceable = (body.features as AddressFeature[]).filter((f) => f.properties.serviceable);
      expect(serviceable).toHaveLength(517);
    });

    it("returns 404 when project is not linked to the county fixture", async () => {
      vi.mocked(getAuthFromRequest).mockResolvedValue(mockAuth({ org_id: "org-test" }));
      const res = await getAddresses(mockRequest("test-no-basemap"), mockParams("test-no-basemap"));
      expect(res.status).toBe(404);
    });
  });
});
