# Skarion-VETRO: Applied OSP Engineering Chunks 101–200

> This is the direct continuation of `PRODUCTION-100-CHUNK-EXECUTION-PROMPT.md`. Give both files to the implementation agent. Chunks 101–200 must not weaken, duplicate, or bypass the production gates established in chunks 001–100.

## Reconciled mission

Students arrive already knowing OSP theory, vocabulary, common network components, and basic PON concepts. Do **not** turn Skarion-VETRO into an introductory textbook. Build a production-grade applied engineering environment that converts theory into defensible junior-designer performance under normal instructor/QA supervision.

The platform must train students to interpret incomplete source data, make and document assumptions, compare viable alternatives, design HLD and LLD solutions, react to field changes and redlines, reconcile quantities and connectivity, and produce reviewable construction-oriented deliverables. Objective rules remain deterministic. Judgment-based work must use transparent rubrics and qualified human review. Never pretend that one geometry or “optimal” score is the only valid OSP solution.

## Entry gate

Do not begin feature implementation in this file until the canonical branch and completion state of chunks 001–100 are inspected. For every dependency:

- If the prerequisite is complete, cite its files, tests, and live evidence.
- If it is partial, finish it before depending on it.
- If Kilo or another agent is concurrently editing the same area, avoid overlapping writes; select an independent chunk or wait for a clean handoff.
- Re-run `npm run verify` before the first chunk and preserve the passing floor.
- Treat the current database and published curriculum versions as valuable state. Migrate safely; never reset them to simplify implementation.

## Continuous execution loop

For every chunk, repeat:

1. Inspect `AGENTS.md`, both 100-chunk prompts, current status/report files, relevant source/tests, and applicable Next.js 16 documentation.
2. Prove the user-facing or engineering gap with code, API, database, or live-browser evidence.
3. Define the engineering rule, policy source, configurable inputs, tenant boundary, versioning behavior, failure modes, and acceptance tests.
4. Implement a vertical slice through persistence/domain/API/UI/export where relevant.
5. Add a behavioral test that would fail before the change. Avoid tests that merely restate constants or inspect source text.
6. Run targeted tests, lint, typecheck, full tests, production build, and relevant Playwright journeys.
7. Live-verify production behavior using authenticated roles, persisted state, and real Parkside data. Do not substitute mocked requests for acceptance evidence.
8. Update the truthful status matrix and create a chunk report containing exact commands/results, migrations, screenshots/artifacts, limitations, and follow-up risks.
9. Commit an atomic, accurately named change. Push only after the full gate passes.
10. Reconcile concurrent commits before taking the next chunk. Never overwrite another agent’s uncommitted changes.

## Applied-learning principles

- Test decisions and outputs, not memorization of vocabulary.
- Every major stage requires structured assumptions, alternatives, rationale, risks, and field-verification notes.
- Every automated failure must explain evidence and the governing project policy without revealing a complete solution.
- Every capstone must admit multiple valid designs and use invariant checks plus a human judgment rubric.
- Separate legal/regulatory engineering approval from educational completion. Never represent a student submission as sealed, permitted, construction-approved, or field-verified.
- Standards and utility rules must be versioned profiles with source, jurisdiction, effective date, and instructor approval—not hardcoded universal truths.
- Pole loading, make-ready, electrical safety, permitting, railroad/highway/water crossings, and sealed-engineering decisions require explicit scope limitations and qualified review.
- AI may summarize or assist instructors, but it must never become the authoritative grader or silently change deterministic scores.

---

## Phase 8 — Competency model and applied assessment foundation

### Chunk 101 — Applied OSP competency framework

- **Implement:** Define measurable competencies for data interpretation, assumptions, HLD topology, route selection, structures, capacity, constructability, LLD continuity, splice documentation, BOM reconciliation, QA response, and deliverable quality. Map each to observable evidence and proficiency levels.
- **Verify:** Review every existing project/check/rubric against the framework and identify coverage gaps without counting vocabulary exposure as competence.
- **Done when:** Each curriculum activity and capstone claim traces to an assessed behavior, evidence type, and minimum proficiency.

### Chunk 102 — Theory-readiness entry diagnostic

- **Implement:** Create a short, configurable readiness diagnostic covering prerequisite concepts without reteaching them; route gaps to external/preparatory material rather than blocking unrelated strengths.
- **Verify:** Scores are server-side, versioned, accessible, and never expose answer keys before completion; instructors can waive or assign remediation.
- **Done when:** The platform can confirm prerequisites while remaining focused on applied work.

### Chunk 103 — Evidence-based proficiency records

- **Implement:** Persist competency evidence from checks, submissions, rationales, reviews, revisions, and capstones with source revision and assessor identity.
- **Verify:** A proficiency decision can be reconstructed from immutable evidence and does not regress merely because a newer curriculum version exists.
- **Done when:** “Job-ready” claims are backed by specific work, not aggregate scores alone.

### Chunk 104 — Multi-method assessment policy

- **Implement:** Define which competencies use deterministic checks, rubric review, artifact inspection, oral/live defense, or combined assessment. Prevent one score type from substituting for another.
- **Verify:** Tests reject completion when mandatory evidence modes are missing despite a high numeric grade.
- **Done when:** Objective correctness and engineering judgment are evaluated by appropriate methods.

