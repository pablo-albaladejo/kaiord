## ADDED Requirements

### Requirement: Canonical `> Deferred to: #N` marker in archived `tasks.md`

A deferred task in an archived `openspec/changes/archive/<date>-<slug>/tasks.md` SHALL annotate its deferral with a Markdown blockquote on the line immediately following the task's checkbox, in the exact form:

```
> Deferred to: #ISSUE_NUMBER
```

`ISSUE_NUMBER` SHALL be a positive integer prefixed with `#`. URLs, free-form descriptions, and multi-issue references SHALL NOT be valid forms; a task deferred to multiple issues SHALL emit one marker line per issue. The marker SHALL be a top-level blockquote at the same indentation as the parent checkbox; nested blockquotes SHALL NOT be parsed.

The marker grammar SHALL belong to the same family as the existing `> Completed: YYYY-MM-DD` marker parsed by `scripts/check-archive-dates.mjs`. A single regex `^> (Completed|Deferred to): (.+)$` SHALL distinguish the two marker types.

`openspec/SPEC_TEMPLATE.md` SHALL document the marker shape, valid forms, and placement under its "Authoring rules" section. `pnpm lint:specs` SHALL continue to pass on the template after the documentation update.

#### Scenario: Single-issue deferral

- **WHEN** a task in `tasks.md` is checked but its scope was deferred to issue #432
- **THEN** the line immediately after the checkbox SHALL read `> Deferred to: #432`

#### Scenario: Multi-issue deferral emits one marker per issue

- **WHEN** a task was split and deferred to issues #432 and #435
- **THEN** two lines SHALL appear after the checkbox: `> Deferred to: #432` and `> Deferred to: #435`

#### Scenario: Marker grammar is rejected for non-canonical forms

- **WHEN** a `tasks.md` contains `> Deferred to: https://github.com/owner/repo/issues/432` OR `> Deferred to: issue 432` OR `> Deferred to: #432, #435`
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

`scripts/check-archive-followups.test.mjs` SHALL be a co-located node:test suite covering: zero-deferral archive (pass + silent), 4-deferral archive (pass + log of count), threshold-tripping archive (fail + non-zero exit), malformed-marker (fail + parse error naming the file), marker-without-issue-number (fail + parse error). The test fixtures SHALL be created in temporary directories so the suite does not depend on the state of `openspec/changes/archive/`.

#### Scenario: Zero deferrals → silent pass

- **GIVEN** an archive folder whose `tasks.md` contains no `> Deferred to:` markers
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit zero; SHALL NOT log a count line for that archive

#### Scenario: Below-cap deferrals → logged pass

- **GIVEN** an archive folder whose `tasks.md` contains 4 `> Deferred to:` markers AND the cap is 5
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit zero; SHALL log "<archive-name>: 4 deferrals (cap 5)"

#### Scenario: At-or-above-cap deferrals → fail

- **GIVEN** an archive folder whose `tasks.md` contains 5 or more `> Deferred to:` markers AND the cap is 5
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit non-zero; SHALL list the offending archive folder name and its marker count in the error output

#### Scenario: Malformed marker fails the lint with a parse error

- **GIVEN** an archive folder whose `tasks.md` contains `> Deferred to: not-a-number`
- **WHEN** `pnpm lint:archive-followups` runs
- **THEN** the script SHALL exit non-zero; SHALL include the file path and the offending line in the error output

### Requirement: Backfill of historical archives at Phase 2 ship-time

Phase 2 SHALL backfill `> Deferred to: #N` markers into archived `tasks.md` files where annotatable deferred tasks already exist. The backfill diff SHALL be marker-only — no checkbox flips, no text edits, no new tasks added, no `> Completed:` line touches.

The marker convention annotates a SPECIFIC task that was deferred in the original change. Where a follow-up issue exists but the original tasks.md has no corresponding deferred-task line (e.g., the deferral was captured only in proposal/design prose), the marker SHALL NOT be retroactively forced — adding new task lines would constitute scope rewriting, which D7's "inert annotation" defense does not cover.

For the v1 backfill at Phase 2 ship-time, this means:

