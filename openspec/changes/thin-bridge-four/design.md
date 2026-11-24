## Context

The shape is the one #1641 proved on Train2Go
(`openspec/changes/thin-bridge-train2go/design.md`): protocol version in the
identity and the reply envelope; one external action
`{ action: "request", method, path }` running only an entry of a closed
`ALLOWED` list and answering `{ status, contentType, body }` unread; a dead
Session as `needsReauth`; the App's per-extension accepted versions
(`adapters/bridge/bridge-protocol.ts`) and the fallback to the legacy actions
for an extension one version behind; `createInternalDispatch` answering only
the extension's own pages. #1643 (cheap Session check, explicit reads) and
#1644 (four Connection notices) are kept as they are.

The four extensions add what Train2Go did not have: writes with a body
(Garmin, TrainingPeaks), a token the extension mints (Garmin, TrainingPeaks),
logic that paced and retried (Garmin activities, TrainingPeaks reads) and a
read run from a page's tab (WHOOP).

## The closed lists

Before (golden at the merge base) and after (`scripts/fixtures/bridge-privacy-surface.json`).

| Extension     | Before                                                                                                                                                                                                         | After                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Garmin        | GET `workouts(\?.*)?`; POST `workout`; POST `upload(\/.*)?`; GET `activities/search/activities(\?.*)?`; POST and DELETE `schedule/\d+`; GET `calendar-service/year/\d{4}/month/\d{1,2}`                        | GET `workouts?start=\d+&limit=\d+`; POST `workout` body `workout`; POST `upload/.fit` body `fit-file`; GET `activities/search/activities?start=\d+&limit=\d+`; POST `schedule/[1-9]\d*` body `schedule`; DELETE `schedule/[1-9]\d*`; GET the month (unchanged) |
| Tanita        | GET and HEAD `/en/user/export-csv`                                                                                                                                                                             | unchanged                                                                                                                                                                                                                                                      |
| TrainingPeaks | GET `/users/v3/token`; GET metrics `{id}/consolidatedtimedmetrics/[^/]+/[^/]+`; POST `consolidatedtimedmetric`; POST `workouts`; GET `workouts/\d+`                                                            | metrics range with two `YYYY-MM-DD`; POST `consolidatedtimedmetric` body `weight`; POST `workouts` body `workout`; GET `workouts/\d+`. The token path left the list (its answer is the token)                                                                  |
| WHOOP         | GET prefixes `/core-details-bff/v0/cycles/details`, `/metrics-service/v1/metrics/user/`, `/activities-service/v1/sports/history`, `/advanced-labs-service/v1/biomarker-tests`, `/health-service/v2/stress-bff` | six anchored GET patterns: cycles `?id&startTime&endTime`, heart-rate metrics `{id}?name=heart_rate&start&end&step`, sports `?countryCode=XX`, biomarker tests, one test's `summary`, stress `{YYYY-MM-DD}`; moved from `content.js` to `background.js`        |

Every change shrinks what a request may name; the App's path builders are
checked against each list by a test that reads `background.js`
(`test-utils/bridge-closed-list.ts`).

## How writes are constrained

`bridge-request-gate.js` (vendored to the four) admits a message only when
its keys are a subset of `action`, `method`, `path`, `body`; method + path
match an entry; a `body` is present exactly when the entry names a schema;
and the body matches that schema (`BODY_SCHEMAS` in the extension):

- Garmin `workout`: a closed object (`workoutName`, `sportType`,
  `workoutSegments` 1–20 of `segmentOrder` / `sportType` / `workoutSteps`,
  optional `poolLength`, `poolLengthUnit`, `isSessionTransitionEnabled`);
  each step is bounded JSON (64 KiB), its shape being the App's Garmin
  writer's. `fit-file`: 14 B – 1 MiB of bytes with `.FIT` at bytes 8–11.
  `schedule`: `{ date }`, a real calendar date.
- TrainingPeaks `workout`: the `trainingPeaksWorkoutSchema` shape with
  `workoutId: 0` (a new workout only) and a real `workoutDay`; `weight`: one
  type-9 detail.

Anything else is `Request not allowed`, `retryable: false`, with no token
touched and nothing sent. The privacy-surface guard records each entry's body
schema name, so adding a body to an entry is golden drift.

## What moved where

