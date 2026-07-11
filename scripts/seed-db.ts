// Database seed script (Rev 3 — multi-tenant schema)
// Run: npx tsx scripts/seed-db.ts
// Requires DATABASE_URL in .env

import { getDb, schema } from "../src/db";

async function seed() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL not configured — seed requires a live database connection.");
    console.log("Set DATABASE_URL in .env and try again.");
    process.exit(1);
  }

  console.log("Seeding Skarion-VETRO Rev 3 database...\n");

  // Create Skarion org
  const [org] = await db.insert(schema.organizations).values({
    name: "Skarion",
    slug: "skarion",
    plan: "pro",
    status: "active",
    settings: { pilot: true, branding: { name: "Skarion" } },
  }).returning();
  console.log(`  ✅ Organization: ${org.name} (${org.id})`);

  // Create dev instructor
  const [instructor] = await db.insert(schema.users).values({
    email: "instructor@skarion.com",
    name: "Dev Instructor",
  }).returning();
  await db.insert(schema.orgMembers).values({
    orgId: org.id, userId: instructor.id, role: "instructor",
  });
  console.log(`  ✅ Instructor: ${instructor.email}`);

  // Create dev students
  const students = await Promise.all(
    ["alice@skarion.com", "bob@skarion.com"].map(async (email) => {
      const [student] = await db.insert(schema.users).values({
        email,
        name: email.split("@")[0],
      }).returning();
      await db.insert(schema.orgMembers).values({
        orgId: org.id, userId: student.id, role: "student",
      });
      return student;
    }),
  );
  console.log(`  ✅ Students: ${students.map((s) => s.email).join(", ")}`);

  // Create cohort
  const [cohort] = await db.insert(schema.cohorts).values({
    orgId: org.id,
    name: "Pilot Cohort 1",
    slug: "pilot-1",
    instructorId: instructor.id,
  }).returning();
  for (const s of students) {
    await db.insert(schema.cohortMembers).values({ cohortId: cohort.id, userId: s.id });
  }
  console.log(`  ✅ Cohort: ${cohort.name} (2 members)`);

  // Seed P1 project
  const [p1] = await db.insert(schema.projects).values({
    orgId: org.id,
    slug: "p1-greenfield",
    title: "Project 1: Greenfield First Light",
    description: "Rural single street: CO at the north end, 5 existing poles heading south, 5 homes offset east.",
    projectType: "hld",
    difficulty: "beginner",
    environment: "aerial",
    splitArchitecture: "n/a",
    locationName: "Greenfield, TX",
    mapCenter: "POINT(-97.8501 30.4525)",
    mapZoom: 17,
    passThreshold: 80,
    sortOrder: 1,
  }).returning();
  console.log(`  ✅ Project: ${p1.title}`);

  console.log("\nSeed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