| Archive                                            | Markers added                                      | Reason                                                                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-05-01-calendar-coaching-redesign`            | `#431`, `#432`, `#433`, `#434`, `#435` (5 markers) | Original tasks.md has 5 deferred sub-task entry-points (§8.5 → #431, §9.1 → #432, §10.3 → #433, §11.1 → #434, §12.4a → #435); markers attach to those existing lines without adding new tasks. |
| `2026-05-02-calendar-coaching-redesign-completion` | 0 markers                                          | The spec-sync deferral (#460) was captured in proposal.md / design.md only; no annotatable task line.                                                                                          |
| `2026-05-02-fix-coaching-dialog-rules-of-hooks`    | 0 markers                                          | The 3 follow-up issues (#450, #451, #454) were filed at archive-time per /opsx-ship convention but no tasks.md `[ ]` lines correspond.                                                         |

Backfill SHALL be permitted because the markers are inert annotations — they reference issues already created and known, do not modify behavior, do not add scope, and do not touch the `> Completed:` invariant enforced by `check-archive-dates.mjs`. The "archived = frozen" intuition applies to historical content; cross-references to known issues on EXISTING task lines are annotation, not rewriting.

After backfill, the `2026-05-01-calendar-coaching-redesign` archive holds 5 deferral markers. With the v1 cap shipped at 6 (per `tasks.md` §4.7 strategy (a)), the lint passes on first run and a follow-up PR lowers the cap to 5 to convert the 5-deferral signal into a fail.

#### Scenario: Backfill is committed in the same PR as the lint script

- **WHEN** Phase 2's PR opens
- **THEN** the diff SHALL include `scripts/check-archive-followups.{mjs,test.mjs}`, `openspec/SPEC_TEMPLATE.md`, `AGENTS.md`, `package.json`, AND the backfilled `tasks.md` of `2026-05-01-calendar-coaching-redesign` in a single coherent commit graph; CI SHALL never observe a state where the script lands without the backfill or vice versa

#### Scenario: First-fail signal calibrated via threshold-lowering follow-up

- **GIVEN** Phase 2 has been merged with cap = 6 (calendar-redesign archive at 5 deferrals passes)
- **WHEN** the threshold-lowering follow-up PR sets `ABSOLUTE_DEFERRAL_CAP = 5`
- **THEN** `pnpm lint:archive-followups` SHALL fail listing `2026-05-01-calendar-coaching-redesign: 5 deferrals (≥ cap 5)` — the intended first-fail signal that the offending archive was overscoped at archive-time

#### Scenario: Marker convention is annotation-only, not retroactive scope addition

- **GIVEN** an archived change whose proposal/design prose mentions a deferred follow-up but whose tasks.md has no corresponding `[ ]` task line
- **WHEN** Phase 2's backfill runs
- **THEN** the backfill SHALL NOT add a new task line just to host a marker; the deferral remains documented in proposal/design but does not contribute to the lint count

### Requirement: Sunset trigger for the v1 absolute-cap

The absolute-cap implementation (initially 6, lowered to 5 by the threshold-tuning follow-up PR) SHALL be replaced by a deferral-ratio invariant ("deferrals MUST NOT exceed shipped tasks per archive") when EITHER condition holds:

| Trigger                                                                                                                           | Action                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| (a) A third archive trips the absolute cap                                                                                        | Open a PR replacing `ABSOLUTE_DEFERRAL_CAP` with a ratio invariant; assign architecture ownership |
| (b) `tasks.md` gains a machine-readable shape that exposes completed-task counts (architectural prerequisite, tracked separately) | Open a PR replacing `ABSOLUTE_DEFERRAL_CAP` with a ratio invariant computed from the new shape    |

A follow-up issue SHALL be filed at Phase 2 ship-time titled `chore(openspec): add machine-readable shape to tasks.md for archive-followups ratio invariant`, cross-referencing this requirement.

Until either trigger fires, the absolute cap SHALL remain in force. False-positives on healthy-but-large archives are acceptable for the v1 window and resolved by per-PR threshold-tuning, not by silently raising the cap.

#### Scenario: Third archive trip causes ratio-replacement PR

- **GIVEN** the first two archive trips of `ABSOLUTE_DEFERRAL_CAP` have already been recorded (calendar-redesign + one future archive)
- **WHEN** a third archive trips the cap
- **THEN** the DRI SHALL open a PR replacing the absolute cap with the deferral-ratio invariant; the PR description SHALL cite this scenario as the trigger
