## Why

Issue #1643 (parent #1670, story 47, Implementation Decisions "Session
check", Testing Decisions seam 3; ADR 0004). Looking at whether a Connection
works cost the athlete their data or a credential:

- Kaiord for Tanita downloaded the athlete's whole MyTANITA export on every
  popup open, every Refresh and every `ping` / `checkSession`, including the
  verification `ping` the Kaiord App sends when the extension announces
  itself on page load.
- Kaiord for TrainingPeaks minted and stored a new token on every check, from
  the popup or the App, and handed the App the athlete id.
- Kaiord for Garmin read one workout of the library on every `ping`, minting
  or refreshing a token first when it held none, and handed the App the whole
  read result, workout included.
- Kaiord for Train2Go handed the App the athlete's id and name and the
  coach's name and notes on every connection check.
- The WHOOP extension handed the App the WHOOP id and the capture time on
  every `status`.

## What Changes

- **One check contract.** Every check answers the manifest (where it did
  before), a typed `session` outcome (`signed-in`, `signed-out`,
  `not-answering`, `not-checked`) and the booleans older Apps read, and
  nothing else. It stores nothing and mints no token. Only the Platform saying
  so is `signed-out`.
- **Per extension.** Tanita: one `HEAD` of the export (allowlisted, no body
  read). Train2Go: the same `GET /api/v2/profile/ping`, profile dropped in the
  service worker. TrainingPeaks, Garmin, WHOOP: no request; a token a real
  request minted that has not expired (or a captured bearer) is `signed-in`,
  otherwise `not-checked`.
- **Explicit reads for what checks used to hand over.** `read-athlete-id`
  (TrainingPeaks, read just before a send; the token is minted here),
  `read-user-id` (WHOOP, before an import), `read-profile` (Train2Go, for the
  connect flow and the popup). Each App caller falls back to the old action
  when an older extension answers "Origin or action not permitted".
- **Popups keep what they show.** Train2Go's popup reads `read-profile` and
  the week as before. The TrainingPeaks and Garmin popups gain a "Not checked
  yet" state instead of claiming a sign-out they did not verify; they record
  no outage for it.
- **Kaiord App.** Probers read `session`; `not-checked` is the `installed`
  status with new `detail.notChecked` copy, never `attention`. The Garmin
  send gate and the TrainingPeaks import gate go ahead on `not-checked`.
- **Texts and proofs.** The sentences in the Tanita, Train2Go, TrainingPeaks
  and Garmin store listings, justifications and policy sections that
  described the costly checks are rewritten, with their `claims/*.json`
  entries and proofs; the WHOOP justification, policy section and READMEs
  follow. `check-privacy-policy` swaps three rules (floors unchanged); the
  bridge privacy golden gains the Tanita `HEAD` rule and the three new
  actions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bridge-core`: the Session check contract.
- `garmin-bridge`: the `ping` envelope.
- `spa-train2go-extension`: the connect flow links from `read-profile`.
- `spa-connections-page`: a check that asked nothing.
- `privacy-policy`: each section states what checking costs.

## Impact

- Five extensions (`background.js`; Garmin `garmin-oauth.js`, TrainingPeaks
  `tp-auth.js`; Garmin, TrainingPeaks, Train2Go, WHOOP popups), their tests.
- Kaiord App adapters and hooks for the probers, the TrainingPeaks push and
  import, the WHOOP import, the Train2Go link; `connections` copy (en, es).
- `scripts/fixtures/bridge-privacy-surface.json`, `claims/*.json`,
  `packages/docs/legal/privacy-policy.md`, `check-privacy-policy`.
- Not changed: the wording of existing notices (#1644 owns it), the
  Train2Go thin Bridge (#1641).