### Chunk 105 — Structured design rationale model

- **Implement:** Persist rationale entries linked to stage, decision, map feature/group/route, alternatives, selected option, evidence, assumptions, risks, and field-verification needs.
- **Verify:** Required rationale cannot be satisfied with empty/duplicate boilerplate; revisions preserve earlier reasoning and show changes.
- **Done when:** Major design choices are defensible and reviewable.

### Chunk 106 — Assumption and uncertainty register

- **Implement:** Add typed assumptions with confidence, source gap, impact, owner, verification method, due stage, and resolution state. Surface unresolved high-impact assumptions at gates and exports.
- **Verify:** Tests cover creation from missing data, map anchoring, resolution by later source/field evidence, and immutable submission snapshots.
- **Done when:** Students learn to expose uncertainty instead of silently inventing facts.

### Chunk 107 — Alternative-design comparison model

- **Implement:** Allow students to save two or more route/topology alternatives and compare length, structures, capacity, risk, source confidence, constructability, and estimated quantities.
- **Verify:** Comparison metrics derive from authoritative engines and preserve alternatives without contaminating the selected working design.
- **Done when:** Students can justify selection among multiple valid approaches.

### Chunk 108 — Judgment rubric engine

- **Implement:** Build versioned analytic rubrics with criteria, performance bands, required evidence, assessor notes, weighting limits, and calibration examples. Keep rubric scores separate from deterministic checks.
- **Verify:** Published rubrics are immutable; scoring requires evidence/comments where configured; totals and overrides are auditable.
- **Done when:** Human judgment is consistent, transparent, and version-pinned.

### Chunk 109 — Competency gate policy

- **Implement:** Define stage/capstone completion from required deterministic gates, rubric minima, evidence completeness, revision requirements, and instructor approval.
- **Verify:** High averages cannot mask failure of a safety-, topology-, continuity-, or rationale-critical competency.
- **Done when:** Completion represents balanced competence rather than point accumulation.

### Chunk 110 — Applied competency dashboard

- **Implement:** Give students and instructors evidence-linked competency profiles showing demonstrated, developing, missing, and stale evidence with next recommended practice.
- **Verify:** Drill-down reaches the exact revision/check/rationale/review item; tenant and role boundaries are enforced.
- **Done when:** Progress is actionable and cannot be confused with course attendance.

## Phase 9 — Standards, policy profiles, and engineering governance

### Chunk 111 — Versioned engineering standards profiles

- **Implement:** Model organization/jurisdiction/project profiles for spans, drops, clearances, bend rules, slack, reserve capacity, structure hosting, naming, materials, and documentation requirements.
- **Verify:** Profiles record source, effective date, approver, applicability, supersession, and immutable published versions.
- **Done when:** Rules are configurable policy, not universal hardcoded constants.

### Chunk 112 — Rule provenance and citations

- **Implement:** Link every configurable grading/constructability rule to profile section, source title, jurisdiction, effective date, and instructor explanation while respecting copyright limits.
- **Verify:** Result panels and exports display the exact governing policy version without exposing restricted source content.
- **Done when:** Students can trace why a rule applied.

### Chunk 113 — Utility-specific design profile workflow

- **Implement:** Let authorized instructors/admins clone, edit, validate, publish, and assign utility/client-specific profiles with field-level differences and approval history.
- **Verify:** Two assignments can use conflicting rules without cross-contamination; historical submissions retain their original profile.
- **Done when:** Training can reflect different client standards safely.

### Chunk 114 — Jurisdiction and permitting matrix

- **Implement:** Model permitting authorities and crossing/ROW/easement review requirements by geography and route condition, with “requires qualified review” outcomes rather than fabricated approvals.
- **Verify:** Spatial conditions select applicable review items and cite source confidence; missing jurisdiction data yields not-evaluated/blocking behavior.
- **Done when:** Students recognize permitting scope and escalation points.

### Chunk 115 — Standards conflict resolution

- **Implement:** Detect conflicts among organization, utility, jurisdiction, curriculum, and project rules; define precedence and require instructor resolution before publication.
- **Verify:** Tests cover explicit override, unresolved conflict, expired source, and project exception with rationale.
- **Done when:** The engine never silently chooses among contradictory standards.

### Chunk 116 — Engineering exception workflow

- **Implement:** Allow students to request a deviation with affected rule, rationale, alternatives, risk, evidence, and mitigation; require authorized disposition and audit.
- **Verify:** Exceptions do not automatically pass checks and remain pinned to the revision/profile evaluated.
- **Done when:** Legitimate exceptions are taught without weakening deterministic enforcement.

### Chunk 117 — Safety and professional-scope boundaries

- **Implement:** Add persistent scope notices and workflow gates for electrical safety, pole loading, make-ready, traffic control, confined space, permitting, and sealed engineering.
- **Verify:** Relevant scenarios require acknowledgment and qualified-review routing; exports carry appropriate status/disclaimers.
- **Done when:** Educational output cannot be mistaken for professional approval.

### Chunk 118 — Standards profile validation suite

- **Implement:** Validate ranges, units, contradictions, required sources, rule dependencies, deprecated materials, and unsupported geometry conditions before profile publication.
- **Verify:** Malformed profiles fail with precise field/rule errors; published valid profiles drive grading fixtures correctly.
- **Done when:** Bad policy configuration cannot corrupt assessment silently.

