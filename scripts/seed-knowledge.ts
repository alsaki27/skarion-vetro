// Seed script: imports HLD 2–4 knowledge map into learning_concepts and learning_objectives.
// Run: npx tsx scripts/seed-knowledge.ts <org-id>
// Requires DATABASE_URL in .env

import { getDb, schema } from "../src/db";
import { eq } from "drizzle-orm";

const CONCEPTS = [
  { slug: "service_grouping", title: "Service Grouping", description: "Grouping premises into MST service areas based on geography and port capacity." },
  { slug: "mst_sizing", title: "MST Sizing", description: "Selecting the correct MST port count (4, 6, or 8 ports) based on premise count." },
  { slug: "drop_limits", title: "Drop Limits", description: "Maximum routed drop distance from MST to premise (configurable per project)." },
  { slug: "parcel_trespass", title: "Parcel & Trespass Awareness", description: "Avoiding unauthorized crossing of private property and unopened right-of-way." },
  { slug: "conduit_roles", title: "Conduit & Structure Roles", description: "When conduit is required and what structure types are valid endpoints." },
  { slug: "closure_sets", title: "Closure Service Sets", description: "How splice closures group distribution fibers and connect to FDH ports." },
  { slug: "pigtail_vs_foc", title: "Pigtail vs. FOC", description: "Difference between pigtail (closure to MST) and feeder/distribution FOC." },
  { slug: "fdh_topology", title: "FDH Topology", description: "Upstream fiber path from closure to FDH, port assignments, and capacity planning." },
  { slug: "bend_handholes", title: "Bend Handholes", description: "Where handholes are required at conduit bends and road crossings." },
  { slug: "constructability", title: "Constructability", description: "Field-verification requirements, utility conflicts, and practical buildability." },
];

const OBJECTIVES: Array<{
  conceptSlug: string;
  action: string;
  evidence: string;
  method: string;
  projectSlug: string;
}> = [
  { conceptSlug: "service_grouping", action: "Group all premises within a project area into MST service groups", evidence: "Every premise assigned to exactly one MST with port count not exceeded", method: "design_check", projectSlug: "p2-oakwood" },
  { conceptSlug: "mst_sizing", action: "Select correct MST port count for each service group", evidence: "MST port count ≥ assigned premises and ≤ available ports", method: "design_check", projectSlug: "p2-oakwood" },
  { conceptSlug: "drop_limits", action: "Route drop cables within maximum allowed distance", evidence: "All drop cable lengths ≤ project maxDropCableFt", method: "design_check", projectSlug: "p2-oakwood" },
  { conceptSlug: "parcel_trespass", action: "Identify and avoid parcels without easement access", evidence: "Routes do not cross parcels marked as no-access without annotation", method: "design_check", projectSlug: "p3-sunset" },
  { conceptSlug: "conduit_roles", action: "Place conduit segments between valid structure endpoints", evidence: "All conduit segments start/end at handhole, vault, FDH, or riser", method: "design_check", projectSlug: "p2-oakwood" },
  { conceptSlug: "closure_sets", action: "Assign distribution fibers to closure service sets", evidence: "Each closure has documented service set with fiber counts", method: "instructor_review", projectSlug: "p4-split-lab" },
  { conceptSlug: "pigtail_vs_foc", action: "Distinguish pigtail routes from feeder/distribution FOC", evidence: "Pigtails connect closure to MST; FOC connects closure to FDH", method: "knowledge_check", projectSlug: "p4-split-lab" },
  { conceptSlug: "fdh_topology", action: "Trace upstream path from every closure to an FDH port", evidence: "Every closure reaches an FDH with available port capacity", method: "design_check", projectSlug: "p4-split-lab" },
  { conceptSlug: "bend_handholes", action: "Place handholes at conduit bends exceeding 45 degrees", evidence: "No conduit bend >45° without an intervening handhole", method: "design_check", projectSlug: "p3-sunset" },
  { conceptSlug: "constructability", action: "Flag field-verification requirements for ambiguous placements", evidence: "Annotated placements with field-verification state where source data is insufficient", method: "instructor_review", projectSlug: "p3-sunset" },
];

async function seed() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL not configured.");
    process.exit(1);
  }

  const orgId = process.argv[2];
  if (!orgId) {
    console.error("Usage: npx tsx scripts/seed-knowledge.ts <org-id>");
    process.exit(1);
  }

  console.log(`Seeding knowledge map for organization ${orgId}...\n`);

  for (const c of CONCEPTS) {
    await db.insert(schema.learningConcepts).values({
      orgId,
      slug: c.slug,
      title: c.title,
      description: c.description,
      prerequisiteIds: [],
    }).onConflictDoNothing({ target: [schema.learningConcepts.slug] });

    const [concept] = await db
      .select()
      .from(schema.learningConcepts)
      .where(eq(schema.learningConcepts.slug, c.slug))
      .limit(1);

    // Get the curriculum project
    const [project] = await db
      .select()
      .from(schema.curriculumProjects)
      .where(eq(schema.curriculumProjects.slug, c.slug.replace(/_.*/, "p2")))
      .limit(1);

    const projectId = project?.id ?? undefined;

    for (const obj of OBJECTIVES.filter((o) => o.conceptSlug === c.slug)) {
      await db.insert(schema.learningObjectives).values({
        orgId,
        conceptId: concept.id,
        projectId: projectId ?? null,
        action: obj.action,
        masteryEvidence: obj.evidence,
        assessmentMethod: obj.method,
      }).onConflictDoNothing({
        target: [
          schema.learningObjectives.conceptId as unknown as ReturnType<typeof eq>,
        ] as never,
      });
    }

    console.log(`  ✅ ${c.slug}`);
  }

  console.log("\nDone — knowledge map seeded.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
