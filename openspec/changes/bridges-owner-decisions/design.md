## Context

The thin-Bridge block (`thin-bridge-train2go`, `thin-bridge-four`,
`bridges-review-fixes`) left the popup's reading as a known tension and
handed every answer to the App with only its Session secrets removed. The
owner decided both on 2026-11-23.

## Decisions

### D1. The popup's bounded exception, held by a guard

ADR 0004's last consequence now reads: a working extension's popup may read
and interpret data only for its own window, when the athlete opens it,
through the same closed list of paths, without storing it beyond the popup's
lifetime and without ever handing it to the App. The old open question stays
quoted under "Amendments" as resolved.

Each `background.js` declares `POPUP_READS` (internal actions that read for
the popup) and `POPUP_READ_SCRIPTS` (scripts only they use); four bridges
declare both empty. `check-bridge-popup-reads.mjs` reads the TypeScript AST:

| Rule                      | Fails when                                                                                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `R-PopupReadsDeclared`    | the two are not literals; a popup read is in `EXTERNAL_ACTIONS` or missing from `INTERNAL_ACTIONS`                                                                                                                                               |
| `R-PopupReadsUnreachable` | any other `handleAction` case (every App-facing action included) reaches a popup read's handler or a binding loaded from a popup-read script; a content script loads one                                                                         |
| `R-PopupReadsClosedList`  | a path a popup read's handler spells (a `${…}` tried as a number, a date, a word) matches no `ALLOWED` entry; code it reaches calls `fetch` without `isAllowed`; a popup-read script uses `fetch`, `XMLHttpRequest`, `chrome` or `importScripts` |
| `R-PopupReadsNotStored`   | code a popup read reaches touches `chrome.storage`; popup.js writes it; any shipped file writes a key not listed for its bridge, or keys the source does not spell                                                                               |

Allowed keys (`scripts/bridge-popup-reads.vocab.mjs`, each with its reason):
`bridgeHealth` (the popup's own Connection health), `kaiordTheme` (the App's
theme), on Garmin and Train2Go `profileSnapshot`, `lastPushReceipt` (what the
App sends) and `bridgeTelemetry` (error log); Garmin's two OAuth tokens,
TrainingPeaks' `tpAccessToken`, WHOOP's captured bearer, its account id and
capture time. None holds popup-read data.

Applying it found two real cases on Train2Go, both fixed: the Session check
read the ping through the popup's `parsePingJson` (now a yes/no of its own),
and the popup cached the week for 5 minutes in `lastWeeklyRollup` (now read
on every open, stored nowhere; `profile-snapshot-clear` still removes a key
an older version left).

Rejected: a dedicated popup-only file per extension (moves code without
proving reachability) and a runtime check (cannot see a path no test drives).
Known gap: reachability follows the top-level bindings of `background.js`; a
helper defined inside a function body is seen as part of that function.

### D2. Personal fields: trimming by name, still a thin Bridge

Each extension declares, in one file (`personal-fields.js`), the personal
fields of its answers that its Connector does not read: `json` member names
and `html` form-control names. `bridge-answer.js` removes them after the
Session secrets, comparing names in lower case without `_` or `-`; an
`<input>` goes alone, a `<select>`/`<textarea>` with its content. It looks at
no value, moves nothing, reads no structure and never parses HTML beyond the
tag it already matched for secrets; an answer with nothing to remove is the
same bytes. That keeps the ADR's rule: what to keep and how to read it is
still the Connector's. Text outside a named field (a name printed in a page)
is not trimmed; that would be reading.

The list per Platform is derived from what the Connector reads (kept) and the
answer's personal members (removed); a scan of every Connector and Platform
package for the listed names found none read, except WHOOP's
`max_heart_rate`, which was left off.

| Platform      | Removed besides name, birth date, gender/sex, email, phone and address fields                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Train2Go      | page: height, fat, imc, smoker, user_notes; ping: surname, height, weight, bpm_max, bpm_rest, trainer, user_notes  |
| Garmin        | author, display_name, owner names and pictures, shared_with_users, start/end latitude and longitude, location_name |
| TrainingPeaks | username, coach_comments, workout_comments, new_comment                                                            |
| WHOOP         | patient_name, height, height_meter, weight_kilogram                                                                |
| Tanita        | none beyond the common names (the CSV holds measurements; a column is not dropped)                                 |

TrainingPeaks' non-weight metric types and Tanita's unmapped columns stay:
dropping them means reading values. Tests: each bridge on its real or
scrubbed fixtures (Train2Go's profile page and ping, Garmin's
`test-fixtures/gcn` outputs, the WHOOP, TrainingPeaks and Tanita package
fixtures byte for byte), and App tests that run each Connector on the
trimmed and the raw answer and find the output equal
(`test-utils/bridge-answer-trim.ts` loads the bridge's own files).

### D3. Unused surface goes; texts follow

Removed: `GET /api/v2/workplan/tooltip/activity/{id}` (four Train2Go paths),
`POST …/consolidatedtimedmetric` with its `weight` schema and `write:body`
(a protocol-1 extension still announces it, so the App's comments say so and
its route filter stays), and `https://connect.garmin.com/*` (no request goes
there; `chrome.tabs.create` needs no host). Each privacy-policy rule that
named removed text has an equivalent replacement; floors only went up.

### D4. Spanish Try-again wording

"{platform} no responde, así que ahora mismo no puedes usar {platform} en
Kaiord." Synced by `pnpm bridge:sync` to every popup and `@kaiord/i18n`.
The `extension-names-en-es` change's scenario quoting the old sentence is
superseded by the requirement here.

## Deploy order

Unchanged: the App first (it reads both protocols), then the extensions.
Nothing here changes a wire shape the App relies on: trimmed members are ones
no Connector reads.