### Chunk 119 — Profile-change impact analysis

- **Implement:** Compare profile versions and identify affected projects, checks, students, submissions, exports, and instructor calibration; never retroactively mutate results.
- **Verify:** A changed span/drop/reserve rule produces an accurate impact report and optional controlled re-evaluation copy.
- **Done when:** Standards updates are understood before rollout.

### Chunk 120 — Standards governance acceptance gate

- **Implement:** Exercise author → review → publish → assign → apply → exception → supersede for two conflicting utility profiles.
- **Verify:** Live E2E proves version pinning, citations, conflict handling, scope notices, and historical integrity.
- **Done when:** Engineering policy is governed and auditable end to end.

## Phase 10 — Realistic work packages and scenario authoring

### Chunk 121 — Work-package domain model

- **Implement:** Model client brief, scope, deliverables, study area, source bundle, standards profile, assumptions, exclusions, milestones, due dates, change orders, and acceptance criteria.
- **Verify:** Work packages version independently from curriculum wrappers and pin all dependencies.
- **Done when:** Students receive a realistic assignment package rather than a list of drawing tasks.

### Chunk 122 — Work-package authoring UI

- **Implement:** Build instructor tools to assemble, preview, validate, publish, clone, and retire work packages without source edits.
- **Verify:** Author a Parkside package through the UI and preview exactly what student and reviewer roles see.
- **Done when:** Scenario creation is usable by instructors, not developers only.

### Chunk 123 — Source-document bundle

- **Implement:** Attach approved maps, tables, survey notes, client standards excerpts, photos, field reports, and correspondence with provenance, access rules, versioning, and malware scanning.
- **Verify:** Students can cite bundle items in assumptions/rationales; superseded documents remain available to historical revisions.
- **Done when:** Decisions can be grounded in authentic project evidence.

### Chunk 124 — Scope and deliverable checklist

- **Implement:** Convert required outputs into versioned checklist items with responsible stage, format, acceptance rule, and reviewer disposition.
- **Verify:** Submission blocks on missing mandatory deliverables and records explicit not-applicable approvals.
- **Done when:** Students learn scope control and package completeness.

### Chunk 125 — Controlled ambiguity authoring

- **Implement:** Let scenario authors intentionally omit, conflict, or degrade selected information and define expected student escalation/assumption behavior without embedding answers client-side.
- **Verify:** Ambiguity variants remain deterministic per assignment seed and are visible only to authorized reviewers.
- **Done when:** Scenarios assess uncertainty handling rather than perfect-data tracing.

### Chunk 126 — Scenario parameterization

- **Implement:** Parameterize demand, take rate, growth, architecture, standards profile, budget emphasis, source confidence, and construction constraints while preserving authored validity.
- **Verify:** Generated variants satisfy schema/invariants and do not reveal a single memorized solution.
- **Done when:** Cohorts can receive comparable but non-identical assignments.

### Chunk 127 — Reference solutions as solution families

- **Implement:** Store multiple acceptable reference approaches with invariant outcomes, tradeoffs, known risks, and rubric calibration—not a single hidden geometry.
- **Verify:** Distinct valid topologies pass invariants while intentionally poor alternatives fail for explainable reasons.
- **Done when:** Grading rewards defensible engineering rather than imitation.

### Chunk 128 — Scenario validation and solvability harness

- **Implement:** Validate data availability, rule compatibility, achievable capacity, gate reachability, expected outputs, and at least one complete reference path before publication.
- **Verify:** Mutation tests create impossible/underspecified scenarios and publication rejects them.
- **Done when:** Students are not assigned broken projects unknowingly.

### Chunk 129 — Scenario difficulty calibration

- **Implement:** Calculate and manually calibrate complexity using premises, topology branches, source ambiguity, constraints, LLD volume, required decisions, and expected effort.
- **Verify:** Pilot/seed evidence compares predicted and observed completion behavior without treating time alone as ability.
- **Done when:** Beginner/intermediate/advanced labels have defensible criteria.

### Chunk 130 — Work-package acceptance journey

- **Implement:** Author, validate, publish, assign, open, cite, revise, and complete a production-like package through real UI and APIs.
- **Verify:** E2E uses persisted documents/data/profile/version pins and role-authenticated access.
- **Done when:** The platform supports authentic assignment delivery end to end.

## Phase 11 — Advanced HLD engineering practice

### Chunk 131 — Demand and take-rate scenario planning

- **Implement:** Allow students to distinguish premises passed, serviceable premises, initial take rate, growth horizon, and reserve policy; generate scenario comparisons.
- **Verify:** Capacity/gate calculations use the selected approved scenario and flag unsupported assumptions.
- **Done when:** HLD sizing reflects demand planning rather than raw address count only.

### Chunk 132 — Serving-area optimization workspace

- **Implement:** Provide group capacity, geographic cohesion, route implications, growth, and imbalance metrics while leaving final decisions to the student.
- **Verify:** Alternative groupings update metrics deterministically and preserve rationale.
- **Done when:** Students can evaluate serving-area tradeoffs without an opaque auto-answer.

### Chunk 133 — FDH and cabinet siting analysis

