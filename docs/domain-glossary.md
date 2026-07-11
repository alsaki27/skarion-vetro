# Skarion-VETRO Domain Glossary

## Core entity hierarchy

```
Organization
  └── CurriculumProject (versioned definition)
        └── ProjectVersion (immutable published snapshot)
  └── Cohort (instructional group)
        └── Assignment (links cohort to ProjectVersion)
              └── StudentDesign (one working design per student)
                    └── DesignSnapshot / Attempt
                          └── Grade
```

### Organization
A tenant boundary. Every runtime record belongs to exactly one organization.
Plans: `trial`, `starter`, `pro`, `enterprise`.

### CurriculumProject
The stable identity of a design exercise. Contains metadata, difficulty,
environment, split architecture, and links to its versions.

### ProjectVersion
An immutable published snapshot of a project definition:
scenario, constraints, grading rules, preloaded elements, answer-key
reference (never exposed to students), map configuration, allowable tools,
stage configuration, and learning objective mappings.

States: `draft` → `review` → `published` → `archived`

### Cohort
A named instructional group within an organization. Has a start/end window,
one or more instructors, enrolled students, and optional learning defaults.

### Assignment
Connects a ProjectVersion to a Cohort (or individual student override).
Controls open/due/close timestamps, attempt policy, hint policy, and
prerequisite rules.

States: `scheduled` → `open` → `closed` → `archived`

### StudentDesign
One working design per student per assignment. Tracks current stage,
revision number, and immutable checkpoints. Persisted server-side with
optimistic concurrency. The single source of truth for a student's work
at any point.

### DesignSnapshot / Attempt
Immutable records of the design state at a point in time. A snapshot is
taken before stage completion and every submission. Each attempt collects
one snapshot and the resulting grade.

### Grade
An immutable record containing total score, mandatory gate results,
category scores, per-check results, engine version, and rule-configuration
version. References the exact design revision that was graded.

---

## Student workflow stages

Each project version defines a sequence of stages. Stages gate tool
availability and progression. Completion of earlier stages unlocks later
ones; modifying earlier work may invalidate dependent stages.

| Stage | Purpose |
|---|---|
| `orientation` | Read project brief, view basemap, understand scope |
| `demand` | Identify and mark all serviceable premises |
| `service_groups` | Group premises into MST service groups |
| `structures` | Place handholes, flowerpots, vaults, and equipment |
| `routes` | Draw conduit, feeder FOC, distribution FOC, pigtails |
| `topology` | Define closure service sets, upstream FDH assignments |
| `hld_review` | Instructor review and approval gate |
| `lld` | Fiber assignment, splice table, bill of materials |
| `complete` | Project finished, export available |

**Current scope:** Projects 2–4 implement stages up to `hld_review`.
Future projects (P1 AutoCAD basemap gate, P5 AutoCAD export gate) use
only `orientation` + `complete` in the online platform.

### Stage completion and invalidation
- Completing a stage creates an immutable design checkpoint.
- If a student changes upstream elements (e.g., moves a structure after
  routes are drawn), downstream stages are marked `needs_review` and may
  require re-validation.
- Instructors can override stage state when field conditions warrant.

---

## Route roles (typed route model)

Current generic line types (`cable`, `conduit`, `drop_cable`) will be
superseded by these engineering-aware roles. Implementation is deferred
to Phase D (Chunk 23).

| Role | Abbreviation | Description |
|---|---|---|
| `conduit` | — | Physical conduit/duct path |
| `feeder_foc` | FOC | Feeder fiber optic cable (central office to FDH) |
| `distribution_foc` | FOC | Distribution fiber (FDH to closure/MST) |
| `pigtail` | — | Pigtail from closure to MST or MST to drop |
| `drop_fiber` | — | Drop fiber from MST/Terminal to premise |

Each route type has allowed endpoint types, minimum/maximum lengths,
containment requirements (e.g., FOC must be in conduit), and
stage-availability rules.

---

## Environment and split architecture (extensible enums)

### Environment
`aerial` | `underground` | `mixed`

Extensible in the database — adding a new environment (e.g., `mdu`,
`copper-overbuild`) requires adding enum values and profile configurations
but no code change to the core engine.

### Split architecture
`centralized` | `distributed` | `cascaded` | `student_choice` | `n/a`

The split architecture defines how the PON splitter is deployed:
- **Centralized:** Splitters in the FDH (1:32 or 1:64)
- **Distributed:** Stage-1 splitters in the FDH, stage-2 in closures/MSTs
- **Cascaded:** Multiple split stages in the field (future)
- **Student choice:** The student selects the architecture (advanced projects)
- **N/A:** Not applicable (underground projects with no split decision)

---

## Project lifecycle

Projects move through these states in the curriculum authoring workflow:

```
draft ──→ review ──→ published ──→ archived
  ↑          │
  └──────────┘
  (edit creates new draft)
```

- **draft:** Being authored. Only visible to instructors/admins.
- **review:** Submitted for review. Immutable during review; review can
  accept or return to draft.
- **published:** Visible to students. Immutable.
- **archived:** No longer assignable. Historical student data preserved.

## Assignment lifecycle

```
scheduled ──→ open ──→ closed ──→ archived
```

- **scheduled:** Visible to students with future date. Not yet accessible.
- **open:** Students can submit work.
- **closed:** Submissions locked. Work is read-only.
- **archived:** Removed from active views. Data preserved.

## Mastery states

Learning objectives are tracked independently of design grades:

| State | Meaning |
|---|---|
| `not_started` | Objective has not been addressed |
| `introduced` | Objective has been presented in lesson content |
| `practicing` | Student has attempted application (with or without hints) |
| `demonstrated` | Student completed the relevant design check independently |
| `mastered` | Objective demonstrated across multiple contexts |
| `needs_review` | Instructor flagged that the objective requires attention |

## AutoCAD integration boundaries

- **HLD 1** (Project 1): An AutoCAD-produced basemap and infrastructure plan
  that serves as the input basemap for Projects 2–4. Students do not create
  HLD 1 online — it is imported from the approved AutoCAD deliverable.
- **HLD 5** (Project 5): The AutoCAD sheet production gate. Students export
  their approved HLD 2–4 design from the platform, then produce final
  construction drawings in AutoCAD. Export format defined in Chunk 30.

Projects 2–4 are the fully online guided workflow. Projects 1 and 5 remain
AutoCAD-dependent and use only the platform's upload/review/export features.
