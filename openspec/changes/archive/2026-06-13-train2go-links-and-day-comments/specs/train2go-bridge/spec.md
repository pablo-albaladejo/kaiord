<!--
Delta spec for `train2go-bridge`: the daily-detail parser preserves
hyperlinks as markdown links and gains day-comment extraction; the
`read-day` external message response carries the parsed comments.
No new endpoints; the ALLOWED list is unchanged.
-->

## ADDED Requirements

### Requirement: HTML parser for day comments

The parser SHALL extract the day-scoped comment thread from the daily workplan HTML fragment via an `extractComments(html)` function. Comments live in the `div.comments` block of the daily sidebar (sibling column of the activities list); each `<div class="comment">` SHALL yield an entry with:

- `author` (string): from the `title` attribute of the comment's `<picture>` element
- `isOwn` (boolean): `true` when the comment block contains a delete button (`data-remote` targeting `/api/v2/comments/{id}`), which Train2Go renders only for the viewer's own comments; `false` otherwise
- `timestamp` (string): the `datetime` attribute of the comment's `<time>` element, verbatim
- `text` (string): the comment body cleaned to plain text with the same pipeline as activity descriptions — `<a href="URL">label</a>` preserved as `[label](URL)`, `<p>`/`<br>` converted to newlines, entities decoded, all other tags stripped

Comments SHALL be returned in DOM order. Avatar image URLs MUST NOT appear in the parsed output. When the HTML contains no `div.comments` block, or the block contains no comment entries, the parser SHALL return an empty array. Malformed comment markup SHALL degrade gracefully (skip the malformed entry, never throw).

#### Scenario: Parse a coach comment

- **WHEN** the daily HTML contains a comment with `<picture title="Daniel Blanco Galindo">`, `<time datetime="2026-06-01 17:26:22">`, no delete button, and body `<p>Notas recordatorio para el día de la prueba:</p><p>Nos hidratamos con agua nada más despertar.</p>`
- **THEN** `extractComments` returns an entry `{ author: "Daniel Blanco Galindo", isOwn: false, timestamp: "2026-06-01 17:26:22", text: "Notas recordatorio para el día de la prueba:\nNos hidratamos con agua nada más despertar." }`

#### Scenario: Parse an own comment containing a link

- **WHEN** the daily HTML contains a comment with a delete button (`data-remote="https://app.train2go.com/api/v2/comments/2555402?source=sidebar-dailyplan"`) and body `<p><a target="_blank" href="https://connect.garmin.com/app/activity/23160614260" title="https://connect.garmin.com/app/activity/23160614260">connect.garmin.com</a></p>`
- **THEN** the entry has `isOwn: true` and `text: "[connect.garmin.com](https://connect.garmin.com/app/activity/23160614260)"`

#### Scenario: Day without comments

- **WHEN** the daily HTML contains no `div.comments` block or an empty comments container
- **THEN** `extractComments` returns `[]`

#### Scenario: Avatar URLs are not extracted

- **WHEN** a comment block contains `<img src="https://app.train2go.com/assets/16128/avatars/medium/x.png">`
- **THEN** no field of the parsed entry contains the avatar URL

## MODIFIED Requirements

### Requirement: HTML parser for daily detail

The parser SHALL extract full activity descriptions from the daily workplan HTML fragment. The daily endpoint returns JSON: `{ data: { content: "<html>" } }`.

For each activity in the HTML, the parser SHALL extract all weekly fields plus:

