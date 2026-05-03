> Synced: 2026-05-03 (tasks-machine-readable-shape)

# Archive Followups Guard

## Purpose

Prevents OpenSpec change archives from accumulating silent overscope debt by enforcing the deferral invariant `deferred ≤ completed` (ratio mode) on archives that carry a machine-readable `> Tasks:` marker, with a legacy absolute-cap fallback for pre-v2 archives. The guard is mechanical (lint script + co-located node:test) per the project's `feedback_mechanical_over_ai` preference and runs as a sibling of `lint:archive` and `lint:archive-index`.

## Requirements

### Requirement: Canonical `> Deferred to: #N` marker in archived `tasks.md`

A deferred task in an archived `openspec/changes/archive/<date>-<slug>/tasks.md` SHALL annotate its deferral with a Markdown blockquote as a sibling paragraph (blank line + 2-space indent — required so prettier does not collapse the marker onto the task line):

```text
- [ ] §N.M Task title

  > Deferred to: #ISSUE_NUMBER
```

`ISSUE_NUMBER` SHALL be a positive integer prefixed with `#` (zero is rejected). URLs, free-form descriptions, and multi-issue references on one line SHALL NOT be valid forms; a task deferred to multiple issues SHALL emit one marker line per issue.

The marker grammar SHALL belong to the same family as the existing `> Completed: YYYY-MM-DD` marker parsed by `scripts/check-archive-dates.mjs`. A single regex `^\s*> (Completed|Deferred to): (.+)$` SHALL distinguish the two marker types.

`openspec/SPEC_TEMPLATE.md` and `AGENTS.md` SHALL document the marker shape, valid forms, and placement under their authoring guidance. `pnpm lint:specs` SHALL continue to pass on these documentation updates.

#### Scenario: Single-issue deferral

- **WHEN** a task in `tasks.md` is checked but its scope was deferred to issue #432
- **THEN** the line immediately after the checkbox (with a blank-line separator and 2-space indent) SHALL read `> Deferred to: #432`

#### Scenario: Multi-issue deferral emits one marker per issue

- **WHEN** a task was split and deferred to issues #432 and #435
- **THEN** two marker lines SHALL appear after the checkbox: `> Deferred to: #432` and `> Deferred to: #435`

#### Scenario: Marker grammar is rejected for non-canonical forms

- **WHEN** a `tasks.md` contains `> Deferred to: https://github.com/owner/repo/issues/432` OR `> Deferred to: issue 432` OR `> Deferred to: #432, #435` OR `> Deferred to: #0`
- **THEN** `pnpm lint:archive-followups` SHALL fail with a parse error naming the offending file and line

### Requirement: Canonical `> Tasks:` marker for shipped/deferred counts

An archived `tasks.md` SHOULD carry a top-level `> Tasks:` marker as machine-readable data exposing the shipped vs. deferred counts. When present, the marker SHALL take the form `> Tasks: <C> completed, <D> deferred` as a single Markdown blockquote line at the very top of `tasks.md`, before any `<!-- opsx-ship: chunking -->` HTML comment and before any task-section H2 headers.

`<C>` and `<D>` SHALL be non-negative integers. The marker is the **source of truth** for the counts — the lint MUST NOT count `[x]` checkboxes (which conflate fully-shipped and partially-shipped tasks).

The marker SHALL belong to the same Markdown-blockquote family as `> Completed:` and `> Deferred to:`. Its presence SHALL opt the archive into ratio-based checking; its absence SHALL keep the archive under the legacy absolute-cap policy.

`openspec/SPEC_TEMPLATE.md` and `AGENTS.md` SHALL document this marker alongside the deferred-task marker, with placement guidance ("at the very top of tasks.md, before any opsx-ship chunking comment").

#### Scenario: Marker present, well-formed

- **GIVEN** an archive's `tasks.md` carries `> Tasks: 28 completed, 5 deferred`
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL log `<archive-name>: 5 deferred / 28 completed (ratio mode)` and apply the ratio invariant

#### Scenario: Marker malformed (non-numeric counts)

- **WHEN** an archive's `tasks.md` carries `> Tasks: ten completed, two deferred` OR `> Tasks: 5 deferred, 28 completed` (wrong order)
- **THEN** `pnpm lint:archive-followups` SHALL fail with a parse error naming the file and the offending line

### Requirement: Ratio invariant when `> Tasks:` marker is present

When an archive carries a well-formed `> Tasks: <C> completed, <D> deferred` marker, the script SHALL enforce two checks:

1. **Audit consistency:** `<D>` MUST equal the number of `> Deferred to: #N` markers in the same file. A mismatch SHALL fail the lint with a message naming the declared count vs. the actual count.
2. **Ratio invariant:** `<D>` MUST be ≤ `<C>`. A change that defers more tasks than it shipped is genuinely overscoped — the lint SHALL fail with a message naming both counts.