- **Implement:** Evaluate candidate sites for access, serving balance, route length, parcel/ROW context, constraints, growth, and field-verification requirements.
- **Verify:** Multiple defensible sites can pass hard gates and receive distinct tradeoff evidence.
- **Done when:** Cabinet placement is assessed as a decision, not proximity to an “optimal” point.

### Chunk 134 — Aerial versus underground alternative analysis

- **Implement:** Compare route mode using available infrastructure, structures, crossings, constraints, maintainability, materials, and source confidence; require rationale and escalation of unknowns.
- **Verify:** Scenario policies alter applicable evidence without fabricating costs or permits.
- **Done when:** Students practice route-mode selection under realistic uncertainty.

### Chunk 135 — Crossing identification and escalation

- **Implement:** Detect road, highway, railroad, water, bridge, and constrained-area crossings; collect method proposal, required approvals, source confidence, and qualified-review status.
- **Verify:** Spatial test fixtures cover intersection/near-miss/multipart cases and missing-source not-evaluated outcomes.
- **Done when:** Critical crossings cannot disappear inside generic route length.

### Chunk 136 — Route diversity and resiliency scenarios

- **Implement:** Support scenarios requiring diverse paths, protected facilities, single-point-of-failure analysis, and explicit resiliency tradeoffs.
- **Verify:** Graph analysis correctly identifies shared-risk segments and false diversity.
- **Done when:** Advanced students can reason about more than tree connectivity.

### Chunk 137 — Growth and expansion planning

- **Implement:** Let students reserve ports, fibers, ducts, cabinet capacity, and strategic structures for defined horizons; compare overbuild versus constrained expansion.
- **Verify:** Growth scenarios consume reserves predictably and expose stranded/insufficient capacity.
- **Done when:** Designs demonstrate planned extensibility rather than unexplained excess.

### Chunk 138 — Constructability risk register

- **Implement:** Convert validation findings and student observations into ranked risks with likelihood, impact, evidence, mitigation, owner, and field action.
- **Verify:** Risks remain linked to geometry/revision and flow into review/export/change workflows.
- **Done when:** Constructability is managed as engineering risk, not merely pass/fail checks.

### Chunk 139 — HLD design review package

- **Implement:** Generate HLD plan view, topology summary, demand/capacity tables, assumptions, alternatives, risks, decisions, unresolved questions, and readiness checklist.
- **Verify:** Package content reconciles with the pinned revision and contains no stale or fabricated metrics.
- **Done when:** An instructor can conduct a production-style HLD review from one package.

### Chunk 140 — HLD defense gate

- **Implement:** Add reviewer rubric and optional live/oral defense record for data interpretation, alternatives, decisions, risk, and next-stage readiness.
- **Verify:** LLD remains locked until mandatory HLD invariants and judgment evidence pass; overrides are authorized/audited.
- **Done when:** HLD approval represents reviewed engineering intent.

## Phase 12 — Advanced LLD, optical, splicing, and material practice

### Chunk 141 — Cable hierarchy and segment continuity

- **Implement:** Model feeder/distribution/drop hierarchy, segment transitions, cable identity, sheath continuity, endpoints, route occupancy, and revision-safe splits/merges.
- **Verify:** Graph and persistence tests reject ambiguous or duplicate continuity.
- **Done when:** LLD cables correspond to traceable physical segments.

### Chunk 142 — Fiber reserve and allocation policy

- **Implement:** Apply profile-driven working/spare/reserve policies by cable role and horizon; show utilization and exceptions without auto-filling a hidden answer.
- **Verify:** Allocation tests cover partial tubes, reserved ranges, future groups, and approved deviations.
- **Done when:** Fiber planning is intentional and policy-cited.

### Chunk 143 — Splitter architecture analysis

- **Implement:** Support centralized/distributed/cascaded configurations allowed by profile, validate stage ratios and served demand, and compare operational tradeoffs.
- **Verify:** Invalid cascades, oversubscription, orphan outputs, and unsupported ratios fail with trace evidence.
- **Done when:** Splitter choices have topology and capacity meaning.

### Chunk 144 — Optical loss-budget engine

- **Implement:** Calculate path loss from fiber length, connectors, splices, splitters, engineering margin, wavelength/profile parameters, and approved component catalog versions.
- **Verify:** Independently calculated fixtures cover best/worst paths, unit conversions, cascades, missing attributes, and boundary tolerances.
- **Done when:** Every served premise/path has an explainable pinned loss budget or explicit not-evaluated blocker.

### Chunk 145 — Optical budget workspace

- **Implement:** Show path trace, each loss contribution, total, margin, policy limit, worst-case ranking, and map/fiber navigation; require correction or authorized exception.
- **Verify:** UI results exactly match server calculations and remain stable across reload/export.
- **Done when:** Students can diagnose optical failures rather than see a single number.

### Chunk 146 — Splice plan editing at scale

- **Implement:** Add efficient tube/fiber bulk operations, pass-through ranges, ribbon/non-ribbon policy where supported, conflict visualization, filters, keyboard workflows, and validation summaries.
- **Verify:** Large closure fixtures remain responsive and preserve exact assignments after save/reload.
- **Done when:** Production-sized splice plans are practical to author.

### Chunk 147 — End-to-end circuit tracing

