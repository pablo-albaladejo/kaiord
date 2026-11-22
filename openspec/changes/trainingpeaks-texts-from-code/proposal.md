## Why

Review of 2026-11-22, issue #1628 (parent #1670, stories 58, 59, 66, 67). The
store listing, permission justifications, `extDescription` and privacy-policy
section of Kaiord for TrainingPeaks described a body-metrics reader. The code
on this branch also writes Workouts to the athlete's TrainingPeaks calendar
(`push-workout`, `POST /fitness/v6/athletes/{id}/workouts`, cabled in the
Kaiord App by `add-trainingpeaks-workout-push`), which no text disclosed. The
texts offered a weight write the Kaiord App never sends, claimed "weight and
more" where the Kaiord App keeps only weight, and did not say that every
session check mints and stores a token.

## What Changes

- **Texts from the code.** The Short and Detailed Description of
  `packages/trainingpeaks-bridge/store-listing.md`, `extDescription`, the whole
  of `privacy-justification.md` and the TrainingPeaks section of the privacy
  policy are rewritten from what the code does today, in English, ready for a
  first publish. Athlete-facing prose says "Kaiord for TrainingPeaks"; the
  extension's own name is unchanged. The policy section is renamed "Kaiord for
  TrainingPeaks Extension".
- **Register.** `claims/trainingpeaks.json` registers all four surfaces; each
  claim points to its proof.
- **Proofs.** `test/token-confinement.test.js` in the bridge (token kept in
  `chrome.storage.local`, minted on every session check, in no answer to any
  external action, every request to `tpapi.trainingpeaks.com`, no DELETE, PUT
  or PATCH in the allowlist) and a Kaiord App test that a Workout is placed on
  its own day.
- **Shared file split by section.** The claims guard refused a file named by
  two register files, so the privacy policy (one section per extension) could
  only ever belong to Garmin. A file may now be split between register files
  by `sections` or `keys`, as long as none is in two.
- **Policy guard.** `check-privacy-policy` follows the renamed heading. The
  rule for the weight write-back is replaced by rules for the Workout write,
  no delete or overwrite, the unused weight write and the token minted on every
  check; the section floor rises from 13 to 16.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-claims`: TrainingPeaks texts registered; a file split by section.
- `privacy-policy`: the TrainingPeaks section discloses the Workout write.

## Impact

- `@kaiord/trainingpeaks-bridge` (private): texts, `extDescription`, a test.
  Nothing is published; the extension has never been in the store.
- `@kaiord/docs`: the TrainingPeaks policy section and its guard.
- `@kaiord/workout-spa-editor`: one test.
- `scripts/check-claims.mjs` and its test; `claims/README.md`.
- Out of scope: the popup copy (#1643 changes the session check, #1646 the
  wording and Spanish), the store screenshot (needs a capture), and the
  canonical `privacy-policy` spec's old TrainingPeaks bullet, which a later
  sync of this change replaces.
