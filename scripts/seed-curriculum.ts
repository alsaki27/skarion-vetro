// Seed script: imports all 9 project fixtures into curriculum_projects.
// Run: npx tsx scripts/seed-curriculum.ts
// Requires DATABASE_URL in .env

import { getDb } from "../src/db";
import { curriculum } from "../src/lib/curriculum";

async function seed() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL not configured.");
    process.exit(1);
  }

  const orgId = process.argv[2];
  if (!orgId) {
    console.error("Usage: npx tsx scripts/seed-curriculum.ts <org-id>");
    console.log("Provide the organization UUID to import projects under.");
    process.exit(1);
  }

  console.log(`Importing project fixtures into organization ${orgId}...\n`);
  const results = await curriculum.seedAllFixtures(orgId);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`Done: ${succeeded} imported, ${failed} failed.`);

  for (const r of results) {
    console.log(`  ${r.success ? "✅" : "❌"} ${r.slug}`);
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