- **Implement:** Trace serving paths from source port through feeder, splitter stages, distribution, terminal, and premise with fiber identity and splice transitions.
- **Verify:** Tests detect swaps, loops, gaps, duplicate service, wrong splitter output, and stale trace cache.
- **Done when:** Connectivity can be audited at circuit/fiber level.

### Chunk 148 — Slack and maintenance strategy

- **Implement:** Model slack loops, storage location, amount, container capacity, splice access, maintenance rationale, and policy checks.
- **Verify:** Tests cover missing/excess/invalid hosting, units, route changes, and BOM reconciliation.
- **Done when:** Slack is an explicit maintainability decision.

### Chunk 149 — Material catalog governance

- **Implement:** Version cables, closures, cabinets, terminals, conduit, structures, consumables, compatibility, units, status, and client-approved substitutions.
- **Verify:** Published designs pin catalog versions; retired materials remain readable historically but unavailable for new work.
- **Done when:** BOM and validation use governed products instead of loose labels.

### Chunk 150 — LLD production package gate

- **Implement:** Validate cable schedule, fiber allocation, splice matrix/diagrams, optical budgets, labels, schematic, slack, BOM, assumptions, exceptions, and unresolved risks as one package.
- **Verify:** Intentionally corrupt each artifact relationship and ensure the package gate identifies the precise inconsistency.
- **Done when:** LLD approval represents internally reconciled documentation.

## Phase 13 — Field conditions, redlines, revisions, and change control

### Chunk 151 — Field observation model

- **Implement:** Persist dated observations with author, location/feature, photos/documents, condition type, confidence, notes, and source chain.
- **Verify:** Access, malware, EXIF/privacy, tenant, and revision-link tests pass.
- **Done when:** Field evidence can supersede desktop assumptions transparently.

### Chunk 152 — Field-change event authoring

- **Implement:** Let instructors introduce controlled discoveries such as blocked conduit, missing pole, changed parcel access, unsuitable cabinet site, new crossing constraint, or unavailable material.
- **Verify:** Events target specific assignment variants, reveal at configured milestones, and do not leak before release.
- **Done when:** Students must adapt rather than memorize a static solution.

### Chunk 153 — Design impact analysis

- **Implement:** Given a source/field/standards change, identify affected routes, topology, capacity, fibers, splices, optical paths, BOM, rationale, checks, and deliverables.
- **Verify:** Synthetic changes produce complete dependency impacts without mutating the design.
- **Done when:** Students can see the scope of a proposed revision before editing.

### Chunk 154 — Redline markup workflow

- **Implement:** Add revision-pinned map/document redlines with geometry, callouts, issue category, author, disposition, and links to affected elements.
- **Verify:** Redlines remain visible on the reviewed revision and can be carried/resolved explicitly on a child revision.
- **Done when:** Review feedback resembles production redline practice.

### Chunk 155 — Change request workflow

- **Implement:** Model request, reason, initiator, affected scope, urgency, proposed response, decision, approver, and schedule/deliverable impact.
- **Verify:** Permissions and state transitions prevent students from self-approving scope changes.
- **Done when:** Design changes have controlled authorization.

### Chunk 156 — Revision compare and visual diff

- **Implement:** Compare added/removed/moved/changed features, topology, fibers, splices, loss, BOM, assumptions, risks, rationales, and check outcomes.
- **Verify:** Diff tests handle stable IDs, splits/merges, reordered attributes, and false-positive suppression.
- **Done when:** Reviewers can understand what changed and why.

### Chunk 157 — Revision response matrix

- **Implement:** Require disposition for every redline/comment/change item: accepted, revised, clarified, rejected with rationale, or qualified-review escalation.
- **Verify:** Resubmission blocks on undisposed mandatory items and preserves the full exchange.
- **Done when:** QA feedback cannot be silently ignored.

### Chunk 158 — Cascading artifact regeneration

- **Implement:** Mark derived outputs stale after relevant edits and regenerate grading, traces, optical budgets, splice diagrams, labels, schematic, and BOM in dependency order.
- **Verify:** Tests prove unrelated edits do not invalidate everything and relevant edits cannot leave stale “current” artifacts.
- **Done when:** Revision packages are internally current.

### Chunk 159 — As-built transition simulation

- **Implement:** Support approved-design versus constructed/as-built differences, field redlines, material substitutions, final geometry, unresolved punch items, and acceptance state.
- **Verify:** Original approved design remains immutable and the as-built lineage is explicit.
- **Done when:** Advanced students practice closing the documentation loop.

### Chunk 160 — Field-change capstone

- **Implement:** Deliver a timed scenario where a previously valid design receives multiple field changes and must be impact-assessed, revised, redlined, reconciled, and resubmitted.
- **Verify:** E2E covers event release through instructor acceptance with diff and artifact regeneration.
- **Done when:** Adaptability under change is directly assessed.

## Phase 14 — Production-style QA/QC and design review

### Chunk 161 — QA/QC checklist framework

- **Implement:** Build versioned checklists by stage/profile covering scope, data, topology, geometry, constructability, capacity, optical, splicing, labels, BOM, documents, assumptions, and approvals.
- **Verify:** Mandatory, conditional, and not-applicable items require appropriate evidence/disposition.
- **Done when:** Review completeness is systematic and auditable.

### Chunk 162 — Independent reviewer assignment