- `description` (string): from `.activity-description` inner HTML, with HTML tags cleaned to plain text. `<strong>` tags SHALL be preserved as `**text**` markers. `<a href="URL">label</a>` anchors SHALL be preserved as markdown links `[label](URL)` (the `href` value verbatim, the anchor's text content as label). `<p>` and `<br>` tags SHALL become newlines. All other tags SHALL be stripped.
- `completion` (number, 0-100): from `.activity-completion .percent` text content

When `.activity-description` has class `activity-description-empty` and contains no text, `description` SHALL be an empty string.

An anchor without an `href` attribute, or whose text content is empty, SHALL contribute only its plain text content (no markdown link is emitted).

#### Scenario: Parse activity with rich description

- **WHEN** the daily HTML contains an activity with description `<p><strong>Calentamiento:</strong> 20' Z1</p><p>6x(30" Z5 a 315w)</p>`
- **THEN** the parser returns description `"**Calentamiento:** 20' Z1\n6x(30\" Z5 a 315w)"`

#### Scenario: Parse activity description with a hyperlink

- **WHEN** the daily HTML contains an activity with description `<p>Técnica: <a target="_blank" href="https://youtu.be/abc123">vídeo técnica</a></p>`
- **THEN** the parser returns description `"Técnica: [vídeo técnica](https://youtu.be/abc123)"`

#### Scenario: Anchor without href degrades to plain text

- **WHEN** the daily HTML contains an activity with description `<p>Ver <a class="x">vídeo</a></p>`
- **THEN** the parser returns description `"Ver vídeo"`

#### Scenario: Parse activity with empty description

- **WHEN** the daily HTML contains an activity with class `activity-description-empty`
- **THEN** the parser returns description `""`

#### Scenario: Parse completion percentage

- **WHEN** the daily HTML contains `.percent.percent-red` with text `"0%"`
- **THEN** the parser returns `completion: 0`

### Requirement: External message API

The extension SHALL handle messages from allowed SPA origins via `chrome.runtime.onMessageExternal` with the following actions:

- `ping` — Calls `/api/v2/profile/ping` and returns the user profile JSON (including `userId`, `name`, `bpm_max`, `bpm_rest`, `weight`). The response SHALL include `protocolVersion: 1`.
- `read-week` — Accepts `{ action: "read-week", date: "YYYY-MM-DD", userId: number }`. Calls the weekly endpoint, parses the HTML, and returns an array of activity objects spanning 3 weeks.
- `read-day` — Accepts `{ action: "read-day", date: "YYYY-MM-DD", userId: number }`. Calls the daily endpoint, parses the HTML, and returns activity objects with full descriptions plus the day's comment thread under `comments` (per the day-comments parser requirement).
- `open-train2go` — Opens `https://app.train2go.com/user/index` in a new tab.

All responses SHALL include `protocolVersion: 1` in the response envelope, matching the Garmin bridge `sendResult`/`sendError` pattern. The response shape SHALL be `{ ok: boolean, protocolVersion: number, data?: unknown, error?: string, status?: number }`.

The `ping` response SHALL extract `userId` from the profile JSON and include it in the response data, so the SPA can use it for subsequent `read-week` and `read-day` calls.

The `comments` field in the `read-day` response is additive: consumers that ignore it MUST keep working unchanged.

#### Scenario: SPA pings extension

- **WHEN** the SPA sends `{ action: "ping" }` to the extension
- **THEN** the extension calls `/api/v2/profile/ping` and returns `{ ok: true, protocolVersion: 1, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version: "0.1.0", protocolVersion: 1, capabilities: ["read:training-plan"], userId: 28035, userName: "Pablo", sessionActive: true } }`

The `data` field SHALL include both the bridge manifest fields (`id`, `name`, `version`, `protocolVersion`, `capabilities`) — required by the SPA's `parseManifestFromPing` function — and session-specific fields (`userId`, `userName`, `sessionActive`).

#### Scenario: Ping detects expired session

- **WHEN** the SPA sends `{ action: "ping" }` and the Train2Go session has expired
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "train2go-bridge", name: "Kaiord Train2Go Bridge", version: "0.1.0", protocolVersion: 1, capabilities: ["read:training-plan"], sessionActive: false } }`

The manifest fields SHALL always be present in the ping response regardless of session state, so the SPA's `parseManifestFromPing` can register the bridge even when the session is expired.

#### Scenario: SPA reads week

- **WHEN** the SPA sends `{ action: "read-week", date: "2026-04-13", userId: 28035 }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [...] } }` where the activities array spans all 3 weeks returned by the API (previous, current, and next week — up to 21 days of data)

#### Scenario: SPA reads week with no activities

- **WHEN** the SPA sends `{ action: "read-week", date: "2026-05-01", userId: 28035 }` and the coach has not planned that period
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [] } }`

#### Scenario: SPA reads day

- **WHEN** the SPA sends `{ action: "read-day", date: "2026-04-13", userId: 28035 }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [{ id, date, sport, title, duration, workload, status, description, completion }, ...], comments: [{ author, isOwn, timestamp, text }, ...] } }`

#### Scenario: SPA reads day with multiple activities

- **WHEN** the SPA sends `{ action: "read-day", date: "2026-04-07", userId: 28035 }` and the day has 2 activities (morning gym + afternoon swim)
- **THEN** the response contains 2 activity objects with distinct ids in the activities array

#### Scenario: SPA reads day without comments

- **WHEN** the SPA sends `{ action: "read-day", date: "2026-04-14", userId: 28035 }` and the day's HTML has no comment thread
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { activities: [...], comments: [] } }`

#### Scenario: SPA requests Train2Go tab opening

- **WHEN** the SPA sends `{ action: "open-train2go" }` to the extension
- **THEN** the extension opens `https://app.train2go.com/user/index` in a new tab and returns `{ ok: true, protocolVersion: 1 }`

#### Scenario: SPA sends unknown action

- **WHEN** the SPA sends `{ action: "unknown" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: unknown" }`
