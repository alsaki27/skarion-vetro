import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { PROJECTS } from "./projects";
import type { ProjectFixture } from "./types";

const PUBLIC_FIELDS = [
  "id", "title", "difficulty", "environment", "splitArchitecture",
  "mapCenter", "mapZoom", "preloadedElements", "requirements",
  "constraints", "constraintNotes", "deliverables", "scenario",
  "tasks", "tip", "passThreshold",
] as const;

function sanitizeFixture(p: ProjectFixture): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of PUBLIC_FIELDS) {
    result[key] = (p as unknown as Record<string, unknown>)[key];
  }
  return result;
}

export const curriculum = {
  async listPublished(orgId: string) {
    const db = getDb();
    if (!db) {
      return Object.values(PROJECTS).map(sanitizeFixture);
    }

    // Get published projects with their current version
    const projects = await db
      .select()
      .from(schema.curriculumProjects)
      .where(
        and(
          eq(schema.curriculumProjects.orgId, orgId),
          eq(schema.curriculumProjects.state, "published"),
        ),
      );

    return projects;
  },

  async getPublishedBySlug(orgId: string, slug: string) {
    const db = getDb();
    if (!db) {
      const fixture = Object.values(PROJECTS).find((p) => p.id === slug);
      return fixture ? sanitizeFixture(fixture) : null;
    }

    const [project] = await db
      .select()
      .from(schema.curriculumProjects)
      .where(
        and(
          eq(schema.curriculumProjects.orgId, orgId),
          eq(schema.curriculumProjects.slug, slug),
          eq(schema.curriculumProjects.state, "published"),
        ),
      )
      .limit(1);

    if (!project || !project.currentVersionId) return null;

    const [version] = await db
      .select()
      .from(schema.curriculumProjectVersions)
      .where(eq(schema.curriculumProjectVersions.id, project.currentVersionId))
      .limit(1);

    if (!version) return null;

    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      difficulty: project.difficulty,
      environment: project.environment,
      splitArchitecture: project.splitArchitecture,
      versionNumber: version.versionNumber,
      ...(version.scenario as Record<string, unknown>),
      constraints: version.constraints,
      preloadedElements: version.preloadedElements,
      requirements: version.requirements,
      mapCenter: version.mapCenter,
      mapZoom: version.mapZoom,
      passThreshold: version.passThreshold,
      gradingWeights: version.gradingWeights,
    };
  },

  async importFixture(orgId: string, fixture: ProjectFixture) {
    const db = getDb();
    if (!db) return null;

    // Upsert curriculum project
    const [project] = await db
      .insert(schema.curriculumProjects)
      .values({
        orgId,
        slug: fixture.id,
        title: fixture.title,
        description: fixture.scenario.slice(0, 500),
        difficulty: fixture.difficulty,
        environment: fixture.environment,
        splitArchitecture: fixture.splitArchitecture,
        state: "published",
      })
      .onConflictDoUpdate({
        target: [schema.curriculumProjects.orgId, schema.curriculumProjects.slug],
        set: {
          title: fixture.title,
          difficulty: fixture.difficulty,
          environment: fixture.environment,
          splitArchitecture: fixture.splitArchitecture,
        },
      })
      .returning();

    // Create version 1
    const version = await db
      .insert(schema.curriculumProjectVersions)
      .values({
        projectId: project.id,
        versionNumber: 1,
        scenario: {
          scenario: fixture.scenario,
          tasks: fixture.tasks,
          constraintNotes: fixture.constraintNotes,
          deliverables: fixture.deliverables,
          tip: fixture.tip ?? null,
        },
        constraints: fixture.constraints as Record<string, unknown>,
        gradingWeights: fixture.gradingWeights as Record<string, unknown>,
        preloadedElements: fixture.preloadedElements as unknown[],
        optimalStats: fixture.optimalStats as Record<string, unknown> | null,
        requirements: fixture.requirements as unknown[],
        mapCenter: `${fixture.mapCenter[0]},${fixture.mapCenter[1]}`,
        mapZoom: fixture.mapZoom,
        passThreshold: fixture.passThreshold,
        publishedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [
          schema.curriculumProjectVersions.projectId,
          schema.curriculumProjectVersions.versionNumber,
        ],
      })
      .returning();

    // Point current version
    await db
      .update(schema.curriculumProjects)
      .set({ currentVersionId: version[0].id })
      .where(eq(schema.curriculumProjects.id, project.id));

    return project;
  },

  async seedAllFixtures(orgId: string) {
    const results: Array<{ slug: string; success: boolean }> = [];
    for (const fixture of Object.values(PROJECTS)) {
      try {
        await this.importFixture(orgId, fixture);
        results.push({ slug: fixture.id, success: true });
      } catch {
        results.push({ slug: fixture.id, success: false });
      }
    }
    return results;
  },
};
