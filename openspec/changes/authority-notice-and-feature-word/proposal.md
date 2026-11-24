## Why

Owner decisions of 2026-11-23 (#1659, #1666). The App picks the Authority by
itself (`automatic-authority`), so when a Platform the athlete connects later
starts deciding a kind another Platform was deciding (a Tanita scale after
months of TrainingPeaks weight), the value the Day shows changes and nothing
says why. The landing says "Kaiord picks which platform decides" without
saying that it does so only for health data. And the athlete reads
"Capability" / "Capacidad", an internal word, for the parts of the App they
turn on.

## What Changes

- **One notice when the Authority changes**: the first time a connected
  Platform starts deciding a kind another Platform was deciding, an info
  notice names the consequence ("Tanita now decides: Weight. Days only
  TrainingPeaks reported don't change.", English and Spanish, the kind by
  its Connections label; kinds of health data only) with one link:
  the kind's Connections row, or the matrix while it is on. No dialog (ADR
  0003). Once per kind and new Authority, remembered on the athlete's
  preferences row (synced), never for a Platform the athlete chose in the
  matrix, never for a kind's first Platform or one deciding again after a
  disconnect.
- **The landing limits "Kaiord picks" to health data** and says Activities,
  planned sessions and Workouts are kept from every source (English and
  Spanish), proven by tests that read the rule.
- **The athlete reads "Features" / "Funciones"** for the settings section of
  Capabilities. Code and internal docs keep "Capability"; GLOSSARY.md and the
  UX glossary say so, and `check-retired-terms` holds "Capability" /
  "Capacidad" off every athlete-facing text, with reasoned exceptions (an
  extension's declared data tokens, aerobic and anaerobic capacity zones, a
  developer log line).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `spa-authority`: one notice when the Authority changes.
- `landing-page`: "Kaiord picks" is for health data.
- `spa-capabilities`: the athlete-facing word.

## Impact

- `@kaiord/workout-spa-editor` (private): `authority-change.ts`, a live read
  and a watcher hook, the notice component mounted in `App.tsx`, the
  Connections row focus from `?kind=`, `userPreferences.authorityDeciders`
  (optional, unindexed, no Dexie version), the `connections` and `settings`
  dictionaries, unit and e2e specs.
- `@kaiord/landing` (private): three sentences, English and Spanish;
  `claims/landing.json`.
- `scripts/retired-terms.vocab.mjs` and its test; GLOSSARY.md; the UX
  glossary.
