# @kaiord/workout-spa-editor

## 1.1.0

### Minor Changes

- 3bdc512: Daily WeekStrip shows per-day presence + intensity; Planned entries open in place

  The Daily page's WeekStrip no longer shows a flat workout-only load bar (which
  rendered an identical dash on coaching-only days). Each day now shows a
  presence + coarse intensity mark across all sources (workouts, coaching, matched
  sessions): an empty day is a faint hairline; a day with entries shows an
  intensity-tinted dot (filled for measured TSS, outline for estimated coaching
  effort) plus a count when 2+ entries; the real today is marked with a circled
  day number. Tapping a "Planned" entry now opens it in place — a coaching
  activity opens its dialog, a ready workout opens the editor, a raw/skipped
  workout opens its process dialog — instead of bouncing to the calendar.

- 4ceb995: Coaching "Edit manually" defers persistence until Save (+ AI sport fix + junk cleanup)

  Clicking "Edit manually" on a coaching activity no longer eagerly persists a
  workout: it opens a store-only draft editor (`/workout/new?coaching=…`, mirroring
  the scratch flow) and the workout + its SessionMatch are written only on an
  explicit Save. Leaving without saving persists nothing. If a workout already
  exists for the activity, the existing one opens instead (idempotency).

  Also: the AI "expand with AI" path now resolves the Train2Go sport before
  prompting the model and force-sets the resolved sport/subSport, so both
  `record.sport` and the KRD sport carry the real sport (cycling/training/…) instead
  of collapsing to `generic`. The shared builder now sets `record.sport` from the
  resolved sport for the manual path too.

  A one-time, guarded maintenance pass removes the untouched 1-step template
  workouts (and their orphaned session matches) left behind by earlier eager
  "Edit manually" clicks, matched by step shape + `modifiedAt===null` +
  `createdAt===updatedAt` so no user-edited workout is ever removed.

- 58fd318: feat(spa-editor): cross-device sync via the user's own Google Drive

  Adds optional cross-device synchronization of the editor's local data
  (workouts, templates, profiles, coaching, health, AI providers) through the
  user's own Google Drive `appDataFolder` — no backend, free, and the data stays
  owned by the user. Connect a Google account from Settings → Google Drive sync.
  - A whole-database snapshot is stored as a single `kaiord-snapshot.json` in the
    hidden, app-scoped `appDataFolder`; Drive's native file revisions are a free
    backup. Local snapshot export/import also enables on-device backup/restore.
  - `CloudSyncPort` + a `fetch`-based Google Drive adapter (Google Identity
    Services OAuth, `drive.appdata` scope, no Google SDK dependency); auth + I/O
    only, no merge logic.
  - Conflict resolution is last-write-wins per record (`updatedAt`/`createdAt`),
    timestampless tables by snapshot time, with tombstones so deletions propagate
    and a Dexie v19 `tombstones` table; optimistic concurrency on `headRevisionId`.
  - Hybrid triggers: pull-merge on app open, debounced auto-push on any change
    (create, delete, or in-place edit), and a manual "Sync now".
  - Optional end-to-end encryption (off by default): a passphrase encrypts the
    snapshot with AES-256-GCM before upload, with a one-time warning that AI API
    keys are uploaded in cleartext when encryption is off.

- e4b55a9: Rename the Today page to Daily, with unlimited cross-week navigation

  The movable-focus dashboard is now "Daily" at `/daily` (the old `/today`
  redirects to `/daily`, preserving `?date=`, and the `?from=today` back-origin
  is still accepted). The focus day can now navigate across weeks in both
  directions without limit — the previous/next day arrows shift the WeekStrip to
  the adjacent week instead of stopping at the week edge (which previously left no
  way to go back when today was a Monday). The real-today marker shows only when
  the real today is in the visible week; "Back to Today" remains the way to jump
  to the literal today.

- dac5c6d: Today's focused day is now movable

  The Today page's focused day can move within the visible week — tap a day in
  the WeekStrip or use the prev/next day arrows. The focused day lives in the URL
  (`/today?date=YYYY-MM-DD`), so it is deep-linkable, back-recoverable, and
  shareable; the whole dashboard (readiness, planned sessions, header) follows the
  focused day. The header shows "Today" with no reset when focus is the real
  today, otherwise the focused weekday plus a "Back to Today" control. The
  WeekStrip keeps a dedicated "open in calendar" control and marks the real today
  distinctly from the focus cursor. Focus is bounded to the visible week and the
  `?date=` param is clamped (malformed/out-of-week falls back to today).

- 2678d66: Widen the KRD sport vocabulary to the full Garmin FIT taxonomy

  The KRD domain `sport` enum is widened from 4 values (cycling/running/swimming/
  generic) to the full FIT `Sport` taxonomy (snake_case), so workouts can carry
  their real sport (training, rowing, hiking, tennis, cross-country skiing, …)
  instead of collapsing to `generic`. The change is additive — every prior value
  stays valid.
  - **core**: full FIT-anchored `sportSchema` + a new `sportCategory()` classifier
    (cycling/running/swimming/other) that drives all capability-dependent logic.
  - **fit**: bidirectional camelCase↔snake_case sport mapper wired into the
    metadata/session/lap read+write paths, so multi-word sports encode without
    throwing and decode without falling back to cycling.
  - **tcx/zwo**: lossy-format sport collapse now derives from `sportCategory()`
    (TCX → Running/Biking/Other; ZWO → bike/run) instead of exhaustive tables, so
    growing the vocabulary never breaks these adapters.
  - **workout-spa-editor**: coaching activities map onto a real (sport, subSport)
    pair (e.g. Stretching → training/flexibility_training, Gym →
    training/strength_training, Rowing → rowing/indoor_rowing); the editor heading
    shows the humanized sport. Non-endurance sports behave like `generic` for zones.

### Patch Changes