- **Implement:** Assign reviews based on role, cohort, workload, conflict of interest, required qualification, and due date; prevent self-review where policy forbids it.
- **Verify:** State/authorization tests cover reassignment, absence, escalation, and tenant boundaries.
- **Done when:** Approval has credible reviewer independence.

### Chunk 163 — Automated preflight review

- **Implement:** Run deterministic checks, missing evidence, stale artifacts, unresolved assumptions, profile mismatch, and package integrity before human review.
- **Verify:** Preflight blocks incomplete packages but never substitutes for mandatory judgment review.
- **Done when:** Reviewer time is focused on engineering judgment.

### Chunk 164 — Review sampling and drill-down

- **Implement:** Let reviewers inspect worst optical paths, high-risk crossings, capacity edges, exception sites, representative splice points, and random samples with map/table linkage.
- **Verify:** Sampling is reproducible/auditable and cannot omit mandatory high-risk items.
- **Done when:** Large designs can be reviewed efficiently without superficial approval.

### Chunk 165 — Defect classification and severity

- **Implement:** Standardize defect categories, severity, root cause, affected competency, correction requirement, and recurrence tracking.
- **Verify:** Defects link to exact evidence and aggregate correctly without exposing one student's data to another.
- **Done when:** QA findings support both correction and learning analysis.

### Chunk 166 — QA disposition and approval states

- **Implement:** Support return-for-correction, conditional approval, approved, rejected/out-of-scope, and qualified-review escalation with explicit authority and required notes.
- **Verify:** State machine tests prevent illegal transitions and approval with unresolved blockers.
- **Done when:** Review outcomes have production-like meaning.

### Chunk 167 — Inter-reviewer calibration

- **Implement:** Provide anonymized calibration packages, independent scoring, criterion disagreement analysis, consensus notes, and rubric adjustments through new versions.
- **Verify:** Historical scores remain unchanged; calibration metrics distinguish harshness from evidence differences.
- **Done when:** Human assessment consistency is measured and improved.

### Chunk 168 — Student correction workflow

- **Implement:** Present prioritized defects, evidence, rubric criteria, redlines, and response requirements without giving the corrected design; create a child revision for remediation.
- **Verify:** Students cannot modify the reviewed submission and reviewers can trace each correction.
- **Done when:** QA becomes a learning cycle rather than a final verdict.

### Chunk 169 — QA analytics and recurring-defect insight

- **Implement:** Analyze defect type, severity, competency, stage, project, cohort, reviewer, recurrence, and time-to-correction with privacy thresholds.
- **Verify:** Seeded records yield independently verified aggregates and useful drill-down.
- **Done when:** Instructors can target practice based on real design weaknesses.

### Chunk 170 — QA/QC acceptance journey

- **Implement:** Automate submit → preflight → assign independent reviewer → inspect → redline → return → revise → respond → recheck → approve.
- **Verify:** Use real revisions and artifacts; prove audit trail, immutable history, and gate enforcement.
- **Done when:** A full production-style review cycle passes end to end.

## Phase 15 — Instructor operations and assessment quality

### Chunk 171 — Instructor workbench

- **Implement:** Consolidate cohorts, assignments, review queue, data approvals, standards profiles, scenario authoring, calibration, alerts, and analytics into a role-appropriate workspace.
- **Verify:** Common workflows require no hidden URL or direct API/database manipulation.
- **Done when:** Instructors can operate the program independently.

### Chunk 172 — Assignment monitoring and intervention

- **Implement:** Surface stage progress, autosave health, stalled work, repeated failures, hint escalation, unresolved assumptions, overdue reviews, and accessibility accommodations.
- **Verify:** Alerts are explainable, configurable, and avoid labeling inactivity as incompetence automatically.
- **Done when:** Instructors can intervene early using evidence.

### Chunk 173 — Manual assessment safeguards

- **Implement:** Require criterion-level evidence, comments for extreme/override scores, blind review option, conflict disclosure, and change history.
- **Verify:** Authorization/audit tests prevent silent score changes and reveal assessor identity appropriately.
- **Done when:** Human grading is accountable and defensible.

### Chunk 174 — Oral design defense records

- **Implement:** Schedule/record structured defense outcomes, questions, competency evidence, assessor notes, and follow-ups without requiring audio/video storage.
- **Verify:** Completion policies can require defense evidence while protecting private notes.
- **Done when:** Instructors can test whether students understand their own design.

### Chunk 175 — Personalized practice assignment

- **Implement:** Recommend or assign targeted scenario fragments based on missing competency evidence and recurring defects; keep instructor control over assignment.
- **Verify:** Recommendations cite evidence and never infer protected traits or use opaque AI scoring.
- **Done when:** Remediation is focused and transparent.

### Chunk 176 — Academic integrity controls

- **Implement:** Use scenario variants, artifact lineage, suspicious duplicate analysis, rationale consistency, and oral defense—not invasive surveillance—to flag review candidates.
- **Verify:** Flags are non-punitive until human review and include false-positive safeguards.
- **Done when:** Integrity is supported without claiming automated guilt.

### Chunk 177 — Instructor content preview and student-view simulation

