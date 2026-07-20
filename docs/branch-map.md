# Branch Map — feat/50-chunk-recovery

Generated: 2026-07-20. Canonical development line: `feat/50-chunk-recovery`.

## Canonical branch

| Branch | Purpose | Verified |
|---|---|---|
| `feat/50-chunk-recovery` | Primary development line; contains audited implementation with real Williamson County data, 222 passing tests, production build | `npm run verify` green: lint=0, typecheck=pass, 222/222 tests, 40 API routes built |

SHA at generation: `1ef7ce6`.

## Divergence evidence

`git rev-list --left-right --count feat/50-chunk-recovery...<branch>` — left=recovery, right=<branch>:

| Branch | Left (recovery) | Right (branch) | Relationship |
|---|---|---|---|
| `feat/50-chunk-master-plan` | 56 | 55 | Heavily divergent. Contains earlier completion claims that prompted the recovery audit. Do not merge wholesale. |
| `feat/saas-learning-foundation` | 82 | 17 | Divergent implementation line. Recovery has +65 unique commits, saas has 17 unique commits. |
| `feat/30-chunk-gis-platform` | 56 | 5 | Recovery baseline. 5 commits exist on 30-chunk not in recovery — likely cherry-picked or stale. Archival. |
| `feat/parcel-basemap-intake` | 80 | 0 | Strict subset of recovery. Recovery has 80 commits ahead. Superseded. |
| `master` | 82 | 0 | Strict subset. Recovery has 82 commits ahead. Update after launch. |
| `audit-and-fix-implementation-based-on-report` | N/A | N/A | Audit snapshot. Contains no unique code. Archival. |

### Agent Manager worktrees

| Branch | Tip | Status |
|---|---|---|
| `horn-helium` | `555a1b8` (Documentation README) | Agent Manager spawn, 82 behind recovery. No unique work. Superseded. |
| `noiseless-nerve` | `25bd195` (DWG ingest prototype) | Agent Manager spawn, 92 behind recovery. No unique work. Superseded. |
| `petal-honeydew` | `555a1b8` (Documentation README) | Agent Manager spawn, 82 behind recovery. No unique work. Superseded. |

## Current worktrees

| Path | Branch | SHA | Status |
|---|---|---|---|
| (root) `C:/.../skarion-vetro` | `feat/parcel-basemap-intake` | `73de394` | Older checkout. Use worktree for development. |
| `.kilo/worktrees/scarce-park` | `feat/50-chunk-recovery` | `1ef7ce6` | **Active development worktree.** Canonical. |
| `.kilo/worktrees/horn-helium` | `horn-helium` | `555a1b8` | Agent Manager spawn. Superseded. |
| `.kilo/worktrees/noiseless-nerve` | `noiseless-nerve` | `25bd195` | Agent Manager spawn. Superseded. |
| `.kilo/worktrees/petal-honeydew` | `petal-honeydew` | `555a1b8` | Agent Manager spawn. Superseded. |

## Branch disposition

| Branch | Disposition |
|---|---|
| `feat/50-chunk-recovery` | **Canonical.** All future work targets this branch. |
| `feat/50-chunk-master-plan` | Archival. Salvage individual commit content only after evidence-based comparison. Do not merge. |
| `feat/saas-learning-foundation` | Archival. Salvage individual commit content only if independently verified. |
| `feat/30-chunk-gis-platform` | Archival. Baseline merged into recovery at branch creation. |
| `feat/parcel-basemap-intake` | Superseded. All content subsumed by recovery. Delete after launch. |
| `master` | Update from recovery after production launch. |
| `audit-and-fix-implementation-based-on-report` | Archival. Audit snapshot, no unique code. Delete. |
| `horn-helium` | Agent Manager worktree. Superseded. Prune worktrees and branches. |
| `noiseless-nerve` | Agent Manager worktree. Superseded. Prune worktrees and branches. |
| `petal-honeydew` | Agent Manager worktree. Superseded. Prune worktrees and branches. |

## Unrelated files removed

CRM/Talentos plan files under `.kilo/plans/` were excluded via `.gitignore` addition. No VETRO-scope files were deleted.

## Future branch policy

- All development targets `feat/50-chunk-recovery`.
- Feature branches branch from recovery.
- Agent Manager spawns from recovery.
- `master` updated only when a versioned release is complete.