| Logic                                                       | Before                          | After                                                                     |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Garmin paths (list, activities, month 0-based, schedule)    | `background.js`                 | `adapters/garmin/connector/garmin-paths.ts`                               |
| Garmin id/date validation before sending                    | `background.js`                 | `adapters/garmin/connector/garmin-ids.ts` (the list still refuses too)    |
| Garmin schedule id, one workout's entries of a month        | `background.js`                 | `adapters/garmin/connector/read-garmin-answers.ts`                        |
| Garmin activities throttle (30 s), in-flight latch, backoff | `background.js`                 | `adapters/garmin/connector/garmin-activities-pull.ts`                     |
| Garmin activities kill switch (`activitiesPullDisabled`)    | `background.js`                 | removed (D3)                                                              |
| Garmin deadline and send cut-off                            | `background.js` (calendar only) | `background.js`, every request (D1)                                       |
| Tanita login page in place of the export                    | `background.js` `looksLikeHtml` | `adapters/tanita/connector/read-tanita-export.ts`                         |
| TrainingPeaks paths from the athlete id                     | `background.js`                 | `adapters/trainingpeaks/connector/trainingpeaks-paths.ts`                 |
| TrainingPeaks read spacing (150 ms)                         | `background.js`                 | `adapters/trainingpeaks/connector/trainingpeaks-read-pacing.ts`           |
| TrainingPeaks 402 message                                   | `background.js`                 | `adapters/trainingpeaks/trainingpeaks-pushed-workout.ts`                  |
| TrainingPeaks workout read kept to id and day               | `background.js`                 | `adapters/trainingpeaks/connector/read-trainingpeaks-answers.ts`          |
| WHOOP closed list                                           | `content.js` prefixes           | `background.js` `ALLOWED`; `content.js` keeps a GET-on-the-API-host check |
| WHOOP JSON or cut raw body                                  | `content.js`                    | `adapters/bridge/whoop-connector/read-whoop-answer.ts`                    |
| Token mint (Garmin OAuth, TrainingPeaks cookie→token)       | extension                       | extension, unchanged, only before a real request                          |
| Protocol fallback                                           | `train2go-bridge-request.ts`    | `adapters/bridge/thin-bridge-request.ts` (`callThroughBridge`), shared    |

The transports keep their signatures, so no use case and no safe-writes
logic changed (`application/safe-writes/` untouched; its seam tests pass,
the TrainingPeaks fake now speaking protocol 2).

## Compatibility and deploy order

|                              | App before this change                                                                                | App after                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| Extension 10.4 (protocol 1)  | works                                                                                                 | works through the legacy actions |
| Extension after (protocol 2) | accepts only 1: shown as outdated (Update); an already-discovered tab gets its legacy actions refused | works                            |

Deploy order: release the App first (it serves both), then publish the four
extensions. A tab opened before the App release recovers on reload.

## Decisions

### D1. Garmin's deadline stays in the extension, now for every request

A hung fetch in an MV3 service worker is killed by Chrome at about 30 s and
the App cannot abort a fetch it does not own, so only the extension can tell
"nothing was sent" from "sent, outcome unknown" — what safe writes rely on.
That is transport, not reading; applying it to every request (not only the
calendar) is simpler and gives every write the same no-late-start guarantee.
The App waits `SPA_ACTION_TIMEOUT_MS` (longer than the deadline) for writes.

### D2. Lists tightened where the App names the path

Before, the extension built the paths; now the App does, so a loose pattern
(`(\?.*)?`, `upload(\/.*)?`, `\d+` with leading zeros, WHOOP prefixes) is
what an App bug could reach. Each pattern now matches only what the
Connector builds.

### D3. The Garmin activities kill switch is removed

It was a `chrome.storage.local` flag nobody set, meant to switch the pull
off if Garmin changed the endpoint without a store release. The pull's
reading is now in the App, which ships without one, so the switch has no
job left. Its justification sentence is removed.

### D4. Raw answers reach the App tab

As on Train2Go: a Garmin calendar month (other workouts, activities,
titles), a TrainingPeaks workout (title, notes, recorded data) and WHOOP
bodies now reach the App tab in the athlete's browser; the Connector keeps
only what the extension used to hand over. Nothing is stored or sent. The
justifications and the policy say so.

### D5. WHOOP keeps its open-tab requirement and a second internal listener

Reads still run in the `app.whoop.com` tab (the notice exception is
unchanged). The content script's `capture-token` is internal too; it is
taken only from this extension's content script on `app.whoop.com`, stored,
and never answered, so `createInternalDispatch` can serve the popup alone.
The exact-origin guard allows a second `onMessage` listener only when it
takes at most two parameters (it cannot answer).

### D6. One extra athlete-id read per TrainingPeaks metrics read or copy check

The App builds the path from the athlete id, which only the token exchange
returns (`read-athlete-id`, #1643). A send already reads it, and passes it to
the copy check; a metrics import and a standalone copy check read it once
more, a local message on a token that is normally already minted.

### D7. The worker-scope collision

`importScripts` evaluates every file in one global lexical scope, which the
vitest suites (`require`, one module scope each) cannot see. The masters are
wrapped in one scope object each, and `check-bridge-core-parity.test.mjs`
now evaluates every service worker with its imports as Chrome does. This
was found here and is likely live in the published TrainingPeaks extension;
it is not verified on a real install.

## Known tension: the popups (ADR 0004)

The popups show what they showed. What stays in each extension only for its
popup, to remove once the source of that information is decided:

- Garmin: the Session check `ping` (stored tokens' validity), the profile
  summary the App sends (`profile-snapshot`) and the last push receipt read
  from storage.
- Tanita: `checkSession`, the `HEAD` of the export and its
  `isHtmlContentType` reading.
- TrainingPeaks: `checkSession` (stored token's validity).
- WHOOP: `popup-status` (captured bearer, decoded user id, capture time) and
  `tab-open`.