- 0c04c3a: Recover automatically from stale lazy chunks after a deploy

  When a new build ships, the hashed lazy route chunks change; a browser tab still
  running the previous `index` fails to import the old chunk ("Failed to fetch
  dynamically imported module") and lands on the route error screen. The app now
  reloads once to pull the fresh build — both on Vite's `vite:preloadError` event
  and when the failure surfaces through the route error boundary — guarded by a
  sessionStorage cooldown so a genuinely-unfetchable chunk never causes a reload loop.

- 3d6a7ef: Coaching-derived workouts now keep their title and sport

  When a coaching activity was materialised into a structured workout (manual
  "create from coaching" path), the generated KRD carried neither the activity's
  title nor its sport: the editor showed "Untitled Workout" and "Sport: generic".
  The template builder now seeds the KRD workout name from the coaching activity
  title and canonicalizes the source sport onto the KRD vocabulary (e.g.
  `bike` → `cycling`, `swim` → `swimming`). Sports the KRD model does not
  represent (e.g. gym/strength) still collapse to `generic` honestly.

- 6538e8a: Create flows always persist and land on the calendar

  The scratch editor's "Save & schedule" control now renders on every entry —
  entered without a date it schedules onto today instead of leaving file export
  as the only "save". After saving, both the scratch and AI create flows land on
  the calendar week containing the saved workout (`/calendar/:weekId`) so the
  new card is visible on arrival, replacing the previous `/workout/:id` and
  dated-picker landings. The week resolution uses a local-midnight date anchor,
  fixing a latent week-shift for far-east timezones at week boundaries (the
  Today week strip now shares the same helper).

- 7a94435: The default view is the calendar

  Opening the app (`/`), unknown routes, the header logo, undated create
  close, and unknown back-origins now land on the current week's calendar
  grid instead of the Today dashboard. Today remains available at `/today`
  via its nav tab and header entry; explicit "Go to Today" links keep
  pointing there. The route announcer reads "/" as "Calendar page" and the
  Calendar nav entry is active on the index route.

- 29a5a7a: Navigation consistency overhaul

  A single pass that makes in-app navigation predictable end to end. Create flows entered from a calendar day now schedule the workout onto **that** day (AI, scratch and import alike) instead of silently defaulting to today, and the scratch surface persists to the calendar rather than only exporting a file. The Athlete "Create profile" empty state opens the profile dialog in place instead of bouncing through a dead `/settings/profile` redirect, and the header "Settings" entry now opens the settings index (matching the mobile tab) rather than jumping into the AI sub-tab. Back/close actions are origin-aware via a shared `?from=` contract, so leaving the editor, a workout, or a detail view returns to where the user came from instead of a hardcoded default. Today gains a tappable week strip and a "Trends →" card; the desktop header gains active-state/`aria-current` and an Athlete entry; settings-index rows deep-link to and focus the named section. Accessibility is tightened too: route-announcer labels are corrected (Athlete and the read-only workout view no longer announce as "Calendar"/"Edit"), and every route renders a stable, focusable heading from first paint. Dead, route-unmounted picker code is removed.

- 296874d: Today's planned section mirrors the calendar

  The Today page's planned section now shows the same entries the calendar shows
  for today — coaching activities, matched sessions, and workouts (including
  KRD-less coaching-derived ones) — instead of "Nothing planned today" whenever
  the day's activities were coaching-only. It reuses the calendar's
  `buildCalendarBuckets` (week-scoped, deduped) and card rendering, so the two
  surfaces stay consistent by construction. WeekStrip load-bar parity for
  coaching-only days is tracked as a follow-up.

- d40c4ab: One URL family, one view: Today moves to /today, /calendar is the week grid

  The Today dashboard now lives at `/today` (the app home — `/` redirects
  there), and bare `/calendar` redirects in one hop to the current week's
  grid, so every `/calendar*` URL renders the same week view with
  week-scoped data (TrainingPeaks-style). Navigation gains a Calendar entry
  (mobile bottom-nav: Today · Calendar · Library · Athlete, with Settings
  now header-only) and the `?from=` back contract carries the originating
  `week`, so leaving a workout opened from another week returns to that
  week's grid. Scheduling a template from the library now lands on the
  scheduled week instead of the calendar home.

- Updated dependencies [45a788a]
- Updated dependencies [2678d66]
  - @kaiord/core@9.1.0
  - @kaiord/fit@9.1.0
  - @kaiord/zwo@9.1.0
  - @kaiord/garmin@9.1.0
  - @kaiord/tcx@9.1.0

## 1.0.0

### Major Changes

- a015501: KRD v2.0 — adds six health metrics (sleep, weight, HRV, daily wellness, body composition, stress) as first-class KRD types with bidirectional FIT adapter support.
  - **@kaiord/core**: new health sub-schemas (`sleepRecordSchema`, `weightMeasurementSchema`, `hrvSummarySchema`, `dailyWellnessSchema`, `bodyCompositionSchema`, `stressEpisodeSchema`); six new KRD `type` enum values (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`); health sub-schemas enforce `version` ∈ `2.x` (root `krdSchema.version` remains `\d+\.\d+`).
  - **@kaiord/fit**: bidirectional converters for the six health metrics; seven new FIT message numbers registered (`WEIGHT_SCALE`, `MONITORING`, `MONITORING_INFO`, `SLEEP_LEVEL`, `HRV_STATUS_SUMMARY`, `HRV_VALUE`, `STRESS_LEVEL`, `BODY_COMPOSITION`); round-trip tests for sleep / weight / HRV / daily / stress against real Garmin fixtures (`test-fixtures/fit/`).
  - **@kaiord/tcx, @kaiord/zwo, @kaiord/garmin**: workout-only writers now throw `UnsupportedKrdTypeError` when fed a health KRD instead of silently discarding it. **Breaking** for callers that fed unsupported KRDs to these writers.
  - **@kaiord/mcp**: five new tools — `kaiord_get_health_summary`, `kaiord_get_sleep_history`, `kaiord_get_weight_history`, `kaiord_get_hrv_history`, `kaiord_get_recovery_status` — stateless, file-array input, parse FIT health files via the standard pipeline.
  - **@kaiord/workout-spa-editor**: Dexie v16 with six health repositories (`healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`); Health Hub routes under `/health/*`; FIT health files now route to the health pipeline instead of being ignored.

### Minor Changes

- 92b50eb: Calendar `+` now disambiguates adding a workout vs a wellness metric. The per-day `+` affordance renders on every day (grid and list views, no longer gated to empty training days) and opens a Workout | Wellness chooser. Workout preserves the existing `/workout/new?date=` flow; Wellness opens a manual-entry form (weight, sleep score, HRV, steps) plus a file-dated FIT import option. Manual entries persist via a new application use case that upserts one record per day per metric (reusing the existing `[profileId+date]` row id); a manual steps save merge-preserves any prior imported calories/intensity and overrides only the step count. Drag-to-reschedule is unaffected by the always-visible `+`.
- f3cb525: Add in-app back navigation across the create-workout flow. `EditorPageHeader` accepts a new optional `onBack` prop that renders a shared `BackButton` atom; `EditorPage` wires it via `useBackHandler`, which preserves `?date=` on scratch/import and reuses the existing discard confirmation modal when `currentWorkout.steps.length > 0`. `NewWorkoutPicker` gains its own back button that navigates to `/calendar`.
- 4d183e3: Health trends hub: replace the N-independent-chart grid at `/editor/health` with one composite widget of vertically-stacked panes (one per selected metric). Cursor and zoom are synchronized across all panes via `uPlot.sync` so the user perceives "una sola gráfica" while each metric keeps its native Y axis and unit. Each pane shows uPlot's built-in `legend.live` value at the cursor position. Empty panes (selected metric with no data in the active range) render an English placeholder. Panes are user-reorderable by dragging the header (reuses `@dnd-kit/sortable` via the existing `useDndCardWrapper` precedent). The 30/90/365 day range selector and the metric toggle pills are unchanged.

  Implementation follows the consensus plan at `.omc/plans/ralplan-health-trends-overlay-single-chart.md` (Planner/Architect/Critic APPROVE iter 2) with the visual-tightness contract: shared X-axis ticks across panes, ≤8 px inter-pane gap, no per-pane border (only the outer card border). The five superseded files (`TrendChartsGrid`, `TrendMetricChart`, `trend-chart-options`, and their tests) are removed.

- 275c221: feat(core): introduce MANAGED_DATA_REGISTRY single-source-of-truth for kaiord-managed data kinds; add deterministic external-id hash projection; tighten ManualHealthMetric and HealthKrdType to derive from ManagedDataType.

  Foundational for the integration-policy-per-profile-routing feature (PR 1 of 7). No runtime behavior change yet — subsequent PRs wire policy resolution, Dexie migration, and the Data Flows UI on top of this registry.

- d1ab0aa: feat(spa-editor): Data Flows section in ProfileManager

  Adds the user-facing Data Flows configuration UI under ProfileManager.
  Grouped by managed data type (9 groups), each with Sources / Destinations
  subsections, [+ Add] affordances filtered by bridge capability tokens, and
  per-row mode + enabled controls. Zero-state banner when no policies exist.
  N-bridge ready: each subsection accepts arbitrarily many policy rows.

  PR 6 of 7.

- ab11c69: feat(spa-editor): Dexie v17 — integrationPolicies + exportLedger stores; health provenance + syncZones-to-IntegrationPolicy backfill

  Bumps Dexie schema to v17. Adds the integrationPolicies and exportLedger
  stores, alters all six health stores with a [profileId+sourceBridgeId+externalId]
  unique compound index, and runs an idempotent chunked backfill that stamps
  sourceBridgeId='manual' + a deterministic externalId on every legacy health row.
  A second backfill walks linkedAccounts and creates an IntegrationPolicy
  (dataType='training-zones', mode='auto', enabled=true) for every profile that
  had syncZones=true. The syncZones column is retained nullable as a rollback
  buffer until v18 (F-4).

  QuotaExceededError on Safari/Firefox mid-chunk surfaces via the injected error
  callback and leaves the partial backfill in place; per-row writes are
  idempotent on retry. Export ledger cascades on health/workout record deletion;
  an orphan sweep is available for new-machine disaster recovery.

  PR 3 of 7 implementing integration-policy-per-profile-routing.

- d597cb4: feat(core,spa): domain provenance fields + IntegrationPolicy/ExportLedger schemas

  Adds kaiordRecordId, sourceBridgeId, externalId as optional fields to the six health Zod schemas (sleep, weight, hrv, daily, body-composition, stress); introduces deriveExternalId mapper in @kaiord/core/ingest; adds IntegrationPolicy + ExportLedgerEntry Zod schemas in @kaiord/workout-spa-editor; removes syncZones from linkedCoachingAccountSchema (Zod only — Dexie column retained as rollback buffer until v18).

  PR 2 of 7 implementing integration-policy-per-profile-routing.

- 0d325da: feat(spa-editor): resolver re-wiring — GarminPushButton, Train2Go zones, save-workout export trigger

  GarminPushButton is now gated on resolveExportPolicies(profileId, 'workout')
  instead of `extensionInstalled` alone. use-train2go-supports-zones.ts is
  deleted; callers consult resolveImportPolicies(profileId, 'training-zones').
  A regression test asserts the hook stays gone. A save-workout export trigger
  listens for entitySaved events and fires recordExport for every enabled
  mode='auto' export policy. Removes the transitional `as unknown as`
  LinkedCoachingAccount casts from PR 2 and the deprecated SyncZonesToggle UI
  (PR 6 introduces the Data Flows section as the replacement).

  PR 5 of 7.

- 2b1e93a: feat(spa-editor): integration-policy use cases + idempotent export ledger

  Adds resolveImportPolicies / resolveExportPolicies / upsertIntegrationPolicy /
  deleteIntegrationPolicy use cases. Adds upsertImportedRecord (natural-key
  upsert against [profileId+sourceBridgeId+externalId]) and recordExport with
  the insert-pending → POST → UPDATE protocol that closes the concurrent-
  trigger race (unique constraint on [kaiordRecordId+destinationBridgeId]
  gates the duplicate POST before the network call). Includes the AC-9
  weight-export-aggregation integration test.

  PR 4 of 7. Use cases are present but not yet wired into UI (PR 5/PR 6).

- 129cc2d: feat(spa-editor): integration-policy verification — Playwright e2e, additivity tests, analytics-port events

  Adds end-to-end coverage for the integration-policy-per-profile-routing
  feature: Playwright specs for the Data Flows density baseline, the
  Garmin push-via-policy happy path, and the Train2Go zones-via-policy
  auto-import. Two additivity tests (existing token, new token) prove
  AC-10. Analytics-port events fire on policy toggle, import complete,
  and export complete; ledger-size gauge captures growth. tasks.md
  reflects the completed scope.

  PR 7 of 7 (terminal). Closes integration-policy-per-profile-routing.

- 82f2e80: Unify training and wellness in the calendar (TrainingPeaks model). Removes the Training/Health/Settings primary tab bar (`PrimaryNav`) — the header already exposes Calendar/Library/New/Settings, and a new "Trends" header entry opens the wellness hub. Each calendar day cell now shows a muted per-day wellness band (sleep, HRV, weight, steps) read via a single per-week live query, visually distinct from training cards; each badge drills down to its per-metric page. The Health dashboard is rebuilt into a uPlot-backed trends hub with metric multi-select and 30/90/365-day range selection (lazy-loaded, code-split off the calendar bundle). The four per-metric health pages are retained as drill-down detail.
- 5d7897b: Trends Hub now renders a single uPlot canvas with N native-unit Y axes packed on the right edge, replacing the stacked-panes architecture (the just-merged PRs #687 + #689). Lines accumulate on the same canvas as metrics are toggled; native units preserved per metric; no drag-to-reorder; no multi-instance sync. Uniform stroke `#2563eb` — line discrimination by axis label + legend label. Mobile layout accepted cramped at N=4. See `openspec/changes/single-canvas-trends-overlay/`.
- b5fb373: feat(spa-editor): mobile-first redesign — Athlete, AI-first Create, Today, Workout Detail, Library, Settings, bottom nav

  A ground-up mobile redesign of the editor app, built on the existing dark-slate and sky design system with a new 5-zone training color ramp (`--zone-1..5`).
  - **Athlete** (`/athlete`): Profile is promoted out of Settings into a single top-level page — identity, a sport selector that recomputes thresholds plus a derived 5-zone map, and a **Connections** section that merges Linked Accounts with Data Flows into human per-connection sync toggles backed by live integration policies. `/settings/profile` redirects to `/athlete`.
  - **Create**: an AI-first "New session" overlay (input → generating → review) that generates a workout via the configured AI provider with the active sport's zones injected, then Save and push persists it and pushes to Garmin.
  - **Today** (`/calendar`): a morning landing with a readiness card (HRV/sleep from the health stores, graceful empty states), a week-load strip, and a planned-session card. The full week calendar stays at `/calendar/:weekId`.
  - **Workout Detail** (`/workout/view/:id`) with a one-tap 3-state Push button.
  - **Library**: reskinned to a mobile card list with search and sport filters.
  - **Settings**: flattened into a grouped iOS-style list.
  - **Navigation**: a responsive floating bottom nav and center FAB on mobile; the desktop chrome is unchanged.

  New design-system atoms (Toggle, Segmented, Pill), viz primitives (ZoneMap, ZoneDist, ReadinessRing, AvatarRing, StepList, SummaryStrip, Metric, SectionHead), and derivation libs (`lib/athlete`, `lib/workout-review`).

### Patch Changes

- 82a7467: fix(core): make `canonicalHash` isomorphic (sync SHA-256, no `node:crypto`)

  `canonicalHash` used `node:crypto`'s `createHash`, which the build emitted as a
  bare `import { createHash } from "crypto"`. In the browser bundle `createHash`
  resolved to `undefined`, so any browser code path that hashed an export payload
  (the integration-policy export/push ledger via `computeExportHash`) crashed, and
  Vite's dev server crashed the whole SPA at module-eval.

  Switch to a sync, isomorphic SHA-256 (`@noble/hashes`). The UTF-8 bytes hashed
  and the hex digest are byte-for-byte identical to the previous implementation —
  verified against `node:crypto` in a test — so persisted external-ids stay
  stable. This removes the dev-only `crypto` stub workaround in the editor's Vite
  config.

- 5795229: fix(spa-editor): Data Flows zero-state no longer dead-ends a fresh profile

  The "Data Flows" tab keyed its zero-state banner on whether any
  IntegrationPolicy already existed, so a profile with a connected bridge but
  no policies showed "Connect a bridge to start syncing data with kaiord" and
  rendered no groups — leaving the "+ Add source/destination" buttons (the only
  way to create the first policy) unreachable. The banner is now keyed on bridge
  presence: groups render as soon as a bridge is discovered, and the banner only
  appears when no bridge is connected.

- fccae34: Gate Train2Go zones auto-import on the IntegrationPolicy, not link presence.

  Completes the syncZones → IntegrationPolicy migration that PR #705 left half-wired:
  - `shouldFanOutZones` now requires an enabled auto-import `(training-zones, import, mode: auto)` policy in addition to a linked account, instead of firing on link presence alone.
  - Adds the SPA-mount import lifecycle (`useZonesAutoImportOnMount` in `Train2GoZonesSyncProvider`) so a migrated profile auto-fetches zones once per mount when the policy is present (spec `spa-train2go-extension` §"Zone auto-import gated on IntegrationPolicy").
  - Exposes `integrationPolicy` on `PersistencePort` (Dexie + in-memory adapters).
  - Reconciles the `zones-sync` / `train2go-zones-via-policy` e2e specs to seed the policy, and updates the fan-out unit tests to the policy contract.

- Updated dependencies [a015501]
- Updated dependencies [82a7467]
- Updated dependencies [275c221]
- Updated dependencies [d597cb4]
  - @kaiord/core@9.0.0
  - @kaiord/fit@9.0.0
  - @kaiord/tcx@9.0.0
  - @kaiord/zwo@9.0.0
  - @kaiord/garmin@9.0.0
  - @kaiord/ai@9.0.0

## 0.6.0

### Minor Changes

- d8ad94f: refactor: drop the welcome scaffold on `/workout/new?source=scratch` and `/workout/new?action=import`. Scratch lands directly on the editor canvas (collapsed AI banner + WorkoutHeader auto-opened in metadata-edit mode + empty steps list with `+ Add first step`). Import opens a dedicated dropzone overlay that auto-triggers the OS file picker on mount. The picker (`NewWorkoutPicker`) is now the single first-touch decision surface; in-editor onboarding (`Getting Started`, `Or create manually / import a file`) is gone.
- 72872ff: feat(spa-editor): library page short-circuits scheduling when entered with `?source=template-picker&date=YYYY-MM-DD`. Clicking a template card now dispatches `scheduleTemplate` directly with the URL's date and navigates to `/calendar`, instead of opening `ScheduleDateDialog`. Invalid or absent `?date=`, or a different `?source=`, keeps the existing explicit-dialog flow. Implementation reuses `usePickerSchedule` (PR #650) via a new `useLibrarySchedule` hook so the library schedule call site stays a single line.
- 6797048: refactor: unify calendar empty-day "+" entry through `NewWorkoutPicker`. Clicking "+" now navigates to `/workout/new?date=Y-M-D` (instead of opening `EmptyDayDialog`); the picker reads `?date=`, shows a date-aware heading, and propagates the date through all three tiles (Scratch, Import, Template). The Template tile mounts `TemplatePickerDialog` inline when a date is present so one-click scheduling is preserved. Imports on a dated picker auto-tag the persisted `WorkoutRecord.date` and route to `/workout/:id`; header-entry imports keep the prior non-persisting behaviour. `RawWorkoutContent`'s "Create manually" button is renamed to "Create workout" and routes through the picker (`/workout/new?date=…`). `EmptyDayDialog`, `EmptyDayChoices`, and their tests are deleted.
- 0b74b2d: feat: persist `userPreferences.lastScratchSport` and `userPreferences.aiBannerExpanded` across sessions (per profile) via a forward-only Dexie v15 migration. The `ScratchEditorSurface` now pre-selects the user's last scratch sport in `MetadataEditMode` and writes the chosen sport back on the auto-init path (library-loaded and e2e-seeded workouts are skipped). `AiBanner` seeds its open/closed state from the persisted preference and writes manual toggles and the one-shot auto-collapse-on-first-success transition back, preserving the existing one-shot semantics.

### Patch Changes

- 6742618: fix(e2e): raise calendar-performance budgets to chromium-runner-tolerant ceilings (FCP 1800ms, useMatchedSessions 60ms). The test runs ONLY on chromium engines (skipped on firefox/webkit/Mobile Safari upstream), so both desktop chromium and Mobile Chrome share the same GH Actions runner contention envelope. PR #651's Mobile-Chrome-only relaxation was insufficient — desktop chromium hit the same flake post-merge of PRs #654 and #655.
- eab7ad7: fix: `ImportDropzoneOverlay` now calls `clearWorkout()` on mount so a stale `currentWorkout` from a prior route (scratch draft, template preview, etc.) does not trigger `EditorPage`'s `importComplete` branch (`mode === "import" && currentWorkout !== null`) and silently skip rendering the dropzone overlay. Without this, navigating to `/workout/new?action=import` after viewing any other workout would show the populated editor body instead of the file picker.
- 1045b36: chore: SSR guard the `__KAIORD_DB__` dev-only exposure with `typeof window !== "undefined"` so the module is safe to import from node tooling that doesn't provide a DOM. Matches the symmetric `__KAIORD_WORKOUT_STORE__` guard in `workout-store.ts`. Production builds are unaffected — Vite tree-shakes the `import.meta.env.DEV` block.
- ddc2812: fix(e2e): relax `useMatchedSessions` performance budget to 60ms on the Mobile Chrome project (kept at 30ms for chromium / firefox / webkit / Mobile Safari). The Mobile Chrome runner consistently measured 43-48ms in PR #648 and #650 post-merge runs vs ~10-20ms on desktop chromium — pure CI runner CPU contention, not a code regression.
- 9ce5e6d: fix: `ImportDropzoneOverlay` no longer auto-clicks the hidden file input on mount. The user now lands on the dropzone overlay and explicitly chooses when to open the OS file picker (via the visible "Choose file" affordance or drag-and-drop). Reverts the auto-open behaviour from PR #648 — the explicit-click flow gives the user more control and avoids the OS file picker appearing unexpectedly. `clearWorkout()` on mount (from PR #657) is retained.
- Updated dependencies [581239f]
  - @kaiord/core@8.0.0
  - @kaiord/ai@8.0.0
  - @kaiord/fit@8.0.0
  - @kaiord/garmin@8.0.0
  - @kaiord/tcx@8.0.0
  - @kaiord/zwo@8.0.0

## 0.5.0

### Minor Changes

- 20dacbb: Inline the UX 2026 redesign and remove the feature flag system. Settings now live at `/settings/<tab>` (profile, ai, extensions, usage, privacy) with a sidebar tablist; the persistent `StatusHeader` is always rendered and exposes Profile / Help / Settings entry buttons. The `SettingsPanel` and `ProfileManager` dialog wrappers, the `useSettingsDialog` context, the legacy `HeaderNav` / `DesktopNav` / `MobileMenu`, the `feature-flags` module, and the `R-SettingsSingleEntry` lint guard are all removed. Empty-state shortcuts and the editor "configure AI" affordance now navigate to `/settings/<tab>` instead of opening dialogs.

### Patch Changes

- 21b6a49: Add in-place raw→structured re-process for matched coaching activities + e2e coverage for AI dialog flows (a, b, c, f). Closes #552 and #555 as direct follow-ups to coaching-activity-dialog-redesign §7.4 and §11.1–§11.3/§11.8.
- 5eb5676: Revert accidental `gap-4` addition on LayoutHeader's inner flex container introduced as a drive-by in #632. The class shifts the header layout and breaks the `coaching-sidebar-mobile.png` visual snapshot at 768px, blocking every downstream PR.
- 3ce9bcc: UX redesign Phase 1 leftover: surface a 4-button affordance row
  (`Regenerate` / `Edit` / `Discard` / `Save to Library`) inside the AI
  workout panel as soon as generation succeeds. Closes the last
  "dead-end after success" identified in the deep-dive trace — the user
  no longer has to guess what to do with a freshly-generated workout.

  New `AiSuccessActions` molecule
  (`packages/workout-spa-editor/src/components/molecules/AiSuccessActions/`)
  with 5 unit tests. Wired into `AiWorkoutForm` so it renders only when
  `generation.status === "success"` and a workout is loaded:
  - **Regenerate** re-invokes the existing `generate(text, sport)` with
    the current prompt — no new code path.
  - **Edit** resets the generation state to `idle` so the affordance
    row collapses and the user proceeds with the editor below.
  - **Discard** clears the workout via `useClearWorkout` and resets the
    generation state.
  - **Save to Library** reuses the existing `SaveToLibraryButton`
    molecule so the save flow stays consistent with the rest of the app.

  No behavioural change to the AI generation flow itself; the row is
  purely additive UI.

- 7a99f55: UX redesign Phase 1 leftover: surface a success toast when a batch
  of raw workouts finishes processing. `useBatchRunner` gains an
  optional `onSuccess(count)` callback that fires only when the
  `processBatch` await resolves cleanly — cancellation and errors
  short-circuit through the existing `catch` so no toast appears in
  those paths. `useBatchState` wires `useToastContext().success` to
  the callback with a static `"Batch processed"` title and a
  `"${count} workouts"` description (R-PIIInterpolation compliant —
  the title is a bare literal; the dynamic count flows through the
  description field). Removes the "did anything happen?" dead-end on
  the calendar's batch-process flow identified in the deep-dive trace.
- 501ec50: UX redesign Phase 1 leftover: surface a success toast when a coaching
  activity is matched to a workout (manual picker) or converted to a
  new manual workout via the coaching dialog. Both success branches now
  fire `toast.success("Workout matched", activity.title, { duration: 3000 })`.
  The manual handler fires the toast BEFORE `onClose()` to make the
  ordering explicit, even though `AppToastProvider` lives above the
  dialog tree and would survive unmount either way. Static title
  satisfies the R-PIIInterpolation guard; the dynamic activity title
  flows through the description field. Removes another of the
  "asymmetric handoff" dead-ends identified by the deep-dive trace.
- ccaadfb: UX redesign foundations (Phase 0+1 structural slice): introduce a UX
  glossary (`packages/workout-spa-editor/docs/ux-glossary.md`) defining
  canonical verbs and nouns for the spa editor; add a `Card` atom and
  migrate three duplicated inline `rounded-lg border …` surfaces
  (`ManualCreateSection`, `GettingStartedTips`, `LibraryPageCard`) to it;
  add a visible `EditorPageHeader` to replace the previous `sr-only` h1
  so the editor matches the header pattern used by `LibraryPageHeader`.
  `EmptyWeekState` is migrated from raw HTML buttons (inline
  `bg-primary-600 px-4 py-2 …`) to the `Button` atom (`primary` /
  `secondary`, `sm`) without copy changes. No behavioural change. See
  `.omc/specs/deep-dive-ui-flow-map-ux-redesign.md` for the full phased
  roadmap; verb-pass and AI/journey items ship in subsequent PRs.
- 137698f: UX redesign Phase 1 leftover (start): show a success toast when a
  template is loaded into the editor from the library. The library's
  "Load into editor" CTA navigates to `/workout/new`; previously the
  user landed on the welcome screen with no confirmation that the
  template had been loaded. The new toast surfaces a static
  `"Template loaded"` title (PII guard R-PIIInterpolation compliant)
  with the template name as the description and a 3-second auto-dismiss,
  addressing one of the "dead-ends after success" issues identified in
  the deep-dive trace. Auto-dismiss + toast for the batch and coaching
  completion flows ships in subsequent PRs.
- Updated dependencies [5f3a93a]
- Updated dependencies [51f98ba]
  - @kaiord/ai@7.3.2

## 0.4.3

### Patch Changes

- 3e24ad6: Render coaching activity descriptions with bold emphasis instead of literal `**` markers.

  The train2go-bridge converts Train2Go's `<strong>X</strong>` HTML to markdown `**X**` before storing the description in Dexie. The dialog rendered the raw text via `whitespace-pre-line`, so users saw literal asterisks (`**Calentamiento:** 20 Z1 + 15' Z2`) instead of bold (`**Calentamiento:**` 20 Z1 + 15' Z2).

  `formatCoachingDescription` now recognizes both shapes (`<strong>` HTML + `**markdown**`), and `DialogDescription` walks the same AST → `<strong>` React tree the sidebar already uses. Bold renders consistently in dialog and sidebar regardless of whether the upstream stored HTML or the bridge-converted markdown markers.

## 0.4.2

### Patch Changes

- b3b5cf3: Fix coaching dialog "Edit manually" landing on "This workout has no structured data yet".

  When the coaching activity already had a workout from the legacy `convertCoachingActivity` path (state=raw, krd=null), `handleExistingManualWorkout` returned the existing id without populating its KRD. The editor then short-circuited to `EditorNoData`. The handler now detects the empty-krd case, writes the warmup template KRD, and transitions the workout to `state="structured"` so the editor renders a step the user can edit.

## 0.4.1

### Patch Changes

- a86b7ee: Fix coaching activity dialog stuck on "Loading description…" indefinitely.

  `selectedActivity` was held as plain `useState<CoachingActivity>` in `useCalendarPage`, which froze the original reference at click time. When `expandActivity` populated the description into Dexie out-of-band, the live-query refresh updated `coaching.byDay` but the dialog's `activity` prop kept the stale `description: undefined` reference and the loading placeholder never disappeared.

  Replaced with `useSelectedActivity(byDay)` which captures the click target by id only and re-derives the live view-model from `byDay` on every render — Dexie updates now propagate into the open dialog.

## 0.4.0

### Minor Changes

- 0b3c81b: Coaching activity dialog redesign — dialog UI (PR 2/4):
  - Replaces the 2-state (solo/matched) dialog with a 3-state dispatch (`no-workout`, `converted`, `matched`) computed reactively from `workouts` + `sessionMatches` so the UX never depends on which write path created the workout.
  - No-workout layout: `[AI process]`, `[Edit manually]`, `[Match existing]`, `[Close]`. The AI hint surfaces above the buttons when the activity description is empty so users know the prompt falls back to title + sport.
  - Synchronous AI flow: clicking `[AI process]` swaps the dialog body for an in-flight spinner with a `[Cancel]` button. On success the dialog closes and navigates to the editor; on failure (no provider, transport, invalid KRD, timeout, AI error) it renders an inline error state with `[Retry AI]`, `[Edit manually]`, `[Match existing]`, `[Close]`. AbortController is plumbed through to the use case.
  - Matched-state actions are workout-state-conditional: `raw → [Process with AI] [Open editor]`, `structured → [Open editor] [Push to Garmin disabled]`, `ready → [Open editor] [Push to Garmin enabled]`, `pushed → [Open editor]`. Split is always available alongside.
  - Auto-heal on dialog open: legacy "converted-without-match" rows (pre-Dexie-v10 data, or any concurrent winner) get their `SessionMatch` created silently using `ensureSessionMatch` with `source="auto-coaching-v10-migration"` (D8 belt-and-braces).
  - Emits `coaching.dialog.state_observed` exactly once per dialog open so analytics reflect what the user actually saw, not how many times React re-rendered.

- aa9c1aa: Domain foundation for the coaching activity dialog redesign (PR 1/4):
  - Adds `convertCoachingActivityWithAi` and `convertCoachingActivityManual` use cases that persist a structured workout and its `SessionMatch` atomically. AI failures (network, abort, invalid KRD, timeout) write nothing.
  - Adds the warmup KRD template builder used by the manual-conversion path so the editor renders a non-empty starting point.
  - Extends `convertAndAutoMatch` to auto-heal a missing `SessionMatch` on every legacy convert call (matches the v10 retro-fix invariant per-call).
  - Ships the Dexie v9 → v10 retro-match migration: scans `coachingActivities` × `workouts` once on next app boot, writes the missing `sessionMatches` rows with `source="auto-coaching-v10-migration"`, and surfaces the count via an info toast plus the `coaching.dexie_v10.migrated` analytics event.
  - Wires `coaching.convert_with_ai.invoked / success / failure / cancelled` and `coaching.convert_manual.invoked / success` analytics events.

  UI changes (3-state dialog, EditorPage sidebar, E2E flows) follow in subsequent PRs.

- cd95ae2: Coaching activity dialog redesign — editor sidebar (PR 3/4):
  - `EditorPage` now detects coaching-derived workouts by reading `SessionMatchRepository.getByWorkoutId(profileId, workoutId)` reactively and renders a right-hand `CoachingSidebar` alongside the step editor when the match source is `auto-conversion`, `auto-coaching-v10-migration`, or `manual` (per design D4).
  - The sidebar shows the activity title, sport icon + label, status, and formatted coach description. The formatter preserves `<p>` paragraph breaks and `<strong>` emphasis, strips every other tag, and walks a typed AST → React (no `dangerouslySetInnerHTML`).
  - Collapse toggle persists to `localStorage` under `kaiord.editor.coachSidebar.collapsed`; default expanded ≥768px and collapsed <768px on first mount.
  - Reactive: the sidebar's live query is keyed on `(profileId, workoutId)`, so bridge re-syncs of the coaching description update the sidebar without a full editor reload.

- 28252df: SPA mapper now consumes the new full-Z1-Z5-band Train2Go payload shape and writes the full HR / power / pace zone arrays to the persisted profile. Band-level entries flow through the existing `IncomingMap` / `reconcile` / `commitConflictResolution` pipeline as ~60 new band-level `FieldKey` entries.

  **HR fallback chain** (D-FB1): per sport, `payload.hrZones.<sport>` (Specific) wins when present; `payload.hrZones.generic` (Karvonen) is the fallback; otherwise the sport's HR bands are not touched. A triathlete with only cycling Specific configured gets running and swimming HR bands populated from the Generic block.

  **Cycling power conversion** (D-FB6): watts → %FTP via `Math.round(watts / z4Upper * 100)`. The divisor is `payload.paces.cycling.z4Upper` (T2G's view of FTP), NEVER the persisted profile's FTP — mixing sources distorts %. When `z4Upper` is absent or zero, cycling power band writes are skipped entirely.

  **Pace inversion** (D-FB7): T2G `lower` is the SLOWER edge (larger seconds) → maps to `maxPace`; T2G `upper` is the FASTER edge (smaller seconds) → maps to `minPace`. The Kaiord `minPace <= maxPace` invariant follows from this unconditional assignment.

  **Power-zone count mismatch** (D-FB3): Kaiord's `DEFAULT_POWER_ZONES` defines 7 zones (Z1=Active Recovery..Z7=Neuromuscular Power) but T2G emits 5. The mapper writes a 5-element array; pre-existing Z6/Z7 entries are NOT preserved (T2G is the source of truth at sync time per the design).

  **Per-band conflict policy**: when the persisted sport-kind table is empty (zones array missing OR length === 0), all bands are silent-fills. When the table is populated, per-band conflicts surface as `{<sport>.<kind>.zN.<bound>}` rows in the existing dialog. `commitConflictResolution` accepts band-level decisions; merge: accepted bands take T2G; rejected bands keep pre-sync values.

  **bpmRest flow-through-but-not-persisted** (D-FB8): the new `physiological.bpmRest` field flows through the validated payload but the SPA mapper does NOT write it to the profile in this change — Kaiord has no `restingHeartRate` consumer field yet. Pinned by a deep-diff test.

  UI label-map changes for the new ~60 band-level keys are auto-generated at module-load time from a hardcoded cross-product (`Cycling HR Z2 max`-style) — never interpolates an external string. PR 3 polishes the label format and adds dedicated dialog tests; this PR just keeps the dialog rendering correct values for the new keys.

  Type: `ZonesPayload` Zod schema extended with `physiological.bpmRest`, `paces.cycling.z1..z5: { lower, upper }`, `paces.{running,swimming}.z1..z5: { lower:{min,sec}, upper:{min,sec} }`, `hrZones.generic.z1..z5`, `hrZones.{cycling,running,swimming}.z1..z5`. Backwards-compat: existing convenience scalars (`z4Upper`, `z5Lower`) are preserved; older bridge payloads with only `z4Upper` continue to work for threshold-scalar writes.

  12 new unit tests in `sync-zones-bands.test.ts` cover the HR fallback chain, watts→%FTP, pace inversion, re-sync stability, bpmRest non-persistence, power-zone count mismatch, and band-level merge.

- 790462a: Add the SPA-side backend for Train2Go zones-sync (PR 2/3 of the `train2go-zones-sync` change).
  - New `CoachingTransport.readZones` port on `application/coaching/coaching-transport-port.ts` (optional — Garmin-shaped transports leave it unset; `syncZones` short-circuits with `{ ok: false, reason: "unsupported" }`).
  - Train2Go transport implements `readZones` via the new `read-details` bridge action; the wire fetch is routed through the shared `BRIDGE_QUEUE` so zones-sync, snapshot-push and any future queue consumer share a single per-bridge 60/h budget.
  - New domain types in `types/coaching-zones.ts`: `FieldKey`, `WrittenField`, `ConflictItem`, `SyncZonesResult`, `ConflictDecision`, `ZonesPayload` (Zod-validated raw bridge shape).
  - `BridgeCapability` Zod enum extended with `read:training-zones`. `LinkedCoachingAccount` gains `syncZones?: boolean` (optional → no Dexie schema bump).
  - New application use cases in `application/coaching/`:
    - `syncZones(profileId, transport, repo)` — fetches the bridge payload, eagerly writes silent fills to the persisted profile, returns conflicts UNWRITTEN for the UI.
    - `commitConflictResolution(profileId, decisions, repo, transportPayload)` — phase-2; idempotent.
  - FTP precedence (design D5): `payload.paces.cycling.z4Upper` wins; `z5Lower` fallback only when `z4Upper` is absent OR `=== 0` (semantically "not set" for a watt threshold).
  - Per-sport LTHR via `payload.hrZones.<sport>.z4Upper`; swimming LTHR is intentionally NOT mapped (no consumer in Kaiord today).
  - Profile schema gains `maxHeartRate?: number` so the `heartRate.max` `FieldKey` has a stable storage path.
  - Toast/log copy lives at the top of `sync-zones.ts` as SCREAMING_SNAKE_CASE constants so the `check-no-pii-leakage.mjs` mechanical guard can prove the strings are static.
  - Tests: 25 new unit tests (transport port shape, wire-fetch + queue counter contract, adapter envelope, 11 syncZones cases, 4 commitConflictResolution cases).

  This PR ships the application + adapter layer with no UI; the toggle, conflict dialog and connect/sync fan-out land in PR 3.

- d95188b: Train2Go zones-sync — UI + connect/sync fan-out (PR 3/3 of the `train2go-zones-sync` change).
  - New "Sync zones" toggle on the Linked Account row for Train2Go. Visible only while linked AND the discovered bridge advertises `read:training-zones` (older bridges never see the control). Defaults off; persists alongside the linked-account record.
  - New `ZonesConflictDialog` component with per-row accept/reject. Hard XSS contract: NEVER uses `dangerouslySetInnerHTML`; field labels come from a static `FieldKey` → human-label map, NEVER from any T2G-supplied string. Numeric values render as React children.
  - `useConnectCallback` and `useSyncCallback` fan out into the `syncZones` use case after a successful link / weekly read AND the persisted account has `syncZones === true`. Errors are toasted, never thrown — the connect / calendar sync still succeeds when the zones-sync side-quest fails.
  - New `useZonesSyncOrchestrator` hook owns the two-phase flow: `runSync` invokes the use case + stashes conflicts; `confirmDecisions` invokes `commitConflictResolution` with the user's per-row choices. Idempotent.
  - Bridge discovery now exposes `getCapabilities(bridgeId)` returning the verified manifest's capability list. The new `useTrain2GoSupportsZones` hook wires this through `useSyncExternalStore` so the toggle updates reactively when the bridge announces.
  - Toast copy comes from the SCREAMING_SNAKE_CASE constants in `application/coaching/sync-zones.ts` (mechanical guard `check-no-pii-leakage` enforces static toast strings).
  - Web Store listing copy enumerates the read scope when zones-sync is enabled, plus the explicit deny-list of fields NOT extracted (gender, birthday, fat%, IMC, smoker, bpm_rest, coach contact details).
  - 16 new unit tests cover toggle visibility / capability gating / persistence, dialog render + accept/reject/cancel paths, and connect/sync fan-out + error isolation.

  Manual e2e (per design tasks §9.5) is the user's verification step; an automated Playwright e2e at `packages/workout-spa-editor/e2e/zones-sync.spec.ts` is deferred to a follow-up issue (real bridge stub requires a loaded extension).

- efe3cae: Method-aware reconcile + classifier (PR 2 of 6 of `zones-method-aware-reconcile`).

  **Behaviour change:** the conflict dialog no longer surfaces 30+ pseudo-conflict rows on a freshly-created profile's first sync. Tables on the seed/template/method-derived path are silent-replaced; only genuinely user-customized tables produce per-band conflicts.

  **Changes:**
  - New `classifyZoneTable(profile, sport, kind, snapshot)` returns one of six canonical states (`empty`, `default-template`, `method-derived`, `train2go-synced-clean`, `train2go-synced-edited`, `user-customized`).
  - `reconcile` rewritten to use the classifier. Strategy per state (per design D-MA4):
    - `empty` / `default-template` / `method-derived` / `train2go-synced-clean` → silent-replace; flip method to `"train2go"`; record snapshot.
    - `train2go-synced-edited` → per-band conflict only for bands user touched since last sync (snapshot-diff).
    - `user-customized` → per-band conflict for every disagreeing band.
  - `commitConflictResolution` now updates `method` and `lastSyncedZonesSnapshot` per D-MA4: all-accept → method `"train2go"`; mixed → method `"user"`; all-reject → unchanged. Snapshot reflects post-merge persisted zones (not raw T2G).
  - `sync-zones-band-writes.ts` and `sync-zones-threshold-fields.ts`: replaced fallback method `"manual"` with `"custom"` (the existing canonical vocabulary).

  **Files:**
  - New: `zone-table-classifier.ts`, `zone-table-classifier-types.ts`, `zone-table-classifier-detectors.ts`, `zone-table-classifier-state-helpers.ts`.
  - New: `sync-zones-band-table-reconcile.ts`, `sync-zones-band-strategies.ts`, `sync-zones-partition.ts`.
  - New: `sync-zones-snapshot.ts`, `sync-zones-snapshot-write.ts`.
  - New: `commit-conflict-band-tables.ts`, `commit-conflict-table-apply.ts`.
  - Modified: `sync-zones-helpers.ts`, `commit-conflict-resolution.ts`, `sync-zones.ts`, `sync-zones-band-writes.ts`, `sync-zones-threshold-fields.ts`.

  Test coverage: 18 new cases (13 classifier states + 5 method-aware end-to-end). Total 3257 tests pass (3239 → 3257).

- 9b4fce6: Conflict dialog grouped by sport-kind table + FTP/power-bands coupling (PR 4 of 6 of `zones-method-aware-reconcile`).

  **UX behavior change:** the conflict dialog no longer renders a 30-row scroll-fest of per-band-bound rows. Band-level conflicts are grouped into a single decision unit per `<sport>.<kind>` table (e.g., "Cycling HR Zones — 5 bands differ") with one [Accept Train2Go] / [Keep current] radio plus an expandable [Detail] view showing per-band rows.

  When the FTP scalar is in conflicts AND any cycling.powerZones bands are also in conflicts, the dialog couples them into a single "Cycling threshold + zones" decision unit (per D-MA6) — accepting either implies accepting both, since power bands are stored as %FTP and accepting one without the other creates display inconsistency.

  **New components:**
  - `group-conflicts.ts` — partitions conflicts into scalars / band groups / coupled FTP+power.
  - `ConflictGroup.tsx` — single group row with header, accept/reject radio, expandable detail.
  - `ConflictGroupHeader.tsx`, `ConflictGroupRadios.tsx`, `ConflictGroupDetail.tsx`, `ConflictGroupList.tsx`, `DialogShell.tsx` — extracted from the dialog to fit React 60-line component cap.
  - `use-conflict-decisions.ts` — owns per-row + per-group decision + expand state.

  **Test changes:**
  - 3 PR-3-era band tests rewritten to use group testids (5.2a/b/c).
  - 1 new test for FTP+power-bands coupling (5.2d / D-MA6).
  - Total 3262 tests pass (3261 → 3262).

  Existing per-band testids (`zones-conflict-row-<field>`) are preserved INSIDE the expandable Detail view (DOM persists, hidden via `aria-hidden`).

- 86d2c48: Schema bump for the upcoming zone-method-aware reconcile (PR 1 of 6 of `zones-method-aware-reconcile`).

  **No reconcile/UI behavior changes in this PR.** The new schema field stays unread and the migrated `method` values stay opaque to the existing reconcile until PR 2 ships the classifier.

  **Changes:**
  - `LinkedCoachingAccount` schema gains `lastSyncedZonesSnapshot?: LastSyncedZonesSnapshot` — captures the post-mapper Kaiord-domain zone arrays + threshold scalars from the most recent successful T2G sync. Used by the upcoming classifier (PR 2) to detect "user edited zones since last sync" without per-zone tracking.
  - Dexie schema bumps to v9. `applyV9Upgrade` runs at db-open time on every existing profile and applies two row-level mutations (per design D-MA7):
    1. Normalize `method = "manual"` (introduced by sync-zones-band-writes in the prior `train2go-zones-sync-full-bands` change) → `"custom"`. The `"manual"` value didn't fit the existing vocabulary.
    2. Conservatively reclassify `method = "custom"` AND zones-clearly-not-defaults → `method = "user"`. False-negatives produce conflicts on next sync (handled by the upcoming new dialog gracefully); false-positives produce conflicts forever (avoided).

  **Rollback safety:** IndexedDB doesn't permit version downgrade; "rollback" means deploying old JS bundle while the user's local DB stays at v9. Old code reading the v9-migrated profile encounters `method = "user"` (opaque to old reconcile) and `lastSyncedZonesSnapshot` (Zod `.optional()`, ignored). Pinned by `dexie-v9-rollback.test.ts` — frozen v8 reconcile against a v9-migrated profile produces identical applied/conflicts as the v8-state baseline. **No silent data loss.**

  Test additions: 18 new cases (10 forward migration + 8 `hasUserData` heuristic + 3 rollback regression).

### Patch Changes

- 19537b1: Park the `bridgeDiscovery` singleton on `globalThis` so Vite HMR doesn't split it into two instances. Without this, editing any module in the bridge-discovery import chain caused the React `useSyncExternalStore` hook to keep listening to the previous instance while a fresh one took over the imports — leaving "the discovery says it has the bridges but my hooks don't see them" bugs that only show up in dev. The first hard reload always recovered. New unit test asserts the singleton is on `globalThis` so future regressions are caught at CI time.
- d2dd5c6: Add SPA-side foundation for the bridge popup profile-snapshot push: pure mapper from domain `Profile` to `ProfileSnapshot`, push adapter with content-fingerprint de-duplication via `@kaiord/core`'s `fingerprintSnapshot`, Dexie v6 schema migration that backfills `pendingClear: false` and `lastSuccessfulFingerprint: null` on existing bridge rows, and an extension of the R-PIIInterpolation guard to the bridge adapter directory. The trigger wiring (active-profile mutation effect, bridge-VERIFIED transition, profile-deletion clear) lands in a follow-up commit on the same PR.
- 352e9ed: Bridge popup trigger wiring + lastPushReceipt + dead-code sweep.

  SPA: `useProfileSnapshotPush` (mounted in `App`) now reads the discovered bridges from the in-memory `bridgeDiscovery` singleton (the actual source of truth) instead of an empty Dexie table that no other code wrote to. The hook drives a shared `OperationQueue` that enforces the 60/h-per-bridge cap from the SPA Bridge Protocol spec, and parks a `pendingClear` flag when the active profile is deleted while no bridges are reachable so `profile-snapshot-clear` still fires the next tick a bridge appears. The previously-unused `dexie-bridge-repository`, `bridge-registry`/`-helpers`/`-prune`, `push-active-profile`, and `snapshot-pusher` modules are removed; the in-memory singleton is the only registry.

  Bridges (Garmin + Train2Go): `persistSnapshot` now writes `lastPushReceipt: { at, name }` to `chrome.storage.local` atomically with the snapshot, and `clearSnapshot` removes it alongside `profileSnapshot` and `lastWeeklyRollup`. The Garmin popup's "Last push · N min ago — <name>" line now actually renders; before, the writer side was never wired and the popup silently fell back to omitting the line.

- d7d4a8a: chore(spa-editor): cosmetic polish bundle (closes #266, #267, #268, #269, #270)
  - Remap `gray-*` utilities to `slate-*` via the Tailwind 4 `@theme` alias block — every `bg-gray-*`, `text-gray-*`, `border-gray-*`, etc. now resolves through `var(--color-slate-*)` without touching the ~90 call sites individually.
  - Add `size-adjust: 100%` to the Inter `@font-face` declaration across all three surfaces (landing, docs, editor) to eliminate Cumulative Layout Shift on first paint.
  - Unify `:focus-visible` ring across landing / docs / editor surfaces so a keyboard user sees the same indicator everywhere.
  - Add `viewport-fit=cover` to the SPA's viewport meta and reserve `safe-area-inset-{left,right,bottom}` on the body so notch / rounded-corner devices do not crop SPA content.
  - Document the shared `@font-face` invariant (unicode-range / font-weight / size-adjust must stay byte-equal across the three surface CSS files; only the `src:` URL differs by Pages base path).

- cf79580: Coaching activity dialog redesign — e2e regression specs (PR 4/4):
  - Adds `e2e/coaching-dialog-redesign.spec.ts` with three Playwright specs:
    - **Flow (d)** — `[Edit manually]` creates a structured workout + session_match and navigates to the editor with the sidebar visible.
    - **Flow (e)** — a seeded converted-without-match workout (legacy state) is silently auto-healed when the dialog opens; the dialog re-renders into the matched state with `LinkedWorkoutSection`.
    - **Flow (h)** — an empty-description activity surfaces the AI hint in the dialog footer.

  The AI-bound flows (a/b/c/f/g) require Playwright route mocking for the LLM transport and are tracked as follow-up issues filed at archive time.

- ab015f9: test: close 6 coaching test gaps from train2go-profile-link verify report

  Adds 6 surgical test assertions for previously-untested coaching invariants:
  manual-sync bypass of the staleness gate, coachingActivities row preservation
  on convert, useCoachingConvert navigation + onClose, profile-switch reactivity
  on the calendar header, lossless userId at the JSON parse boundary, and
  abort-mid-poll for attemptLink. Tests-only — no production code changes.

- fbf2583: fix(spa-editor): redirect legacy SPA bookmarks (`/calendar`, `/library`, `/workout/*`) to `/editor/<path>`

  Pre-fix bookmarks pointing at `kaiord.com/<route>` (without the `/editor/` prefix) were dropping users on the landing's blue 404. The deploy-time rafgraph fallback now also handles a closed allowlist of legacy SPA routes — `/calendar`, `/calendar/<weekId>`, `/library`, `/workout`, `/workout/<id>` — and redirects them to `kaiord.com/editor/<path>` so the SPA loads at the intended view. Unrelated 404s (`/typo`, `/calendarx`, etc.) continue to surface the landing's blue 404 as before.

- 744098b: fix(spa-editor): align wouter Router base with Vite deploy base so /editor/<route> URLs survive refresh

  URLs deep-linked into the SPA editor now consistently include the `/editor/` prefix, matching the deploy path. Pre-fix bookmarks pointing at `kaiord.com/<route>` (without the prefix) never survived a refresh; the canonical address is now `kaiord.com/editor/<route>`. Open SPA tabs may briefly show a one-time URL update on the next navigation as the new base takes effect.

  Internally the SPA bootstrap now wraps `<App />` in `<Router base={computeRouterBase(import.meta.env.BASE_URL)}>`, so wouter routes match against the deploy-relative path. The pre-existing rafgraph 404 fallback (introduced in `cleanup-open-issues-may-2026`) now matches the URLs the SPA actually emits.

  A new production-base e2e suite (`packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`, gated by `E2E_PROD_BASE=1`, exercised via the new CI job `e2e-prod-base`) builds the SPA with `VITE_BASE_PATH=/editor/` and serves it through a custom Node static-server fixture that mimics GitHub Pages' 404 contract byte-equally, so the regression cannot silently re-introduce. The rafgraph injection logic was extracted from the deploy workflow into `scripts/inject-spa-fallback.mjs` so production and tests share a single source of truth.

- 86669ae: fix(spa-editor): migrate profile state to Dexie + useLiveQuery — closes #385

  Phase 1B of `persistence-read-rule-cleanup`. User-visible fix for #385: Connect Train2Go updates the calendar header in real time, profiles survive a refresh, and the active-profile join is observed atomically within a tab.
  - Migrates the 4 high-risk read sites (`useProfileManager`, `useAiGeneration` via `useLatestRef`, `useSportZoneEditor`, the `use-active-profile` shim consumers) to the Dexie-backed live hooks introduced in Phase 1A; every write goes through the application use cases so persistence rejections surface as toasts instead of silently swallowing.
  - Adds three #385 regression tests under `src/__regressions__/issue-385.test.tsx` (Train2Go reactive Sync button; profiles survive refresh; sibling-driven `setActiveProfile` is atomic).
  - Deletes `src/store/profile-store.ts` + `src/store/profile-store/` (recursive) + `src/hooks/use-active-profile.ts`.
  - Switches the perf gate to compare-mode against the Phase 1A baseline (`profile-state-baseline.json`); fails the build if `LayoutHeader` or `useAiGeneration` render counts exceed 2× baseline. Both metrics still measure 2 renders post-1B.

  Behavior change documented in tasks.md: `deleteProfile` now clears `meta.activeProfileId` when it matches the deleted id (legacy reassign-to-first-remaining is intentionally dropped per the design's `clear-if-matching` rule). Users re-select an active profile after deletion.

- 8ea4d89: fix(spa-editor): migrate library state to Dexie + useLiveQuery (latent bug from same root cause as #385)

  Phase 2 of `persistence-read-rule-cleanup`. Reuses the foundation from Phase 1A/1B. No new ports, no schema changes — pure read/write rewiring.
  - Renames `useLibraryTemplates` → `useLibraryTemplatesLive` and relocates it to `src/hooks/use-library-templates-live.ts` so consumers read templates reactively from Dexie.
  - Adds three application use cases under `application/library/`: `addTemplate` (single-write put), `updateTemplate` (read-modify-write inside `persistence.transaction`, throws `TemplateNotFoundError`), `deleteTemplate` (single-write delete). Co-located unit tests against `createInMemoryPersistence()`.
  - Helpers (`createNewTemplate`, `updateTemplateData`, search/filter/extract) move from `store/library-store/helpers.ts` to `application/library/helpers/`.
  - Migrates 4 consumer files to read via the live hook + dispatch through the use cases via `usePersistence()`: `LayoutHeader.tsx` (badge counter), `useWorkoutLibrary.ts`, `useSaveToLibrary.ts`, and `LibraryPage.tsx` (which had been doing direct `db.table().delete()` — now goes through the use case).
  - Deletes legacy: `src/store/library-store.ts` + `src/store/library-store/` (recursive) + `src/hooks/use-library.ts` shim + `src/components/pages/library-hooks.ts`.
  - Adds a regression test at `src/__regressions__/library-badge.test.tsx` that pre-populates Dexie with two templates, mounts `LayoutHeader`, and asserts the badge shows "2" without any user interaction (locks in "library badge after refresh").

  Latent bug fixed: pre-Phase 2 the Zustand store loaded empty on boot, so the badge showed "0" until the user opened the library dialog and triggered a write. Same root cause as #385 (Phase 1B) but lower visibility.

- e59efe1: refactor(spa-editor): split AI store into persisted slice (Dexie/useLiveQuery) and runtime slice (Zustand)

  Persisted state (providers, customPrompt) now lives in IndexedDB and is read via `useAiProvidersLive` / `useAiCustomPromptLive`; mutations go through application use cases against `PersistencePort`. Runtime-only state (`selectedProviderId`, `generation`) stays in a focused Zustand store. The legacy `useAiStore` and `useAiHydration` shim are deleted.

- cf14aa4: chore(spa-editor): lock in no-Zustand-write-through guard for persisted entities

  Adds `scripts/check-no-zustand-writethrough.mjs`, a `pnpm test:scripts`-wired static-import check that fails CI if a file under `packages/workout-spa-editor/src/store/**` imports `adapters/dexie/dexie-database` (relative, alias, barrel re-export, or dynamic import) or imports a `persistState` identifier — and if any file under `packages/workout-spa-editor/src/application/**` imports `dexie-database` at all. A small allowlist exempts explicit-user-action writers from the store rule. The application rule has no allowlist.

- 1456d6a: feat(spa-editor): unify Library to a routed page; add narrow TemplatePickerDialog for in-flow picking

  The header Library button now navigates to `/library` (a routed page) instead of opening a modal over the current view. Bookmark-friendly and back-button-friendly. Calendar empty-day's "Add from Library" opens a focused template picker that preserves the day's date instead of navigating away.

  Internally this ratifies a `spa-routing` capability rule: routed pages for content destinations, modals for meta surfaces and in-flow pickers. The previous header-mounted Library modal is deleted; a new no-dual-mount mechanical guard (`scripts/check-no-library-dual-mount.mjs`) enforces that the Library content component cannot be silently re-summoned as a modal in a future PR. A live route announcer (`aria-live="polite"`, `aria-atomic="true"`) and `useFocusOnRouteChange` restore the focus / SR announcement equity the deleted modal provided via Radix Dialog.

- 710c2e3: Fix the calendar header showing "Connect to Train2Go" right after the user successfully linked the account in Profile Manager. The Train2Go detection cache was holding onto stale negative results and the SPA never re-detected after the link dance, so the source's `sessionActive` flag would say `false` while the persisted `linkedAccounts` already had the entry — a UX contradiction the user could only resolve by hard-reloading the tab. Three small changes:
  - `createDetectAction` now caches only positive results (was: any result with `extensionInstalled: true`). A previous "session inactive" no longer suppresses subsequent detections.
  - `detectExtension({ force: true })` bypasses the cache for an explicit re-check.
  - The Train2Go `connect` callback fires a forced re-detect after `attemptLink` succeeds, so the source's `connected` flag flips to `true` immediately.
  - `useTrain2GoDetection` also runs a forced detect on `visibilitychange` so returning to the tab after a Connect dance always reflects reality.

- 0285a84: Fix LTHR-scalar sync from Train2Go for sports without a Specific HR block.

  Two coupled issues:
  1. **Swimming LTHR was never written.** The mapper only emitted `cycling.thresholds.lthr` and `running.thresholds.lthr`; `swimming.thresholds.lthr` had no corresponding `FieldKey`, no read/write accessor, no field label, and was missing from the `IncomingMap`. After sync, the LTHR field on the Swimming tab stayed empty even when Generic HR was configured upstream.
  2. **Cycling/running/swimming LTHR scalars didn't apply the Specific → Generic → skip fallback** that the band tables already use (D-FB1). The mapper read `payload.hrZones.{sport}.z4Upper` directly, so on profiles with only the Generic Karvonen block configured (the common shape — Pablo's account has cycling Specific only, running and swimming inherit Generic) the running LTHR field stayed empty too.

  The fix:
  - Adds `swimming.thresholds.lthr` to `ThresholdFieldKey`, with read/write cases in `sync-zones-threshold-fields.ts`.
  - Adds the corresponding label ("Swimming LTHR") and unit ("bpm") to `field-labels.ts`.
  - Refactors `setThresholdScalars` to resolve LTHR for all three sports through a new `resolveLthrScalar` helper that mirrors `resolveHrBands`' Specific → Generic → undefined chain, but keys on `z4Upper` directly (the legacy payload shape that has only `z4Upper` without the full Z1-Z5 bands still resolves correctly).

  Behavior summary post-fix on Pablo's account (cycling Specific = Generic = 107-187, no running/swimming Specific):
  - Cycling LTHR → 174 ✓ (unchanged: Specific block has z4Upper)
  - Running LTHR → 174 ✓ (was empty: Generic-fallback now fires)
  - Swimming LTHR → 174 ✓ (was empty: new field + Generic-fallback)

- e06743a: Add band-level dialog test coverage and label-map count invariants for the train2go-zones-sync-full-bands change. PR 3 of 4.
  - 3 new ZonesConflictDialog test cases (5.2a/b/c per `tasks.md`): band-level row rendering with auto-generated label, mixed scalar+band conflicts preserving insertion order, accept-all-rows-of-a-table emits per-row decisions.
  - 1 new field-labels test file (5.1a) asserting (a) total label count is exactly 67 (7 threshold scalars + 60 band-level entries from the cross-product helper), (b) no T2G-controlled substring (coach, email, birthday, gender, fat, smoker, imc, user_notes) leaks into any label, (c) every entry has a non-empty value.

  The label map and dialog rendering for band-level keys was shipped functional in PR 2 (`@kaiord/workout-spa-editor` minor); this PR locks the contract via tests so a future regression that drops a band's label, leaks a forbidden substring, or breaks the per-row decision emit fails loudly.

- 739755b: Train2Go zones-sync — Playwright e2e + shared orchestrator (closes #478).
  - New `packages/workout-spa-editor/e2e/zones-sync.spec.ts` covers the three user-visible flows the unit tests can't fully exercise in a real browser: (a) toggle-off auto-sync MUST NOT issue `read-details`, (b) toggle-on with empty profile silently fills every threshold/physio value, (c) toggle-on with a manual FTP opens the `ZonesConflictDialog` with the diff. Stable across 5/5 runs in `pnpm exec playwright test --project=chromium`.
  - New helpers `e2e/helpers/train2go-bridge-stub.ts` + `train2go-bridge-stub-page-script.ts` install a self-contained Train2Go bridge stub via `addInitScript`: stubs `chrome.runtime.sendMessage`, posts `KAIORD_BRIDGE_ANNOUNCE` (and re-posts on `KAIORD_BRIDGE_DISCOVER`), tracks every action call so tests can assert what fired (`read-details`) and what didn't.
  - **Architectural fix**: lift the zones-sync orchestrator out of per-source instances into a single `Train2GoZonesSyncProvider` mounted at app root (inside `AppToastProvider`). Before this, the calendar header's sync button and the `LinkedAccountRow`'s mounted dialog used different orchestrator instances — clicking sync on the calendar set `pending` on instance A while the dialog was mounted under instance B. The provider now owns the state and renders the dialog itself, so any trigger surfaces the dialog regardless of which page is open. The calendar's call site (via the registry's `useTrain2GoSource` factory) and the Profile Manager's row both consume the same context.
  - `useTrain2GoSource` no longer creates its own orchestrator; it reads from the new context. The `Train2GoSource.zonesSync` field is preserved for backwards compatibility (some tests reference it).
  - `LinkedAccountRow` no longer renders `ZonesConflictDialog` (the provider does). `useLinkedAccountRow` no longer returns `zonesSync`.

  This closes the integration gap that PR 3 (#474) shipped — the per-instance orchestrator design passed all 16 unit tests because each one tested in isolation, but the dialog never appeared in the calendar-triggered flow that PR 3 was supposed to wire up.

- cc54e4a: E2E coverage for zone-method-aware reconcile (PR 5 of 6 of `zones-method-aware-reconcile`).
  - Extended `FIXTURE_ZONES_PAYLOAD` in `e2e/helpers/train2go-bridge-stub.ts` with full Z1-Z5 bands per block (HR Generic + cycling power watts + running/swimming pace `{min,sec}`) so the new payload shape is exercised end-to-end. Also added `physiological.bpmRest` (allowlisted but not persisted per D-FB8).
  - Added new flow (d) in `e2e/zones-sync.spec.ts`: FTP scalar conflict + cycling.powerZones band conflicts → coupled `"Cycling threshold + zones"` group row (per D-MA6). Verifies that the dialog renders the coupled group testid (`zones-conflict-group-cycling.threshold-and-zones`) and NOT a standalone FTP scalar row.

  Existing flows (a) toggle-off, (b) silent-fill empty profile, (c) FTP conflict are unchanged — they exercise threshold-scalar paths that continue to work with the new payload shape via the convenience scalars (z4Upper, z5Lower).

  Manual verification with Pablo's real T2G account + 3-iteration stability gate (§6.3, §6.4 of the change tasks) are deferred to follow-up issues filed at archive time.

- 78ca138: ZoneEditor manual band edits now flip `method = "user"` (PR 3 of 6 of `zones-method-aware-reconcile`).

  When the user edits any zone band via the Profile Manager `ZoneEditor`, the corresponding `<sport>.<kind>.method` is updated to `"user"` as part of the persistence write. Subsequent T2G syncs treat that table as `user-customized` (per the classifier in PR 2) and emit per-band conflicts rather than silent-replacing.

  The dropdown's formula-recompute pathway (`setZoneMethod`) is unchanged — it preserves the chosen method id (`"karvonen-5"`, `"coggan-7"`, etc.) so formula-derived zones stay classifiable as `method-derived`.

  `updateSportZones` use case is the manual-band-edit signal; `setZoneMethod` is the dropdown signal. The two pathways are now semantically distinct per design D-MA3 of zones-method-aware-reconcile.

  Test coverage: 4 new cases (4.3a-d) in `zones.test.ts` covering: train2go → user, custom → user, setZoneMethod stays formula, formula → user on band edit. Total 3261 tests pass (3257 → 3261).

- Updated dependencies [79be4f3]
- Updated dependencies [d66e509]
- Updated dependencies [b556758]
- Updated dependencies [744a78f]
  - @kaiord/core@7.2.0
  - @kaiord/zwo@7.2.0

## 0.3.0

### Minor Changes

- 50d1555: Add FocusTelemetry observability port and StrictMode-safe focus hardening.

  **FocusTelemetry seam (Phase A):** A new `FocusTelemetry` function type and
  `FocusTelemetryContext` let integrators wire any backend (Sentry, Datadog RUM,
  custom) to observe focus events without coupling the hook to a specific SDK.
  Five discriminated-union event variants:
  - `wiring-canary` — fires once per page-load session on editor mount; absence
    in prod telemetry indicates wiring failure.
  - `unresolved-target-fallback` — fires when the fallback chain resolves via
    empty-state, first-item, or heading instead of the intended target.
  - `form-field-short-circuit` — fires (debounced ≤ 1/s) when a pending focus
    move is suppressed because a form field is active.
  - `overlay-deferred-apply` — fires with `deferredForMs` (100 ms–quantized)
    when a stashed target is re-applied after a Radix overlay closes.
  - `focus-error` — fires with `phase: "focus" | "scrollIntoView"` when the
    low-level DOM call throws.

  All payloads are structural-fields-only (no ItemIds, step names, or user data).

  **Structural history refactor (Phase B, atomic):** Replaced parallel
  `workoutHistory: Array<UIWorkout>` + `selectionHistory: Array<ItemId | null>`
  with `undoHistory: Array<HistoryEntry>`, where `HistoryEntry = { workout,
selection }`. The new 1-arg `pushHistorySnapshot(entry)` enforces atomic
  coupling by construction — no CI grep required.

  **StrictMode hardening (Phase D):** Focus integration test suites now run
  under both standard and `React.StrictMode` via `describe.each`, proving
  double-mount / double-effect semantics do not break focus behaviour. The
  `wiring-canary` module-level flag prevents double-emission.

  **AT evidence infrastructure (Phase D):** Quarterly VoiceOver + NVDA refresh
  workflow added at `.github/workflows/accessibility-evidence-refresh.yml`.
  Evidence directory: `packages/workout-spa-editor/docs/accessibility-evidence/2026-04-24-focus-management/`.
  Physical AT transcripts (tasks 7.2–7.4) require VoiceOver on macOS and NVDA
  on Windows — stubs with full regeneration runbook committed.

- 11522ca: Persistent coaching integration: link Train2Go to a Kaiord profile.

  Coaching activities (Train2Go today, future TrainingPeaks/etc.) are now
  persisted in IndexedDB scoped per Kaiord profile, survive reload, and
  auto-sync on calendar mount and week change with a 10-minute staleness gate.
  Each profile carries its own `linkedAccounts: LinkedCoachingAccount[]` so
  multi-profile users can link different platforms per profile.

  Connect / disconnect lives in **Profile Settings → Linked Accounts**, not on
  the calendar. The Sync button only appears for sources linked to the active
  profile. Click on a coaching card opens a dialog with description and a
  "Convert to workout" action that creates an editable raw `WorkoutRecord`
  (idempotent within a profile, distinct between profiles via namespaced
  `sourceId`).

  Includes a Dexie v4 migration that adds `coachingActivities` and
  `coachingSyncState` tables and backfills `linkedAccounts: []` on existing
  profiles. Bridge-discovery `syncState` is unchanged byte-identically.
  Telemetry events emitted at the application boundary; payloads are PII-free.

### Patch Changes

- Updated dependencies [1eb5fd0]
  - @kaiord/core@7.1.2

## 0.2.0

### Minor Changes

- b126d94: Replace build-time `VITE_*_EXTENSION_ID` env vars with runtime bridge
  discovery via content script announcements.

  **Why**: the old flow baked extension IDs into the SPA bundle at build
  time, which coupled each build to a specific install and required new
  developers to edit `.env.local` before extensions could be detected
  (Twelve-Factor III / V violation). The new flow is zero-config for
  users and developers — install the extension and it announces itself
  to the SPA on every navigation.

  **`@kaiord/garmin-bridge` & `@kaiord/train2go-bridge` (minor — user-visible
  discovery change requiring extension reload):**
  - New `kaiord-announce.js` content script injected at
    `document_start` on `https://*.kaiord.com/*` (and
    `http://localhost/*` in dev) posts `KAIORD_BRIDGE_ANNOUNCE` with
    `chrome.runtime.id`, version, and declared capabilities
  - Listens for `KAIORD_BRIDGE_DISCOVER` from the SPA and re-announces
    to handle the service-worker cold-start race
  - Manifest (`manifest.json` + `manifest.prod.json`) adds a second
    `content_scripts` entry for the announce-only script. Existing
    host-scoped scripts (`connect.garmin.com` / `app.train2go.com`)
    are unchanged

  **`@kaiord/workout-spa-editor` (minor — runtime discovery replaces env-var
  coupling):**
  - New `bridge-discovery` adapter listens for announcements on
    `window.message`, verifies each via a ping against the announced
    `extensionId` (manifest schema + `data.id` match + supported
    protocol version), and exposes `getExtensionId(bridgeId)` to the
    rest of the app. Rejects spoofed announcements
  - `useGarminBridgeActions` and the `train2go-store` actions no longer
    read `import.meta.env.VITE_*_EXTENSION_ID`; they call the
    discovery singleton at call time, so the ID updates reactively
    on announcement
  - `useStoreHydration` starts the discovery listener on app boot
  - `VITE_GARMIN_EXTENSION_ID` and `VITE_TRAIN2GO_EXTENSION_ID` are
    removed from `.env.example` — no extension ID env vars required
  - Privacy policy discloses the new announce-only content script
    (and its localhost-dev variant stripped from the production
    manifest); the `check-privacy-policy` lint now allows the
    announce match set and flags missing disclosure

  **Migration note**: users must reload/update both Chrome extensions
  after this release so the new `kaiord-announce.js` content script is
  picked up. After the reload, the SPA auto-detects the extension with
  no additional configuration.

- a2888cf: Close eight spec-vs-code drift gaps identified by the 2026-04-20
  `/opsx-sync` audit. No public API breaks; the SPA changes are
  internal to `@kaiord/workout-spa-editor` and ship behind a Dexie
  v2+v3 schema bump with additive, backwards-compatible migrations.

  **`@kaiord/workout-spa-editor` (minor — new UI affordances, new
  Dexie stores, additive schema):**
  - Surface a storage-unavailable banner when `probeStorage()` reports
    failure ("Storage unavailable — changes in this session won't be
    saved"). Wired through a new `storage-store` + single-mount
    invariant in `MainLayout`.
  - Introduce `BridgeStatus = "verified" | "unavailable" | "removed"`.
    Pruning now transitions `unavailable → removed` after 24h (with a
    user notification) and deletes the row 24h after that. Registry
    persists to a new `bridges` Dexie store so the lifecycle timers
    survive browser restarts.
  - Pin the Train2Go 30s detection cache behavior (never-detected,
    cached-and-stale, cached-not-installed, no-rolling-window).
  - Advance `modifiedAt` on every KRD edit via a new
    `onWorkoutMutation` helper wired into the editor save path — edits
    in STRUCTURED/READY now bump the timestamp, not only the legacy
    PUSHED→MODIFIED transition.
  - Enrich `BatchProgress` with `counts` and per-workout `byId` so the
    calendar batch-progress panel can render per-workout status.
  - Split `UsageRecord.totalTokens` into `inputTokens` / `outputTokens`
    (derived `totalTokens` retained for legacy readers, Zod `.refine`
    pins the invariant). Dexie v3 migration backfills legacy rows
    (`inputTokens = totalTokens`, `outputTokens = 0`, `legacy: true`);
    the usage-panel renderer shows `—` for `outputTokens` on legacy
    rows.

  **`@kaiord/docs` (patch — head meta tag + token-parsing helper):**
  - Add `<meta name="theme-color">` to the VitePress docs head. Value
    is parsed at config-load time from `--brand-bg-primary` in
    `styles/brand-tokens.css`; CI invariant blocks re-introducing a
    hex literal under `packages/docs/`.

  **Repo-level** (not a publishable-package bump, called out here for
  the release log):
  - `.changeset/config.json` adds `@kaiord/garmin-bridge` and
    `@kaiord/train2go-bridge` to `linked[0]` so bridge extensions
    version in lockstep; guarded by `scripts/check-changeset-config.test.mjs`.

### Patch Changes

- 2e3dd28: Focus management: wire `FocusRegistryProvider` + `useFocusAfterAction`
  into the editor component tree (§8.1–§8.5 of the
  `spa-editor-focus-management` proposal). After this PR every workout
  mutation that writes `pendingFocusTarget` actually moves DOM focus.
  - `WorkoutSection` wraps `FocusRegistryProvider` around the editor
    subtree and mounts `useFocusAfterAction` via a thin
    `useWorkoutSectionFocus` hook. Three fallback refs are wired in:
    the editor root (`<div data-testid="editor-root">`), the Add Step
    button (§7.5 empty-state target), and the workout title `<h2>`
    (§7.5 last-resort heading).
  - `WorkoutTitle` adds `tabIndex={-1}` to the `<h2>` and forwards a
    new `titleRef` prop, with a `:focus-visible` outline so the
    programmatic focus is visible.
  - `WorkoutStepsList` accepts `editorRootRef` and
    `addStepButtonRef`, attaching them to the outer `<div>` and the
    "Add Step" button. The outer `<div>` now carries
    `data-testid="editor-root"` for tests.
  - `WorkoutStepsListActions` forwards `addStepButtonRef` to the
    `<Button>` (which already supported ref forwarding).
  - `StepCard` and `RepetitionBlockCard` self-register with the
    registry under their own `step.id` / `block.id` via a shared
    `useFocusRegistration` hook. A `mergeRefs` utility combines the
    forwarded `ref` (DnD, tests) with the internal registration ref.

  Integration tests in
  `WorkoutSection.focus-integration.test.tsx` drive real store
  mutations through the full render tree and assert
  `document.activeElement` after each `setTimeout(0)`:
  - next sibling after `deleteStep(0)` on two-step workout
  - focus on new step card after `createStep()`
  - Add Step button focused when the list becomes empty
  - focus does NOT move while an `<input>` inside the editor root is
    focused (form-field guard from §7.3)

- eb0dff3: Focus management: DOM bridge for the `pendingFocusTarget` intent (§7 of
  the `spa-editor-focus-management` proposal). The store has been writing
  focus intents since PR #339; this PR adds the runtime that actually
  moves the caret.

  **§7.1 FocusRegistryContext.** A React context that maps stable
  `ItemId`s to mounted DOM elements. `registerItem` is idempotent,
  `unregisterItem` only deletes when the stored element matches the
  caller's (StrictMode double-mount guard), and the context `value`
  reference is stable across re-renders that do not touch the registry.

  **§7.4 overlay observer.** A ref-counted `MutationObserver` singleton
  (`subscribeToOverlayCount`) scoped to the editor root element — not
  `document.body` — so that a foreign `<div role="dialog">` injected
  elsewhere cannot defer focus indefinitely (availability-DoS
  mitigation). Only elements with `role="dialog" | "menu"`,
  `data-state="open"`, and at least one `data-radix-*` attribute are
  counted. When `MutationObserver` is unavailable the observer assumes
  zero overlays, emits a single dev-mode warning, and hands back a
  no-op unsubscribe. A test-only `__resetOverlayObserverForTests()`
  disposes every observer and clears the `globalThis.__kaiord_overlayObserver__`
  mirror that Vitest uses to keep the singleton alive across module
  resets.

  **§7.5 fallback chain.** `resolveFocusElement` resolves a
  `FocusTarget` into a real element through a strict order —
  explicit target → empty-state button → first registered item →
  labelled editor heading → `null`. Elements that are detached
  (`isConnected === false`) or carry `role="list"` are rejected so
  focus never lands on a bare container. When the chain yields
  `null`, the hook clears `pendingFocusTarget` and emits a dev-mode
  warning instead of attempting a silent no-op focus move.

  **§7.2–7.3, 7.6–7.8 `useFocusAfterAction` hook.**
  - Subscribes via a narrow selector so unrelated store keys do not
    trigger re-renders.
  - Form-field guard: when `document.activeElement` is a text input,
    textarea, select, or `contenteditable` element inside the editor
    root, the hook clears the target without moving focus.
  - Overlay defer: while the overlay observer reports `count > 0`,
    the hook stashes the target, clears `pendingFocusTarget`, and
    re-applies the stashed target one `requestAnimationFrame` after
    the count returns to zero.
  - `applyFocusToElement` performs `focus({ preventScroll: true })`
    and `scrollIntoView({ block: "nearest", behavior })` with
    `behavior = "instant"` under `prefers-reduced-motion: reduce`
    and `"auto"` otherwise. Both calls are wrapped in try/catch so
    a detached node or a legacy engine rejecting the options-object
    form cannot throw past the API boundary.
  - Focus moves are scheduled inside `setTimeout(fn, 0)` so a
    concurrent `role="status"` toast queues first in the AT speech
    pipeline.
  - A `prevTargetRef` guard collapses rapid sequential
    `setPendingFocusTarget` calls into a single focus move on the
    final value.

  **§7.9 flushSync patterns** documented in
  `src/store/README.md` with three runnable snippets covering
  paste-then-continuation, delete-then-continuation, and
  paste-inside-dialog continuation.

  Component integration (wiring `FocusRegistryProvider` and the hook
  into `WorkoutList`, `StepCard`, `RepetitionBlockCard`, and the
  empty-state button) lands in the follow-up §8.1-§8.5 PR.

- 1a876b6: Focus management: wire store actions to focus-rule helpers (§6),
  enforce single-parent multi-selection invariant (§8.8), and document
  the store in `src/store/README.md` (§10).

  **§6 — action wiring.** Every state-mutating action now writes a
  `pendingFocusTarget` alongside the new workout snapshot:
  - **Delete** (`deleteStep`, `deleteRepetitionBlock`) →
    `nextAfterDelete({ workout, deletedIndex })` — next-sibling /
    previous-sibling / empty-state.
  - **Creation** (`createStep`, `duplicateStep`,
    `createEmptyRepetitionBlock`, `addStepToRepetitionBlock`,
    `duplicateStepInRepetitionBlock`, `createRepetitionBlock`,
    `pasteStep`) → `createdItemTarget(newId)`. `pasteStep` focuses the
    freshly-regenerated id, never the clipboard-supplied one.
  - **Ungroup** → focus the first extracted child.
  - **Clear** → `null`.
  - **Undo delete** → `restoredAfterUndoTarget(workout, restoredId)`.
  - **Undo/redo** → `preservedSelectionTarget(snapshot, priorSelection,
index)`, reading the parallel `selectionHistory` slice.
  - **Reorder** (`reorderStep`, `reorderStepsInBlock`) →
    `createdItemTarget(movedId)` to keep focus on the dragged item.

  `PasteStepResult` exposes a `pastedItemId` field so the store reducer
  can set focus without re-walking the workout.

  **§8.8 — single-parent multi-selection invariant.** A selection cannot
  span the main list and the inside of a repetition block, nor span two
  different blocks. `toggleStepSelection` now _replaces_ the selection
  (rather than extending it) when a toggle would violate that invariant;
  `selectAllSteps` filters to the subset that shares the first id's
  parent. Covered by 7 new tests in `selection-invariant.test.ts`.

  **§10 — store README.** `packages/workout-spa-editor/src/store/README.md`
  documents the runtime state slices (workout / history / focus /
  clipboard / selection), the action surface, the `pushHistorySnapshot`
  and `stripIds` chokepoints, the pure focus-rule helpers, and the
  narrow-selector discipline consumers must follow to avoid coupling to
  full `WorkoutStore` shape.

  Deferred to follow-up PRs: §7 focus hook + registry + overlay
  observer, and §8.1–§8.5 component integration that depends on §7.

- 1d09501: Internal refactor: consumer migration to stable ItemIds (§9 of the
  `spa-editor-focus-management` proposal) + block-ID cleanup.
  - Introduce `findById(workout, id)` helper that locates a step / block /
    nested-step by its stable `ItemId` and returns its position context
    directly — replaces the legacy positional-ID parser.
  - Migrate consumers to the helper: `useSelectedStep`, `getSelectedStepIndex`,
    `parseSelectedStepIndex`, `workout-section-handlers-helpers`,
    `build-step-handlers` (the Ctrl+Shift+G ungroup check no longer relies on
    `selectedStepId.startsWith("block-")`), the DnD sortable ids, and the
    `WorkoutPreview` bar flattening.
  - Delete `step-id-parser.ts` + its test file (dead code after the
    migration); remove the `migrateRepetitionBlocks` pre-pass from
    `createLoadWorkoutAction` (redundant now that `hydrateUIWorkout` assigns
    every id).
  - Flip block IDs to `defaultIdProvider()` (UUID v4) — no more
    `Math.random`-based `generateBlockId()` in store mutations.
  - Flip `hydrateUIWorkout` default to `preserveExistingIds: false` per
    design decision 6 ("stable IDs are regenerated on every load"). The
    preserve mode remains available as an opt-in.
  - CI focus-invariants: grep guards that reject any future reintroduction
    of positional-ID parsers or Zustand `persist()` middleware over the
    workout store.

  No user-visible behavior change; the UIWorkout ↔ KRD contract at the
  `@kaiord/core` port boundary is unchanged because `stripIds` is still the
  outbound chokepoint.

- 7cf10c4: Internal refactor: focus-management foundations.
  - Introduce branded `ItemId` type and `IdProvider` seam (UUID v4 with
    `crypto.getRandomValues` fallback for non-secure contexts).
  - Rename in-memory shape to `UIWorkout` (alias of `KRD` augmented with
    `UIWorkoutStep`/`UIRepetitionBlock` carrying required `id: ItemId`).
    Every creation/duplicate/paste action now emits a fresh `ItemId`; history
    snapshots preserve IDs across undo/redo and undo-delete.
  - Add `stripIds` chokepoint: Dexie workout/template writes, save-to-file,
    and `exportWorkout` all strip UI ids before hitting the portable `KRD`
    surface. `pasteStep` regenerates every id to close the clipboard trust
    boundary.

  No user-visible behavior change yet; focus state, hooks, components, and
  consumer migration are intentionally out of scope for this PR.

- 5500498: Internal refactor: focus target state + selection history (§4 of the
  `spa-editor-focus-management` proposal).
  - `FocusTarget` discriminated union (`{ kind: 'item'; id: ItemId }` |
    `{ kind: 'empty-state' }`) in `src/store/focus/focus-target.types.ts`,
    with `focusItem(id)` / `focusEmptyState` constructors.
  - `FocusSlice` adds `pendingFocusTarget: FocusTarget | null` plus
    `setPendingFocusTarget(target)` to the workout store. Dumb setter: no
    DOM lookup, no resolution — the hook (§7) consumes the target.
  - `selectionHistory: Array<ItemId | null>` kept exactly parallel to
    `workoutHistory` so undo/redo fallback rules (§6) can restore focus
    to the item that was selected immediately before the undone mutation.
  - `pushHistorySnapshot(state, uiWorkout, selection)` helper in
    `src/store/workout-store-history.ts` — the ONLY production code path
    that appends to `workoutHistory`. `createUpdateWorkoutAction` now
    routes every mid-session push through it. Dev-mode length-drift
    assert + CI invariant enforce the single-call-site rule.
  - `workout-store-types.ts` split into `workout-store-state.types.ts`
    - `workout-store-actions.types.ts` to respect the repo's
      ≤80-line-per-file ESLint rule.

  No consumer wiring yet — that's §6 (focus-rule helpers into mutating
  actions) and §7 (`useFocusAfterAction` hook). This PR only lays the
  foundation.

- d26c17f: Internal refactor: pure focus-rule helpers (§5 of the
  `spa-editor-focus-management` proposal).

  Five pure functions, one per file in `src/store/focus-rules/`, each
  taking a `Workout` + mutation ids and returning a `FocusTarget`:
  - `createdItemTarget(id)` — newly-created items.
  - `nextAfterDelete({ workout, deletedIndex, parentBlockId? })` —
    next-sibling / previous-sibling / empty-state rules for single
    deletes (covers main-list and block-child branches, including the
    "block becomes empty → anchor to parent block" cascade).
  - `nextAfterMultiDelete({ workout, deletedIndices })` — multi-select
    delete (contiguous, non-contiguous, delete-all).
  - `restoredAfterUndoTarget(workout, id)` — focus restored item if still
    present, else empty-state.
  - `preservedSelectionTarget(workout, priorSelection, fallbackIndex)` —
    prior selection present / same-index fallback / empty-state.

  The rules read `Workout` state only; `findById` does the lookup. No
  React, no DOM, no store imports — a new CI focus-invariant grep in
  `.github/workflows/ci.yml` rejects any `from 'react'` / `document.` /
  `window.` / `HTMLElement` under `src/store/focus-rules/`.

  Consumers (§6 action wiring) land in a follow-up PR.

- e395800: Focus management: hardening pass — consistent `:focus-visible` outline
  on every focusable item target, reduced-motion support, and a CI-grep
  invariant that enforces narrow Zustand subscriptions
  (§8.6–§8.7 + §10.3 of the `spa-editor-focus-management` proposal).

  **§8.6–§8.7 — styling + tab-order.**
  - `StepCard`, `RepetitionBlockCard`, and the workout title `<h2>`
    render the same `focus-visible:ring-2 focus-visible:ring-blue-500
focus-visible:ring-offset-2` outline (dark variants included), so a
    programmatic focus move from `useFocusAfterAction` produces the
    same visual signal on every item type.
  - `motion-reduce:transition-none` disables the color transition on
    the cards when `prefers-reduced-motion: reduce` is set, sparing
    users with vestibular sensitivity a flash on focus.
  - Step cards keep `tabIndex={0}` so the programmatic focus target
    stays in the normal sequential Tab order.

  **§10.3 — narrow-selector CI invariant.**
  - Added a Python-based focus-invariant check in `.github/workflows/ci.yml`
    that rejects `useWorkoutStore()` (no-arg) and identity selectors
    like `useWorkoutStore((s) => s)` under
    `packages/workout-spa-editor/src/components/**` and `src/hooks/**`.
    Consumers must subscribe via narrow selectors or pre-baked hooks
    from `workout-store-selectors.ts` so a `setPendingFocusTarget`
    write does not re-render every consumer.
  - Migrated the three pre-existing wide-selector consumers
    (`useGarminPush`, `useAiGeneration`, `LayoutHeader`) to narrow
    hooks (`useCurrentWorkout`, `useLoadWorkout`). Test mocks updated
    to match the new import paths.

## 0.1.0

### Minor Changes

- 3d8b6df: Redesign Profile Manager with zone method system
  - Add zone method registry (Coggan, Friel, British Cycling, Karvonen, Daniels, Custom)
  - Replace auto/manual toggle with method dropdown per zone type
  - Show zone values in real units (watts, bpm, min/km) instead of percentages
  - Redesign Profile Manager layout: remove Edit Profile card, add Training Zones and Personal Data tabs
  - Add inline-editable profile name in dialog header
  - Support custom zone count (add/remove zones, 1-10 range)
  - Update LLM zones formatter to output real values with method names
  - Add migration from legacy `mode` field to `method` field

- bd2a385: Calendar-centric SPA redesign: week view as home page, Dexie.js persistence via PersistencePort, workout state machine (RAW->STRUCTURED->READY->PUSHED), bridge plugin protocol, AI batch processing with Spanish coaching language support, and library page refactor.
- 972fb38: Add sport-specific training zones: per-sport HR, power, and pace zone configs with auto/manual modes, tabbed zone editor in Profile Manager, AI zone indicator, sport-aware zones formatter, and profile migration from legacy format.
- 11dc56c: Add coaching platform integration with Train2Go Bridge extension support. Introduces CoachingSource port, registry pattern, and generic coaching activity cards in the calendar. Platform-agnostic architecture allows future coaching platforms (TrainingPeaks, etc.) with zero calendar code changes.

### Patch Changes

- b5b12a5: Replace hardcoded Lambda URL with VITE_GARMIN_LAMBDA_URL env var, migrate stale api.kaiord.com URL from localStorage, show Configure Garmin when URL is empty
- d29c5db: fix: context-aware keyboard shortcuts and custom context menu
  - Keyboard shortcuts (Cmd+C, Cmd+V, Cmd+X, Cmd+A, Cmd+G, Escape, Alt+Arrow) only call
    `preventDefault()` when the app action is meaningful; otherwise the browser handles the
    event natively (e.g., native text copy when no step is selected)
  - Exact modifier matching: Cmd+Shift+C, Cmd+Shift+S, etc. pass through to the browser
  - Added Cmd+X (Cut) support: copy + delete in one action
  - Custom right-click context menu on the step list with Cut, Copy, Paste, Delete,
    Select All, Group, and Ungroup actions (with keyboard shortcut hints and ARIA attributes)
  - Native context menu fallback when no app actions are applicable
  - Extended form element passthrough to include contentEditable elements
  - Added `hasClipboardContent()` to clipboard store for synchronous content checks

- 99665b0: Add AI batch cost-confirmation dialog and Settings → Usage panel.

  The batch banner's "Process all with AI" button now opens a confirmation dialog showing the configured provider, estimated tokens (chars/3 heuristic), and estimated USD cost (per-provider blended rate) before dispatching the run. The new Settings → Usage tab renders cumulative AI token usage and cost for the current month plus the previous five, read live from the Dexie `usage` table.

  Closes the remaining two findings from the 2026-04-18 opsx-sync audit (`address-opsx-sync-drift`).

- 414f399: Add Train2Go Bridge status to Settings panel and rename tab from "Garmin" to "Extensions"
  - Rename Settings "Garmin" tab to "Extensions" to reflect multiple bridge support
  - Add Train2Go Bridge Extension status section (not installed / no session / connected)
  - Update FirstVisitState and NoBridgesState copy to mention both Garmin Connect and Train2Go

## 0.0.5

### Patch Changes

- 84e1776: Improve UX discoverability and feedback:
  - Add EmptyWorkoutState component showing guidance when workout has no steps
  - Add error explanation message when save button is disabled
  - Enhance step selection visual with ring effect and checkmark indicator
  - Add tooltip to drag handle with proper touch target (44x44px)
  - Add UndoRedoButtons to workout header with keyboard shortcut hints
  - Add selection hints for creating repetition blocks

- Updated dependencies
- Updated dependencies [791d3b2]
  - @kaiord/core@1.0.3

## 0.0.4

### Patch Changes

- Updated dependencies
  - @kaiord/core@1.0.2

## 0.0.3

### Patch Changes

- Updated dependencies
  - @kaiord/core@1.0.1

## 0.0.2

### Patch Changes

- Updated dependencies
  - @kaiord/core@0.1.3

## 0.0.1

### Patch Changes

- Updated dependencies
  - @kaiord/core@0.1.2
