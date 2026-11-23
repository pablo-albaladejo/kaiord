## Why

Kaiord for Train2Go read, parsed and shaped the athlete's plan, day, comments,
zones and weight inside the extension. That code reaches the athlete only
after a store review, is untyped, and is where every Bridge once stayed broken
for weeks. ADR 0004 (`docs/adr/0004-thin-bridge-smart-connector.md`) decides
that a Bridge only lends the Session and executes requests from a closed list
of allowed paths, and that the logic lives in the Connector inside the Kaiord
App. Train2Go is the tracer (issue #1641, stories 36–51 of #1670); #1642
repeats this shape on the other four extensions.

## What Changes

- **Protocol version 2 for Train2Go.** A new external action
  `{ action: "request", method, path }` replaces `read-week`, `read-day` and
  `read-details` for the App. The extension checks `method` + `path` against
  its closed list (`ALLOWED`, unchanged: five `GET` patterns), refuses
  anything else, and any header or body, without a request, and answers
  Train2Go's raw answer `{ status, contentType, body }`. Its `ping`,
  `open-train2go`, `profile-snapshot`, `profile-snapshot-clear` and
  `set-theme` are unchanged.
- **The Connector reads.** The weekly, daily, comments and profile-page
  parsers move, typed and tested, to
  `packages/workout-spa-editor/src/adapters/train2go/connector/`, with the
  date backfill and the zones-and-weight allowlist. The App's transport
  functions (`readWeek`, `readDay`, `readZones`) keep their shapes, so no
  use case changes.
- **The App accepts the previous protocol.** Each read is sent as `request`
  first; an extension on version 1 refuses it in a version-1 envelope and the
  Connector sends the legacy action instead. Discovery, the Session probe and
  the detection accept versions 1 and 2 for Train2Go (1 only for the others).
- **Internal channel closed to content scripts.** The shared envelope gains
  `createInternalDispatch`: only the extension's own pages are answered, and
  Train2Go answers there only `ping` and `read-week`, the popup's. `request`
  is reachable only through the exact-origin external gate.
- **The popup is unchanged.** It keeps its Session check and weekly figures;
  the minimum to compute them stays in the extension (`parser.js`), the known
  tension named in ADR 0004.
- **Public texts** (store listing, permission justification, privacy-policy
  section, `claims/train2go.json`) say the extension hands Train2Go's answers
  over unread and the App keeps only what it uses; the privacy-policy guard
  and the privacy-surface golden follow.

## Capabilities

### Modified Capabilities

- `train2go-bridge`: external surface is `request` on a closed list; the
  parsers move out; internal channel is the popup's only.
- `spa-train2go-extension`: the Connector reads Train2Go's raw answers and
  falls back to the previous protocol.
- `spa-bridge-protocol`: protocol compatibility is the current and previous
  version per extension.
- `bridge-core`: internal dispatch answers only the extension's own pages;
  the announcement carries the bridge's own protocol version.
- `privacy-policy`: the Train2Go section says answers reach the App unread.

## Impact

- Old extension (10.4.x, protocol 1) with the new App: works, one extra local
  message per read, no extra network request.
- New extension (protocol 2) with an App tab loaded before this change: the
  tab's discovery refuses protocol 2, and an already-discovered tab gets its
  `read-*` refused; reloading the tab loads the current App. Release the App
  before publishing the extension.
- The raw `/user/details` page and daily HTML now reach the App tab (in the
  athlete's browser); the App keeps only the allowlisted fields. The public
  texts say so.
- Session check cost and Connection notices are untouched (#1643, #1644).
