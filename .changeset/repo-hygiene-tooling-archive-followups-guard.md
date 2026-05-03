---
---

chore(openspec): archive-followups marker + lint guard + calendar-redesign backfill

PR-2 of the `repo-hygiene-tooling` change. Adds the canonical `> Deferred to: #N` marker for deferred tasks in change `tasks.md`, a co-located node:test guard (`scripts/check-archive-followups.{mjs,test.mjs}`) that fails CI when an archived change carries ≥ ABSOLUTE_DEFERRAL_CAP deferral markers (initially 6; lowered to 5 by a same-day threshold-tuning follow-up PR), and a backfill of `2026-05-01-calendar-coaching-redesign/tasks.md` with 5 markers (one per follow-up issue #431–#435).

The lint script mirrors `scripts/check-archive-dates.mjs` exactly: same entry-point check, same exported `checkArchiveFollowups()` function, same violation-collection-then-exit pattern. Wired as a sibling `pnpm lint:archive-followups` in `package.json` (explicit `&&` chain in `lint` umbrella; husky pre-commit hook auto-picks it up via the same chain). Marker grammar documented in `openspec/SPEC_TEMPLATE.md` paragraph 6 and `AGENTS.md`.

Two archives that originally appeared in the proposal's backfill list (`2026-05-02-calendar-coaching-redesign-completion`, `2026-05-02-fix-coaching-dialog-rules-of-hooks`) get 0 markers: their follow-up issues were filed at archive-time per /opsx-ship convention but the originals have no `[ ]` task lines to annotate. Adding new tasks just to host markers would be scope rewriting, not annotation. Spec adjusted to capture this honestly.

Capability spec: `openspec/specs/archive-followups-guard` (added). No package version-bumps; the change is repo tooling.