A healthy-but-large archive (e.g., 30 completed / 5 deferred) SHALL pass even when 5 ≥ ABSOLUTE_DEFERRAL_CAP — the ratio is the contract for marker-bearing archives, not the cap.

#### Scenario: Healthy ratio passes despite legacy cap

- **GIVEN** an archive carries `> Tasks: 30 completed, 7 deferred` and 7 corresponding `> Deferred to: #N` lines
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit zero (7 ≤ 30); the legacy cap SHALL NOT be applied

#### Scenario: Overscoped ratio fails

- **GIVEN** an archive carries `> Tasks: 2 completed, 5 deferred` and 5 corresponding `> Deferred to: #N` lines
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit non-zero with a message reading `5 deferred > 2 completed — change was overscoped`

#### Scenario: Declared/actual count mismatch fails

- **GIVEN** an archive carries `> Tasks: 10 completed, 3 deferred` but only 2 `> Deferred to: #N` lines exist in the file
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit non-zero with a message reading `marker declares 3 deferred but tasks.md contains 2 "> Deferred to:" line(s) — counts must agree`

#### Scenario: Boundary D = C is acceptable

- **GIVEN** `> Tasks: 3 completed, 3 deferred` and 3 deferred-to markers
- **WHEN** the lint runs
- **THEN** the lint SHALL pass — the invariant is `D ≤ C`, not `D < C`

### Requirement: Legacy absolute-cap fallback when `> Tasks:` marker is absent

When an archive's `tasks.md` does NOT carry a `> Tasks:` marker, the script SHALL fall back to the legacy absolute-cap policy: if the count of `> Deferred to: #N` markers is ≥ `ABSOLUTE_DEFERRAL_CAP` (currently 6), the lint SHALL fail. The fallback exists so pre-v2 archives that never carried the new marker continue to be policed against silent overscope.

The fail message in fallback mode SHALL hint at the upgrade path — i.e., advising the author to add `> Tasks: <C> completed, <D> deferred` to opt into the more-meaningful ratio check.

`ABSOLUTE_DEFERRAL_CAP` SHALL remain exported from `scripts/check-archive-followups.mjs` as a named constant. A future PR MAY remove the cap entirely once every archive in the tree carries a `> Tasks:` marker.

#### Scenario: Below-cap legacy archive (4 deferrals, no marker) passes with log

- **GIVEN** a `tasks.md` has 4 `> Deferred to:` markers and NO `> Tasks:` marker
- **WHEN** the lint runs
- **THEN** the script SHALL log `<archive>: 4 deferrals (legacy cap 6)` and exit zero

#### Scenario: At-cap legacy archive fails with marker hint

- **GIVEN** a `tasks.md` has 6 `> Deferred to:` markers and NO `> Tasks:` marker
- **WHEN** the lint runs
- **THEN** the script SHALL exit non-zero with a message including `(≥ cap 6)` AND a hint to add `> Tasks: <C> completed, <D> deferred` for ratio-based checking

### Requirement: Architectural mirror of `check-archive-dates.mjs`

The lint script SHALL mirror the architectural pattern of `scripts/check-archive-dates.mjs`: identical entry-point check (`pathToFileURL(process.argv[1]) === import.meta.url`), exported `checkArchiveFollowups()` function returning a violation-collection structure, exit-with-code-after-collection pattern. Non-zero exits SHALL list the offending archive folder names alongside their counts.

The script SHALL be wired as a sibling lint script in `package.json`:

| Script                   | Behavior                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `lint:archive`           | Existing folder-vs-Completed invariant. Unchanged.                                        |
| `lint:archive-index`     | Existing `archive/README.md` index freshness. Unchanged.                                  |
| `lint:archive-followups` | This. Runs `node scripts/check-archive-followups.mjs` (ratio + cap fallback per archive). |

The umbrella `pnpm lint` SHALL run all three. The husky `pre-commit` hook chain SHALL include `lint:archive-followups` so deferral-marker edits are caught locally before push.

`scripts/check-archive-followups.test.mjs` SHALL be a co-located node:test suite covering: zero-deferral archive (pass + silent), legacy below-cap archive (pass + log), legacy at-cap archive (fail + cap message + marker hint), legacy malformed deferred-to marker (fail + parse error), v2 healthy ratio (pass even when ≥ cap), v2 overscoped ratio (fail), v2 declared/actual mismatch (fail), v2 malformed `> Tasks:` marker (fail + parse error), v2 zero-deferred-non-zero-completed (pass), v2 boundary D = C (pass). Test fixtures SHALL be created in temporary directories so the suite does not depend on the state of `openspec/changes/archive/`.

#### Scenario: Suite covers both modes

- **WHEN** `pnpm test:scripts` runs
- **THEN** the `check-archive-followups.test.mjs` suite SHALL include at least 14 tests (the original 8 legacy-mode branches + 6 new ratio-mode branches)