- **Implement:** Allow instructors to preview each role/stage/date/variant, including hidden answers, release events, hints, and accommodations.
- **Verify:** Preview never creates real progress or leaks instructor-only content into student APIs.
- **Done when:** Instructors can validate the experience before release.

### Chunk 178 — Assessment reliability reporting

- **Implement:** Report rubric criterion distributions, reviewer agreement, item/check performance, scenario difficulty, retake effects, and evidence coverage with appropriate statistical caveats.
- **Verify:** Metrics use sufficient sample thresholds and cannot expose individuals improperly.
- **Done when:** Program owners can identify unreliable assessments.

### Chunk 179 — Instructor onboarding and certification

- **Implement:** Create operator training for source approval, profile governance, scenario publication, review calibration, exceptions, student support, and scope boundaries; track completion.
- **Verify:** New instructor sandbox journey exercises each privileged workflow safely.
- **Done when:** Production privileges are paired with demonstrated operational readiness.

### Chunk 180 — Instructor operations acceptance gate

- **Implement:** Have a fresh instructor persona configure and run a cohort from data approval through final review using only documented UI/runbooks.
- **Verify:** Record friction, permissions, errors, and time; remediate blockers before passing.
- **Done when:** The program is operable without developer intervention.

## Phase 16 — Job readiness, portfolios, and employer-facing evidence

### Chunk 181 — Job-role competency profiles

- **Implement:** Define transparent profiles such as junior FTTH HLD designer, junior LLD/fiber designer, GIS/data-prep technician, and QA trainee with required evidence.
- **Verify:** Profiles cite competencies and minimum evidence rather than marketing language.
- **Done when:** Completion claims are role-specific and defensible.

### Chunk 182 — Capstone portfolio artifact selection

- **Implement:** Let students select approved revisions and evidence, add context/rationale/reflection, and preview redaction before portfolio publication.
- **Verify:** Only authorized, privacy-safe, instructor-approved artifacts can be shared.
- **Done when:** Portfolios demonstrate process as well as final drawings.

### Chunk 183 — Competency transcript

- **Implement:** Generate a verifiable transcript of competencies, proficiency, evidence types, curriculum/profile versions, completion dates, and assessor status without exposing proprietary source data.
- **Verify:** Verification detects tampering/revocation and respects consent/expiry.
- **Done when:** Employers can understand what the student actually demonstrated.

### Chunk 184 — Design reflection and lessons learned

- **Implement:** Require capstone reflection on assumptions, alternatives, defects, revisions, field changes, tradeoffs, and future improvements with reviewer rubric.
- **Verify:** Reflection remains linked to immutable evidence and is not auto-scored as truth by generative AI.
- **Done when:** Students articulate learning from the engineering cycle.

### Chunk 185 — Timed practical assessment mode

- **Implement:** Add controlled start/end windows, autosave, permitted resources, pause/accommodation policy, event release, submission lock, and recovery procedures.
- **Verify:** Clock authority is server-side; disconnects and approved accommodations do not cause silent loss or unfair expiry.
- **Done when:** Programs can run credible practical evaluations.

### Chunk 186 — Blind benchmark capstones

- **Implement:** Provide unseen but equivalent scenarios with hidden calibration data, multiple valid solution families, and independent review.
- **Verify:** Benchmark validity/solvability and difficulty are established before use; prior attempts cannot reveal protected answers.
- **Done when:** Final competence is demonstrated beyond rehearsed fixtures.

### Chunk 187 — Employer review mode

- **Implement:** Create consent-based, read-only review of selected artifacts, evidence, verification status, and limitations without exposing classroom analytics or source-restricted layers.
- **Verify:** Revocation and expiration take effect immediately; tenant/privacy tests cover link sharing.
- **Done when:** External viewers see credible evidence safely.

### Chunk 188 — Certificate language and scope

- **Implement:** Use precise statements such as demonstrated training competencies; exclude licensure, permitting authority, field verification, safety qualification, and construction approval claims.
- **Verify:** Legal/instructor-configured templates are versioned and certificate verification shows exact scope.
- **Done when:** Credentials are useful without overstating professional authority.

### Chunk 189 — Graduate performance feedback loop

- **Implement:** With consent and privacy safeguards, collect structured employer/instructor feedback on task readiness, recurring gaps, and curriculum relevance; separate anecdotes from validated outcomes.
- **Verify:** Aggregation thresholds and retention prevent identification or retaliatory use.
- **Done when:** Curriculum evolution can use post-training evidence responsibly.

### Chunk 190 — Job-readiness acceptance gate

- **Implement:** Run a blind capstone including ambiguity, alternatives, HLD defense, LLD, optical/splice/BOM reconciliation, field change, QA correction, and portfolio evidence.
- **Verify:** Independent calibrated reviewers evaluate against the role profile; all artifacts and scope limitations are verifiable.
- **Done when:** The platform can substantiate junior-role readiness under supervision.

## Phase 17 — Scale, resilience, continuous quality, and final program validation

### Chunk 191 — Large-design capacity benchmark

- **Implement:** Define and support a larger-than-Parkside benchmark with realistic parcels, premises, routes, fibers, splices, revisions, comments, and concurrent users.
- **Verify:** Measure browser memory/FPS, tile/API latency, autosave, grading, trace, export, and review performance against budgets.
- **Done when:** Applied workflows remain usable at target production scale.

### Chunk 192 — Long-running session resilience

