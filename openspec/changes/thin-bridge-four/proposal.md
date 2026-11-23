## Why

ADR 0004 (`docs/adr/0004-thin-bridge-smart-connector.md`) decides that a
Bridge only lends the athlete's Session and executes requests from a closed
list of allowed paths, while what to ask for, how to read the answer,
retries and the mapping to KRD live in the Connector inside the Kaiord App,
where they are typed, tested and shipped without a store review. Train2Go
proved the shape (#1641, `openspec/changes/thin-bridge-train2go/`). This
change repeats it on Kaiord for Garmin, Tanita, TrainingPeaks and WHOOP
(issue #1642, stories 36–51 of #1670).

## What Changes

- **Protocol version 2 for the four extensions.** One external action,
  `{ action: "request", method, path, body? }`, replaces every action that
  read, wrote or parsed for the App (Garmin `list`, `push`, `activities`,
  `push-body-composition`, `schedule`, `unschedule`, `calendar-find`; Tanita
  `read-export-csv`; TrainingPeaks `read-metrics`, `push-weight`,
  `push-workout`, `read-workout`; WHOOP `whoop-fetch`). The extension runs
  only an entry of its closed `ALLOWED` list (method + path pattern) and
  answers the Platform's raw answer `{ status, contentType, body }` unread;
  a dead Session is `needsReauth`, another failure keeps its `status`.
- **Writes through the same list.** A body is accepted only on an entry that
  names a schema (Garmin `workout`, `fit-file`, `schedule`; TrainingPeaks
  `workout`, `weight`) and only when it matches that schema, checked in the
  extension by a new vendored master, `bridge-request-gate.js`, so the
  extension never forwards an arbitrary payload. Garmin keeps its one
  deadline and send cut-off, now for every request.
- **Kept actions.** Session checks (`ping`, `checkSession`, WHOOP `status`),
  the explicit reads of #1643 (`read-athlete-id`, `read-user-id`),
  `open-*`, `profile-snapshot(-clear)` and `set-theme`. Tokens stay in the
  extension; the Garmin OAuth1→OAuth2 exchange and the TrainingPeaks token
  mint still run there, only before a real request.
- **The Connectors read.** Garmin (schedule id, one workout's entries of a
  calendar month, activities pacing and retry), Tanita (a login page served
  in place of the export), TrainingPeaks (paths from the athlete id, read
  pacing, the 402 message, a workout read kept to its id and day) and WHOOP
  (JSON or a cut raw body, WHOOP's refusal status) move to the App, with the
  extension's former cases ported.
- **Compatibility.** The App sends `request` first and falls back to the
  legacy action when the envelope says protocol 1; all five extensions are
  accepted on `[1, 2]`.
- **Internal channel closed to content scripts.** All four use
  `createInternalDispatch` with their popup's actions; WHOOP keeps a
  listener that only takes the bearer from its own `app.whoop.com` content
  script and answers nothing. A new rule of `check-bridge-exact-origin.mjs`
  (R-BridgeInternalDispatch) requires it of every bridge.
- **A worker-scope fix.** `bearer-fetch.js` and `session-fetch.js` both
  declared `UNAUTHORIZED_STATUS` at the top level; in one service worker
  that is a SyntaxError, so Kaiord for TrainingPeaks could not load its
  Bearer transport. The master is wrapped, and a parity test evaluates every
  service worker with its imports in one scope.
- **Public texts** say the extensions hand the answers over unread and the
  App keeps what it uses; the claims register, the privacy-policy guard and
  the privacy-surface golden follow. Popups and notices are unchanged.

## Capabilities

### Modified Capabilities

- `bridge-core`: the request gate master; the Bearer transport's raw mode;
  service workers evaluate in one scope.
- `garmin-bridge`, `whoop-bridge`: external surface is `request` on a closed
  list; the internal channel is the popup's.
- `tanita-bridge`, `trainingpeaks-bridge` (new): the same, recorded.
- `spa-bridge-protocol`: every extension accepted on protocols 1 and 2.
- `spa-garmin-extension`, `spa-trainingpeaks-extension`,
  `spa-whoop-extension`: the Connector reads raw answers and falls back.
- `privacy-policy`: Garmin, TrainingPeaks and WHOOP sections say answers
  reach the App unread.

## Impact

- Store version (protocol 1) with the new App: works through the legacy
  actions, one extra local message per call, no extra network request.
- New extension (protocol 2) with an App tab loaded before this change: the
  old tab accepts only protocol 1 for these four, so it shows the extension
  as outdated (Update) and its legacy actions are refused; reloading the tab
  loads the current App. Release the App, then publish the extensions.
- Raw answers now reach the App tab in the athlete's browser: a Garmin
  calendar month, a TrainingPeaks workout, a WHOOP body as sent. The App
  keeps only what it used to receive; nothing is stored or sent. The texts
  say so.
