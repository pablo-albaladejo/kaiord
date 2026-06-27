## 1. Domain: workout-level notes field (`@kaiord/core`)

- [x] 1.1 Write a failing test asserting `workoutSchema` accepts an optional workout-level `notes` string and leaves it `undefined` when omitted
- [x] 1.2 Add `notes: z.string().optional()` to `workoutSchema` in `packages/core/src/domain/schemas/workout.ts`; make the test pass
- [x] 1.3 Document the workout-level `notes` field in `docs/krd-format.md` (distinct from step `notes` and `name`; markdown allowed; no domain length cap)
- [x] 1.4 Run `pnpm --filter @kaiord/core test` and `pnpm --filter @kaiord/core build` green

## 2. ZWO adapter: notes ↔ description (`@kaiord/zwo`)

- [x] 2.1 Write a failing round-trip test: KRD workout `notes` → ZWO `<description>` → KRD `notes` (exact-string equality)
- [x] 2.2 Update `zwift-to-krd.converter.ts` to read ZWO `description` into KRD workout-level `notes` (canonical home), keeping a tolerant read of legacy `extensions.zwift.description` when present
- [x] 2.3 Update `krd-to-zwift/workout-properties.ts` to write KRD workout `notes` into ZWO `description` (precedence: `notes ?? zwift.description`)
- [x] 2.4 New round-trip test asserts workout-level `notes` is the canonical home; legacy `extensions.zwift.description` retained for back-compat so existing assertions stay green (lower-risk than removal, per design D3 compatibility intent)
- [x] 2.5 Run `pnpm --filter @kaiord/zwo test` and build green (293/293)

## 3. FIT adapter: best-effort export note (`@kaiord/fit`)

- [x] 3.1 Write a failing test: exporting a KRD with workout-level `notes > 256` chars succeeds and attaches a 256-char-truncated note to the first step (when that step has no note); no error raised
- [x] 3.2 Implement the best-effort attach in the FIT writer (leading 256 chars, deterministic, never overwrites a step's own note); FIT→KRD import does NOT lift step notes into workout `notes`
- [x] 3.3 Truncation reuses the shared `convertNotes` helper, which `logger.warn`s on truncation — same honesty path as existing step-note truncation
- [x] 3.4 Run `pnpm --filter @kaiord/fit test` and build green (476/476)

## 4. Application: coach description → KRD notes (`@kaiord/workout-spa-editor`)

- [x] 4.1 Write tests asserting `krd` workout-level `notes` equals `activity.description` when present and is omitted when absent (`structured-workout.test.ts` for `withCoachNotes`; `coaching-workout-builder.test.ts` for the chokepoint)
- [x] 4.2 Add immutable `withCoachNotes(krd, description)` to `utils/structured-workout.ts` and apply it at the single chokepoint `buildStructuredCoachingWorkout` (covers AI + manual without touching each builder); markdown `[label](url)` preserved verbatim; `raw.description` kept
- [x] 4.3 AI + manual paths both flow through `buildStructuredCoachingWorkout`; the plain/raw path keeps `krd: null` (no structured workout, correctly no notes)
- [x] 4.4 Coaching application tests green (156/156 + 6 new)

## 5. Application: prefetch-on-demand (`@kaiord/workout-spa-editor`)

- [x] 5.1 Tests: AI + manual convert with `description === undefined` await `expandActivity` (read-day) before proceeding (`use-coaching-ai-handler.test.tsx`, `use-coaching-manual-handler.test.tsx`)
- [x] 5.2 Tests assert already-loaded descriptions do NOT re-fetch; known-empty `""` is `!== undefined` so it also skips; `expandDay` not advancing `lastSyncedAt` remains covered by `expand-day.test.ts`
- [x] 5.3 Root cause was a race: the dialog fired `expandActivity` fire-and-forget on open. Made it return its promise (`use-coaching-activities.ts`) and `await` it in the AI + manual convert handlers when description is unloaded; best-effort try/catch so a transport failure falls through to convert-without-description
- [x] 5.4 Coaching application + CoachingCard tests green (107 + handler suites)

## 6. Editor UI: workout-level notes field

- [x] 6.1 Added `CoachNotesField` to `WorkoutMetadataEditor`, reading/writing `structured_workout.notes` via `useMetadataForm` + `buildUpdatedKrd` (persists through the existing onSave → Dexie path); tests render + persist
- [x] 6.2 Coaching sidebar untouched — still renders `raw.description` with links (existing tests green)
- [x] 6.3 `CoachNotesField` uses only static placeholder text — no `console.*`/toast interpolation; new tests follow `should` + AAA
- [x] 6.4 WorkoutMetadataEditor tests green (11/11); full SPA suite + guards run in verification (group 7)

## 7. Verification & release

- [x] 7.1 `pnpm -r build` (exit 0) + `pnpm -r test` (exit 0, all packages) + `pnpm lint` (exit 0) + `pnpm test:scripts` 511/511 — all green
- [x] 7.2 `pnpm lint:specs` 51/51 and `npx openspec validate train2go-coach-links --strict` pass
- [x] 7.3 Changeset added (`.changeset/train2go-coach-links.md`, minor: core/zwo/fit/spa)
- [ ] 7.4 Manual smoke (USER): weekly-import an activity, convert, verify links appear in app + survive ZWO export + best-effort on Garmin push
