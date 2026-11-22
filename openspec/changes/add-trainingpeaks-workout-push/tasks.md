## 1. Converter (`@kaiord/trainingpeaks`)

- [x] 1.1 Add `trainingpeaks-workout.schema.ts` — Zod shapes for the block,
      step, structure and POST body, with `structure` typed as the string the
      request requires.
- [x] 1.2 Add `trainingpeaks-workout-polyline.ts` — block expansion, total
      duration, and the preview-graph builder.
- [x] 1.3 Add `trainingpeaks-target-band.ts` — the shared percentage
      arithmetic plus the zone-midpoint tables.
- [x] 1.4 Add `trainingpeaks-workout-targets.ts` — per-family recipes and the
      `Lossy conversion:` warnings.
- [x] 1.5 Add `trainingpeaks-workout-steps.ts` — KRD step → TrainingPeaks step,
      including the named placeholder for non-time durations.
- [x] 1.6 Add `krd-to-trainingpeaks-workout.converter.ts` and export it, along
      with `krdToTrainingPeaksStructure` for structure-only callers.
- [x] 1.7 Pin the converter against the real capture in
      `trainingpeaks-workout.test-fixtures.ts` + converter tests.

## 2. Bridge (`@kaiord/trainingpeaks-bridge`)

- [x] 2.1 Add the `POST /fitness/v6/athletes/{id}/workouts` allowlist entry on
      a single physical line.
- [x] 2.2 Add the `push-workout` action, relaying the payload verbatim and
      naming the 402 as an account limit.
- [x] 2.3 Add `write:workouts` to `BRIDGE_MANIFEST` and to
      `bridge-identity.js`.
- [x] 2.4 Add `push-workout` to `EXTERNAL_ACTIONS` and the module exports.
- [x] 2.5 Refresh `scripts/fixtures/bridge-privacy-surface.json`.
- [x] 2.6 Extend `test/background.test.js` — endpoint and Bearer, structure
      relayed as a string, the 402 message, and the missing-payload refusal.

## 3. SPA (`@kaiord/workout-spa-editor`)

- [x] 3.1 Add `trainingpeaks-workout-transport.ts`.
- [x] 3.2 Narrow `SUPPORTED_EXPORT_TYPES["trainingpeaks-bridge"]` to
      `["workout"]` by editing the array, never deleting the key.
- [x] 3.3 Add `trainingpeaks-push-fn.ts` — the `pushFn` adapter and repos.
- [x] 3.4 Add `trainingpeaks-thresholds.ts` + tests — pace-unit conversion,
      `lthr` deliberately not reused as max HR.
- [x] 3.5 Add `use-trainingpeaks-push.ts` mirroring `useGarminPush`.
- [x] 3.6 Add `TrainingPeaksPushButton` + `useTrainingPeaksGate`, mounted in
      `WorkoutDetailFooter` behind the gate. Chose a sibling over
      parameterising `PushButton`: that one is welded to `useGarminBridge`'s
      shared state and the ribbon's Garmin gate, so splitting it would change
      the shipped Garmin path for no gain here.
- [x] 3.7 No seeding code needed — with `["workout"]` supported,
      `bridgeRouteTypes` offers the route on the Connections page and the
      athlete enables it there, same as every other route.
- [x] 3.8 Button tests, including that a refusal is shown rather than
      swallowed back to idle.
- [x] 3.9 Update `bridge-route-types.test.ts`, which asserted the old
      "no export at all" state; it now asserts the narrowing to `["workout"]`
      and that `write:body` stays excluded.

## 4. Specs and release

- [x] 4.1 Write the proposal, design, and the two spec deltas.
- [x] 4.2 `pnpm lint:specs` — 67/67.
- [x] 4.3 Changeset.
- [x] 4.4 Full `pnpm -r test && pnpm -r build && pnpm lint` — all exit 0.

## 5. End-to-end validation (manual) — the owner's, with a real account

> Reopened 2026-11-23 by #1636. These steps need a real TrainingPeaks account
> and are left to the owner; no agent runs them. A Basic account reaches only
> today and tomorrow, so step 5.4 places a real coaching-plan date only on
> Premium (14-day trial available). See design.md, "Why the work stops here"
> and "The limit is stated before sending".

- [ ] 5.1 Load `train2go-bridge` and `trainingpeaks-bridge` unpacked; run the
      SPA on `localhost:5173` (both manifests already allow that origin).
- [ ] 5.2 Enable the `training-plan ← train2go-bridge` import route, sync a
      week, and confirm a coaching activity with a description lands.
- [ ] 5.3 Convert it with AI and confirm a `structured` workout with a
      repetition block.
- [ ] 5.4 Enable the `workout → trainingpeaks-bridge` export route and push.
      Note the planning horizon: a Basic account accepts only today and
      tomorrow, in the ATHLETE's timezone.
- [ ] 5.5 Confirm the intervals render in TrainingPeaks' own builder, then push
      again and confirm no duplicate.
- [ ] 5.6 On a Basic account, open a workout dated two days ahead: confirm the
      notice shows before sending, then send and confirm TrainingPeaks' 402 is
      shown with the same reason, in English and in Spanish.
- [ ] 5.7 Delete the pushed copy in TrainingPeaks, send again from Kaiord, and
      confirm one copy exists. Confirm `read-workout` on a deleted id answers
      `404` (the only status the App treats as gone).
- [ ] 5.8 (#1105) Sign out of TrainingPeaks and confirm the App still asks to
      sign in (the exchange is redirected or answers 401/403, so
      `needsReauth` is still set).

## 6. Limit stated before sending, safe re-send, honest session failure (#1636)

- [x] 6.1 `isPastBasicHorizon` and the send control's notice for a day after
      tomorrow, shown before any request, in English and Spanish.
- [x] 6.2 Carry TrainingPeaks' status on `TrainingPeaksBridgeError`; map a 402
      to the same explanation (`reason: "horizon"`).
- [x] 6.3 Bridge `read-workout` action and its single-workout `GET`
      allowlist entry, returning only id and day; privacy golden refreshed;
      token-confinement test covers the action.
- [x] 6.4 `checkTrainingPeaksCopy`: read the recorded copy before a re-send,
      mark `forceRepush` only on a 404.
- [x] 6.5 Safe-writes test against a fake TrainingPeaks holding state (send
      twice leaves one; deleted copy re-sent; unreadable copy assumed present).
- [x] 6.6 #1105: `tp-auth` sets `needsReauth` only for a dead session;
      `checkSession` reports the distinction; the push says TrainingPeaks is
      not answering instead of asking to sign in.
- [x] 6.7 Store listing, permission justification, privacy policy and
      `claims/trainingpeaks.json` updated; `pnpm lint:claims` passes.
- [x] 6.8 Spec deltas for the above; `openspec validate --strict` passes.
