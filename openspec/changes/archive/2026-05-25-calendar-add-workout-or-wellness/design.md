## Context

The predecessor change (`remove-subtabs-unify-calendar`) ships per-day wellness bands on the calendar (sleep/HRV/weight/steps badges, present-only, drill-down via `WELLNESS_BADGE_ROUTES`). The bands are read-only. There is no path to add wellness data from the calendar. Additionally, the `+` affordance is gated on `total === 0` (training bucket count), so it disappears on days that already have a workout.

This change removes the gate and adds a two-step add-entry chooser, a manual wellness entry form, and a write-path use case. The six decisions below were reached through the ralplan consensus cycle.

## Goals / Non-Goals

**Goals:**

- The `+` affordance renders on every calendar day, in both grid and list views, regardless of whether a workout is already present.
- Clicking `+` opens a two-step chooser: Workout → existing flow; Wellness → manual entry surface.
- The wellness entry surface accepts weight, sleep score, HRV, and steps (one form, one Save), plus an "Import a file" action for FIT health files.
- Saving a metric persists a schema-valid KRD record via the new use case; the live wellness query causes the badge to appear on the calendar automatically.
- For steps, saving preserves prior `activeCalories` / `intensityMinutes` from any existing daily row (merge-preserve).
- Exactly one record remains per date+metric after sequential saves (reuse-by-id upsert).

**Non-Goals:**

- No full-fidelity sleep/body-composition/stress manual editing — weight, sleep score, HRV (spot), and steps only.
- No retroactive change to imported-data semantics — the FIT import path is unchanged; imported records are file-dated and remain as-is (only the `id` is reused for upsert when a manual save follows an import).
- No new Dexie tables or schema migration; no `core`/adapter/MCP changes.
- No overwrite-confirm dialog (silent overwrite, chosen).
- No unit toggle for weight (kg assumed).
- No sidebar or replacement navigation chrome.

## Decisions

### 1. Chooser as a two-step dialog (Option C)

Three options were considered:

- **Option A — Single dialog** with Workout section and Wellness section side-by-side. Rejected: cluttered for the narrow-column case (140px); mixing distinct flows in one surface breaks the single-responsibility model.
- **Option B — Bottom-sheet / live-region announcer style.** Invalidated by the live-announcer churn introduced in Option B prototypes — switching from sheet-open to sheet-close triggered repeated announcements on NVDA/JAWS, producing a poor a11y experience. The chooser-as-dialog (Option C) lets Radix focus-trap manage the entire interaction with a single dialog lifecycle.
- **Option C (chosen) — Two-step Radix Dialog.** Step 1 is the chooser tile pair (Workout | Wellness). Choosing Workout closes the dialog and navigates; choosing Wellness replaces the dialog content with the `WellnessEntryDialog` for the clicked day. Each step has its own accessible name (`aria-label`). The browser back button closes without losing the calendar route because the dialog is controlled React state, not a router push.

### 2. Find-then-upsert + port-API divergence

**Port-API divergence:** No `find-by-[profileId+date]` method exists. Adding one would touch the Dexie adapter, the in-memory adapter, and all per-metric repos for zero functional gain — the existing `HealthRecordRepository.getByProfileAndDateRange(profileId, day, day)` already returns exactly that day's rows for a given metric table. Because **each metric lives in its own Dexie table** (`healthSleep`, `healthHrv`, `healthWeight`, `healthDaily` — `persistence-port.ts:78-83`), no `krd.kind` filter is needed. The use case selects the metric's table, calls `getByProfileAndDateRange(profileId, day, day)`, and reuses `rows[0]?.id`. No new port method is added.

**Concurrency note:** The use case alone cannot serialize the check-then-act race. The in-memory `transaction` is snapshot/restore with no mutual exclusion (`in-memory-persistence.ts:108-121`), so two concurrent calls for the same day+metric can both read zero rows and both insert — producing two rows. This is documented in Phase 1 as a passing assertion describing reality (the concurrent race inserts 2 rows). The row-count==1 guarantee is closed in Phase 2 at the form/hook layer: `use-save-wellness.ts` owns a single in-flight submit lock (`useRef` boolean + `isSaving` state); while one submit promise is pending, re-entrant calls are ignored and the Save button is disabled.

