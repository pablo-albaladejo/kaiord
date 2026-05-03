> Synced: 2026-05-03 (2026-05-03-repo-hygiene-tooling)

# Archive Followups Guard

## Purpose

Prevents OpenSpec change archives from accumulating silent overscope debt by enforcing an absolute cap on `> Deferred to: #N` markers per archived `tasks.md` at lint time. The guard is mechanical (lint script + co-located node:test) per the project's `feedback_mechanical_over_ai` preference and runs as a sibling of `lint:archive` and `lint:archive-index`.

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

### Requirement: Archive-followups lint rule with absolute deferral cap

`scripts/check-archive-followups.mjs` SHALL walk `openspec/changes/archive/*/tasks.md`, count `> Deferred to: #N` markers per archive folder, and exit non-zero (`process.exit(1)`) when any single archive holds at least `ABSOLUTE_DEFERRAL_CAP` markers. The cap SHALL be exported from the script as a named constant so a future PR replacing the absolute cap with a deferral-ratio invariant has one obvious export to delete.

The script SHALL mirror the architectural pattern of `scripts/check-archive-dates.mjs`: identical entry-point check (`pathToFileURL(process.argv[1]) === import.meta.url`), exported `checkArchiveFollowups()` function returning a violation-collection structure, exit-with-code-after-collection pattern. Non-zero exits SHALL list the offending archive folder names and their marker counts.

The script SHALL be wired as a sibling lint script in `package.json`:

| Script                   | Behavior                                                 |
| ------------------------ | -------------------------------------------------------- |
| `lint:archive`           | Existing folder-vs-Completed invariant. Unchanged.       |
| `lint:archive-index`     | Existing `archive/README.md` index freshness. Unchanged. |
| `lint:archive-followups` | New. Runs `node scripts/check-archive-followups.mjs`.    |

The umbrella `pnpm lint` SHALL run all three. The husky `pre-commit` hook chain SHALL include `lint:archive-followups` so deferral-marker edits are caught locally before push.

`scripts/check-archive-followups.test.mjs` SHALL be a co-located node:test suite covering: zero-deferral archive (pass + silent), below-cap deferral archive (pass + log of count), at-or-above-cap archive (fail + non-zero exit), malformed-marker forms (fail + parse error naming the file). The test fixtures SHALL be created in temporary directories so the suite does not depend on the state of `openspec/changes/archive/`.

#### Scenario: Zero deferrals → silent pass

- **GIVEN** an archive folder whose `tasks.md` contains no `> Deferred to:` markers
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit zero; SHALL NOT log a count line for that archive

#### Scenario: Below-cap deferrals → logged pass

- **GIVEN** an archive folder whose `tasks.md` contains 4 `> Deferred to:` markers AND the cap is 6
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit zero; SHALL log "<archive-name>: 4 deferrals (cap 6)"

#### Scenario: At-or-above-cap deferrals → fail

- **GIVEN** an archive folder whose `tasks.md` contains 6 or more `> Deferred to:` markers AND the cap is 6
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit non-zero; SHALL list the offending archive folder name and its marker count in the error output

#### Scenario: Malformed marker fails the lint with a parse error

- **GIVEN** an archive folder whose `tasks.md` contains `> Deferred to: not-a-number` OR `> Deferred to: #0`
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit non-zero; SHALL include the file path and the offending line in the error output

### Requirement: v1 cap stays at 6; lowering blocked by immutable archives

The v1 cap SHALL ship at 6 and SHALL NOT be lowered to 5 even though the worst-observed archive (`2026-05-01-calendar-coaching-redesign`) holds exactly 5 deferral markers. Lowering would leave main permanently red because that archive is immutable — its deferral count cannot drop, and the lint would block every subsequent CI run.

The honest path to a meaningful first-fail signal that does NOT break main is one of:

| Option                                                                                                                                                                                                                             | Where tracked                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| (a) Replace the absolute cap with a deferral-ratio invariant ("deferrals MUST NOT exceed shipped tasks per archive") so healthy-but-large archives pass at any size; calendar-redesign at 5/many shipped tasks would pass on ratio | Issue #465 (architectural prerequisite: machine-readable `tasks.md` shape) |
| (b) Add an explicit grandfather allowlist for pre-existing overscoped archives so the cap can be lowered without tripping known-bad archives                                                                                       | Issue #465 (alternative path)                                              |

Until either path lands, the v1 cap remains at 6. A meaningful first-fail signal SHALL come naturally from a future archive that hits 6 or more deferral markers — at which point the offending change is genuinely overscoped and the lint correctly fails the archive PR.

#### Scenario: First-fail signal arrives from a future overscoped archive

- **GIVEN** the v1 cap is 6 and the calendar-redesign archive at 5 deferrals passes (grandfathered by virtue of being below the cap)
- **WHEN** any future archive lands with 6 or more `> Deferred to: #N` markers in its `tasks.md`
- **THEN** `pnpm lint:archive-followups` SHALL fail listing the offending archive — the intended first-fail signal that the change was overscoped at archive time

#### Scenario: Marker convention is annotation-only, not retroactive scope addition

- **GIVEN** an archived change whose proposal/design prose mentions a deferred follow-up but whose tasks.md has no corresponding `[ ]` task line
- **WHEN** a backfill is considered
- **THEN** the backfill SHALL NOT add a new task line just to host a marker; the deferral remains documented in proposal/design but does not contribute to the lint count

### Requirement: Sunset trigger for the v1 absolute-cap

The absolute-cap implementation (cap = 6 in v1) SHALL be replaced by either a deferral-ratio invariant or an explicit grandfather allowlist when EITHER condition holds:

| Trigger                                                                                                                           | Action                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| (a) A second archive hits the absolute cap                                                                                        | Open a PR replacing `ABSOLUTE_DEFERRAL_CAP` with a ratio invariant or allowlist; assign architecture ownership |
| (b) `tasks.md` gains a machine-readable shape that exposes completed-task counts (architectural prerequisite, tracked separately) | Open a PR replacing `ABSOLUTE_DEFERRAL_CAP` with a ratio invariant computed from the new shape                 |

Until either trigger fires, the absolute cap SHALL remain in force.

#### Scenario: Second archive trip causes cap-replacement PR

- **GIVEN** one archive has already tripped the cap (the archive that triggered the v1 → v2 conversation)
- **WHEN** a second archive trips the cap
- **THEN** the DRI SHALL open a PR replacing the absolute cap with the ratio invariant or grandfather allowlist; the PR description SHALL cite this scenario as the trigger
