## Context

Before this change the Train2Go extension decided what to ask Train2Go for
(it built the weekly and daily URLs from a date and a user id), parsed every
answer (weekly, daily, comments, profile page), backfilled the date of a
day's activities, dropped the profile page's private fields, and stored only
popup state. The App sent `read-week`, `read-day`, `read-details` and used the
parsed objects. The only retry, the second `ping` after a service-worker
wake-up, already lived in the App (`store/train2go-extension-transport.ts`).

## The shape (copy this for #1642)

### Protocol

- `PROTOCOL_VERSION = 2` in `background.js`, `protocolVersion: 2` in
  `bridge-identity.js` (the announce master reads it, default 1).
- External action: `{ action: "request", method: "GET", path: "/…" }`, no
  other key. Answer `{ ok: true, protocolVersion: 2, data: { status,
contentType, body } }`, body as text, unread. A dead Session is
  `{ ok: false, needsReauth: true }`; another non-2xx is
  `{ ok: false, status }`; a path or method outside the list, or any extra
  key (`headers`, `body`), is `{ ok: false, error: "Request not allowed",
retryable: false }` with no request sent.
- Kept actions: `ping` (Session check, its cost is #1643), `open-<platform>`,
  `profile-snapshot`, `profile-snapshot-clear`, `set-theme`.
- Removed for the App: every action that read and parsed (`read-week`,
  `read-day`, `read-details`).

### The closed list

`ALLOWED` in `background.js`, method + path regex, one rule per line (the
privacy-surface guard parses it). Train2Go's five `GET` rules are unchanged:
`/api/v2/profile/ping`, `/api/v2/workplan/weekly/{date}[?user=…]`,
`/api/v2/workplan/daily/{date}[?user=…&source=…]`,
`/api/v2/workplan/tooltip/activity/{id}`, `/user/details`. The App's path
builders (`connector/train2go-paths.ts`) are checked against the list by a
test that reads `background.js`.

### What moved where

| Logic                                    | Before                         | After                                                                     |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| Which path to ask for                    | `background.js`                | `connector/train2go-paths.ts`                                             |
| Weekly / daily / comments parsing        | `parser.js`                    | `connector/parse-*.ts`, `extract-comments.ts`                             |
| Date backfill of a day                   | `background.js` `readDay`      | `connector/read-train2go-answers.ts`                                      |
| Profile page kept to zones and weight    | `parser.js` `parseDetailsHtml` | `connector/parse-details-html.ts` (+ `zonesPayloadSchema`, already there) |
| JSON vs HTML body                        | `background.js` `parseBody`    | `read-train2go-answers.ts`                                                |
| Retry (ping on wake-up)                  | App already                    | App, unchanged                                                            |
| Mapping to KRD / records                 | App already                    | App, unchanged                                                            |
| Session check (`ping` + `parsePingJson`) | extension                      | extension (unchanged, #1643)                                              |
| Popup weekly counts                      | extension                      | extension, reduced to id/date/status/workload                             |

### Compatibility

`connector/train2go-bridge-request.ts` `readThroughBridge(send, { path,
legacy, read })` sends `request` first. When the envelope says
`protocolVersion: 1` (an extension that does not know `request` refuses it in
its own envelope, before any fetch), it sends the `legacy` message and returns
the extension's parsed answer. Otherwise it reads the raw answer with `read`.
No state, no extra network: the version is read from every answer, so an
extension that updates while a tab is open is followed on the next read.
`adapters/bridge/bridge-protocol.ts` lists the versions the App accepts per
extension (`train2go-bridge: [1, 2]`, others `[1]`); discovery, the Session
probe and the Train2Go detection use it.

|                              | App before this change                                                                                    | App after                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Extension 10.4 (protocol 1)  | works                                                                                                     | works through the legacy actions |
| Extension after (protocol 2) | discovery refuses it (shown as not installed); a tab that had already discovered it gets `read-*` refused | works                            |

Release order: deploy the App, then publish the extension.

### Internal channel

`createInternalDispatch({ dispatch, internalActions, protocolVersion })` in
the bridge-envelope master answers only when `sender.id` is the extension's
own id, `sender.tab` is absent and `sender.origin` is
`chrome-extension://<id>`: the popup, never a content script (whose origin is
the page's and whose `tab` is set), never another extension. A non-listed
action gets `retryable: false`. Train2Go lists `ping` and `read-week`. The
other four bridges still register their internal listener directly; #1642
switches each to this factory with its popup's actions, and then a root guard
can require it.

## Decisions

### D1. Version from the envelope, not from discovery

Options: (a) store the verified manifest's version in discovery and pass it to
every read; (b) try `request` and fall back on a version-1 envelope. (a)
needs discovery, the coaching transport and the zones read to carry a version,
and goes stale when the extension updates under an open tab, because
discovery never re-verifies a known id. (b) needs nothing beyond the envelope
every bridge already sends; its cost on an old extension is one local message,
no request to Train2Go. Chosen: (b), with the accepted versions still checked
explicitly at discovery and in the probes.

### D2. Protocol 2 is refused by an old App tab

Keeping protocol 1 on the wire while adding `request` would let an old App tab
keep using `read-*`, but only if the extension kept the parsers, which is what
ADR 0004 removes. So the old tab is not served; the App ships first and a
reload fixes it.

### D3. The closed list is not trimmed here

`/api/v2/workplan/tooltip/activity/{id}` is not asked for by the App or the
popup. Removing it changes the store texts' "five paths" and the golden; left
for the owner (it can only shrink the surface).

### D4. Raw answers reach the App tab

The profile page carries gender, birthday, body fat, height, contact details,
records and tests. Before, the extension dropped them; now they reach the App
tab in the athlete's browser and the Connector keeps only the allowlist (the
same parser, then `zonesPayloadSchema`). Nothing is stored or sent. The texts
say so instead of "dropped inside the extension".

## Known tension: the popup

ADR 0004's last consequence: where the popup's useful information comes from,
when the Bridge holds no logic and checking fetches nothing, is not decided.
This change keeps the popup exactly as it was. What stays in the extension for
it: `parsePingJson` (who is signed in, the coach's name and notes, also the
Session check), `htmlToPlainText` for the notes, and a weekly reader cut to
`{ id, date, status, workload }` for the planned / done / workload figures.
The popup's `read-week` is internal only. When the source of that information
is decided, this is the code to remove.