### 3. Minimal KRD payloads

Each metric's KRD payload is the smallest valid structure that passes `schema.parse`:

- **Sleep:** `{ startTime, endTime, totalDurationSeconds: 0, stages: [], score }`. `endTime` is required by `sleep.ts:34` and is set equal to `startTime` (0-duration, score-only entry). Manual sleep entry captures a score, not a duration; duration entry is a future additive follow-up.
- **Steps (DailyWellness):** merge-preserve. When a prior row exists, the mapper returns `{ ...prior, steps }` — overriding only `steps`, preserving `activeCalories`, `restingCalories`, `intensityMinutes`. When no prior row exists, the mapper zero-fills: `{ steps, activeCalories: 0, restingCalories: 0, intensityMinutes: { moderate: 0, vigorous: 0 } }`. This reconciles AC6 (one record, overwrite) with the Non-Goal (no retroactive change to imported calories/intensity).
- **HRV:** `measurementWindow: "spot"` — the only valid value for a manual spot reading.
- **Weight:** standard `WeightMeasurement` with `measuredAt` derived from `${day}T12:00:00.000Z`.

### 4. Import-date asymmetry

The "Import a file" action in the wellness entry surface reuses the existing FIT health-import path (`use-import-on-load.ts:42-54`), which ignores `?date=` and dates the imported record by the FIT file's own metadata. This is a deliberate asymmetry with the manual entry path (which uses the clicked day's date). Accordingly:

- The import action does NOT pass `?date=<clickedDay>` to the import flow.
- After import, the user lands on the corresponding Health Hub page (as driven by `health-destination.ts`), not on the calendar day's date.
- This asymmetry is documented in the "Manual wellness entry" spec scenarios so it is not read as a bug.

### 5. AC6 ↔ Non-Goal reconciliation (merge-preserve for steps)

AC6 requires that saving a metric leaves exactly one record for that date+metric (the prior record is replaced). The Non-Goal prohibits retroactive changes to imported-data semantics. For weight, sleep, and HRV these never conflict — the manual payload fully defines the metric. For **steps**, a full clobber would erase the imported daily row's `activeCalories` and `intensityMinutes` fields. The merge-preserve fork resolves the tension: the row's `id` is reused (one record, AC6 ✓) but only `steps` is overwritten (calories/intensity survive, Non-Goal ✓).

### 6. Open Questions

The following questions were identified during the ralplan consensus cycle and are either decided or deferred to implementation-time confirmation:

1. **Sleep manual entry default:** score (chosen) vs duration-hours. Duration entry is a future additive follow-up. Confirm product intent before Phase 2.
2. **Weight unit:** kg assumed. No profile unit preference is modeled today. Confirm no unit toggle is wanted in this change.
3. **Overwrite-confirm UX:** silent overwrite chosen for this change. A confirm dialog ("A sleep score already exists for this day — overwrite?") is a future additive follow-up.
4. **Wellness surface shape:** Option C (two-step dialog) recommended and chosen per Decision 1 above.

## Dependencies / Ordering

- **Must follow `remove-subtabs-unify-calendar`** in archive order — that change owns the "Calendar day cells surface per-day wellness" requirement this proposal modifies, and introduces the live wellness query and `WellnessBand` component that manual save leverages.
- No new Dexie schema version is needed (v16 tables suffice).
- Visual baselines will need regeneration in CI after Phase 3 (the `+` is now always visible, shifting calendar screenshots). Trigger `update-visual-baselines.yml` (Linux/chromium) as a CI step after PR-3 is up; do NOT regenerate locally.

## Risks

- **Concurrent submit duplication.** Mitigated by the single in-flight lock in `use-save-wellness.ts` (Phase 2). The use case's unlocked behavior is explicitly documented and tested in Phase 1 so the mitigation is not forgotten.
- **Steps merge-preserve complexity.** The mapper is a pure function exercised by the use-case tests; the merge logic is isolated and verifiable without UI.
- **`+` ungate visual regression.** The button now appears on busy days; DayColumn's vertical budget is fixed. Mitigation: the `+` button is compact; the wellness band (introduced by the predecessor) already occupied space.
- **Import-date asymmetry confusion.** Mitigated by the spec scenario and an optional in-dialog note that import is file-dated.
