## Why

The owner's decisions of 2026-11-23 on the Kaiord Bridges (#1641, #1642,
#1644) close what the block's designs left open:

- ADR 0004's last consequence left undecided where a working popup's useful
  information (the coach's notes, the week) comes from when a Bridge holds no
  logic. Train2Go's popup read it and cached the week for 5 minutes.
- The extensions strip Session secrets, but hand the App every other field,
  personal ones included (Train2Go's birthday and gender, Garmin's author and
  activity places), which no Connector reads.
- Three entries are surface nothing uses: Train2Go's activity tooltip path,
  TrainingPeaks' weight write and Garmin's `connect.garmin.com` host.
- The Spanish Try-again notice ("…no puedes usarlo en Kaiord.") uses a
  gendered pronoun for every Platform.

## What Changes

- **Bounded exception (ADR 0004 amended).** A popup may read and interpret
  data only for its own window, when the athlete opens it, through the closed
  list, never stored on disk and never handed to the App (a read may stay in
  the extension's memory: Train2Go's week, at most once every 5 minutes).
  Each `background.js` declares `POPUP_READS` and `POPUP_READ_SCRIPTS`; a new
  root guard, `check-bridge-popup-reads.mjs` (`pnpm lint:bridge-popup-reads`),
  holds all five to it, with the storage keys each may write listed with
  their reasons in `scripts/bridge-popup-reads.vocab.mjs`. Train2Go's Session
  check no longer reaches the popup's parser and its popup stores no weekly
  rollup.
- **Personal fields trimmed.** Each extension declares in `personal-fields.js`
  the personal fields of its answers that its Connector does not read; the
  shared `bridge-answer.js` removes them by name.
- **Unused surface removed**: the tooltip path, the weight write with its
  schema and the `write:body` capability on TrainingPeaks, and
  `connect.garmin.com` from both Garmin manifests.
- **Spanish wording**: "{platform} no responde, así que ahora mismo no puedes
  usar {platform} en Kaiord."
- Listings (en, es), justifications, the privacy policy, claims, the
  privacy-surface golden and the privacy-policy check follow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bridge-core`: popup reads bounded to the popup; answers without personal
  fields no Connector reads; no declared surface without a user; the Spanish
  Try-again wording.

## Impact

- The five extensions and `packages/_shared/bridge-core` (`bridge-answer.js`,
  `connection-notices.js`), a new `personal-fields.js` per extension.
- `scripts/check-bridge-popup-reads.mjs` and its vocab, the privacy-surface
  golden, `packages/docs/scripts/check-privacy-policy.mjs`.
- `@kaiord/i18n`'s generated notices copy; App tests that read each
  Connector's output from trimmed answers; comments on TrainingPeaks'
  `write:body`.
- `docs/adr/0004-thin-bridge-smart-connector.md` (amendment), store listings,
  justifications, the privacy policy and `claims/*.json`.
