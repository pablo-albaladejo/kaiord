> Completed: 2026-05-03

## Why

The `archive-followups-guard` capability shipped in PR #464 with an absolute cap (≥ 6 `> Deferred to: #N` markers per archive → fail). Per design D6 of `2026-05-03-repo-hygiene-tooling`, the cap is a **proxy** for the semantically correct invariant: "deferrals MUST NOT exceed shipped tasks per archive" (i.e., a change that defers more than it ships is genuinely overscoped).

The cap fails in two well-known directions:

- **False positives** on healthy-but-large archives (e.g., 30 shipped + 8 deferred is a 21% deferral rate — healthy — but trips a cap-of-6).
- **False negatives** on small overscoped archives (e.g., 2 shipped + 4 deferred is genuinely overscoped — 200% deferral — but slips under cap-of-6).

Issue #465 was filed at PR-2 ship-time as the architectural prerequisite for moving to the ratio invariant: `tasks.md` has no machine-readable shape today, so the script cannot count "completed tasks" reliably. This change adds that shape and switches the lint to the ratio rule when the shape is present.

## What Changes

- **New `> Tasks: <C> completed, <D> deferred` marker** in `tasks.md`. Top-level Markdown blockquote (same syntactic family as `> Completed:` and `> Deferred to:`). Sits at the very top of the file, before any `<!-- opsx-ship: chunking -->` HTML comment. Counts are non-negative integers; the marker is the source of truth (no checkbox-counting heuristic).
- **`scripts/check-archive-followups.mjs` v2:** parse the new marker. When present, enforce `D ≤ C` (ratio invariant) AND audit that the declared `D` matches the actual count of `> Deferred to: #N` markers in the same file. When absent, fall back to the legacy absolute cap of 6 (current behavior, preserves backward-compat for pre-v2 archives).
- **Test suite extended** from 8 to 15 branches: 7 new tests for the v2 marker path (healthy ratio, overscoped ratio, declared/actual mismatch, malformed marker, zero-deferred + non-zero-completed, boundary D = C, and the legacy-cap-still-applies path with the new error message hint).
- **`SPEC_TEMPLATE.md` ¶7 + `AGENTS.md`** document the new marker shape, placement, and semantics. Existing ¶6 (`> Deferred to:` marker) unchanged.

## Capabilities

### Modified Capabilities

- `archive-followups-guard`: replaces the absolute-cap-only rule with a per-archive policy: ratio invariant when `> Tasks:` marker is present, legacy cap fallback when absent. The cap is no longer the primary contract — the ratio is. The cap stays as a backward-compat safety net until every archive carries the marker (a future PR may then remove the cap).

## Impact

- **Affected packages**: none of `packages/**`. Pure repo-tooling change.
- **Affected layers (hexagonal)**: none.
- **Public API**: no changes.
- **Persistence migration**: none. Existing archives stay marker-less and continue under the legacy cap; the new marker is opt-in for new archives going forward.
- **Dependencies**: no new runtime or dev dependencies.
- **Quality gates**: `pnpm lint:specs`, `pnpm lint:archive-followups`, and `pnpm test:scripts` all pass on the merged state.
- **Risk surface**: the v2 script has more branching logic. Mitigation: 15 co-located node:test cases cover ratio mode (6 branches) + legacy cap mode (8 branches) + the missing-tasks.md edge case.
- **Spec drift**: `archive-followups-guard` capability spec reflects the v2 contract. The archived `2026-05-03-repo-hygiene-tooling` change keeps its v1-cap requirements intact (frozen archive content); this change supersedes them in the live capability spec.

## Out of scope

- **Backfilling existing archives** with the `> Tasks:` marker. Existing archives stay under the legacy cap (which they already pass). The marker is opt-in for new archives. Backfill could be a future cleanup if metrics demand it.
- **Removing the absolute cap entirely.** The cap is still useful as a safety net for pre-v2 archives. Removal is gated on every archive carrying the marker — out of scope here.
- **Auto-generating the `> Tasks:` marker at archive time.** The `/opsx-archive` skill could compute counts from tasks.md state, but that's a skill update, not a script update. Out of scope here; the marker is author-written for now.