- **Implement:** Test and fix multi-hour editing, token refresh, repeated style changes, tab sleep/wake, reconnect, memory growth, autosave accumulation, and stale data.
- **Verify:** Automated soak plus browser profiling shows bounded resources and no lost state.
- **Done when:** A full student work session is stable.

### Chunk 193 — Concurrent cohort load and fairness

- **Implement:** Exercise synchronized assignment release, autosave bursts, grading submissions, exports, and instructor dashboards with admission/backpressure where necessary.
- **Verify:** Load results show bounded degradation, no tenant starvation, and actionable overload responses.
- **Done when:** A class deadline cannot collapse the platform unpredictably.

### Chunk 194 — Failure-injection program

- **Implement:** Inject database latency/outage, object-store failure, queue restart, external API timeout, tile failure, deploy during editing, and email outage.
- **Verify:** Data integrity, retries, user messaging, alerts, recovery, and idempotency meet documented expectations.
- **Done when:** Common infrastructure failures are rehearsed rather than theoretical.

### Chunk 195 — Data corruption detection and repair

- **Implement:** Add integrity checks for revision graphs, geometry/SRID, topology, allocation overlap, artifact checksums, source pins, and orphaned objects plus safe repair/report tools.
- **Verify:** Seed corruption in staging copies and recover without erasing audit history.
- **Done when:** Silent corruption is detectable and operator response is documented.

### Chunk 196 — Continuous synthetic journeys

- **Implement:** Schedule production-safe synthetic login, assignment open, map data render, autosave, grading dry-run, and export checks using dedicated tenant/data.
- **Verify:** Failures alert with correlation IDs and never pollute customer analytics or permissions.
- **Done when:** Critical journeys are monitored continuously, not only at deploy.

### Chunk 197 — Curriculum regression suite

- **Implement:** Run all published scenario solvability, check registry, profile compatibility, reference-family invariants, hidden event, and expected gate tests on code/config changes.
- **Verify:** An intentional rule or schema regression identifies exactly which published versions are affected.
- **Done when:** Platform releases cannot silently break active curricula.

### Chunk 198 — Operational game day

- **Implement:** Conduct a staged incident spanning service degradation, failed import, autosave concern, and instructor deadline; use alerts, support mode, status communication, rollback, and recovery runbooks.
- **Verify:** Record detection/recovery times, decisions, missing telemetry, unsafe steps, and corrective actions.
- **Done when:** Operators demonstrate coordinated response within target objectives.

### Chunk 199 — Independent truth audit

- **Implement:** Re-audit chunks 001–200 from source, migrations, tests, live paths, infrastructure, and evidence. Downgrade anything represented only by constants, models, mocks, placeholder UI, or reports.
- **Verify:** Sample critical claims by disabling/removing implementation and confirming acceptance tests fail; reconcile status, README, and runbooks.
- **Done when:** Completion claims survive hostile evidence-based review.

### Chunk 200 — Applied OSP program production acceptance

- **Implement:** Execute a clean-room, multi-role program journey: provision organization → approve real source data/profile → author/publish work package → enroll theory-ready student → diagnose readiness → complete HLD with alternatives/rationale/assumptions → defend → complete LLD/optical/splice/BOM → receive field change → revise → undergo independent QA → pass blind benchmark → publish verified portfolio evidence. Include deployment, security, accessibility, load, backup/restore, failure injection, curriculum regression, and operations results.
- **Verify:** Use production builds and production-like infrastructure without dev seeds, local runtime fixture fallback, route interception, answer leakage, manual database edits, or mocked acceptance services. Run all verification and Playwright projects and archive evidence with commit/release/profile/curriculum/source versions.
- **Done when:** The system credibly trains and assesses applied junior-level OSP design work under qualified supervision; all critical competencies have evidence; no P0/P1 defect, high/critical security issue, tenant leak, data-loss path, inaccessible blocker, stale artifact path, misleading credential claim, or undocumented production operation remains. If any condition fails, state plainly that the program is not production-ready and list blocking chunks.

---

## Required phase-two evidence package

1. Competency framework, role profiles, evidence mappings, and completion policies.
2. Versioned standards profiles, citations, conflict/exception records, and scope notices.
3. At least one fully authored work package with ambiguity, variants, and multiple valid solution families.
4. HLD and LLD package examples with rationale, assumptions, alternatives, risks, optical budgets, splices, BOM, and QA history.
5. Field-change/redline/revision evidence and regenerated artifact reconciliation.
6. Rubric calibration, reviewer agreement, defect analytics, and correction-cycle evidence.
7. Blind capstone results and job-role competency transcript verification.
8. Large-design/load/soak/failure-injection/curriculum-regression reports.
9. Updated security, accessibility, privacy, backup, deployment, incident, and operations evidence from chunks 001–100.
10. A truthful chunk 001–200 matrix separating code present, wired, live verified, and production accepted.

## Final response contract for the implementation agent

Return the canonical branch, final SHA, chunks completed/partial/blocked/already verified, exact gate results, live acceptance evidence, migrations, infrastructure changes, unresolved risks, manual/external actions, and paths to all evidence. Do not summarize scaffolds as finished features. If any definition of done is unmet, identify it precisely and continue safe independent chunks rather than declaring blanket completion.
