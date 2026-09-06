## MODIFIED Requirements

<!-- MODIFIED FROM openspec/specs/whoop-bridge/spec.md. Both blocks are
     reproduced whole; the changes are additive.

     "WHOOP tab dependency" described the failure but not what any surface
     owed the user because of it, so the popup was free to report a healthy
     bridge over reads that all threw: `connected` is `!!whoopToken`, the
     bearer lives in chrome.storage.session and survives the tab closing, and
     whoopFetch then fails at findWhoopTab. The requirement now says the two
     preconditions are separate and that a surface may not collapse them.

     "Origin-pinned external message API" enumerated the internal actions by
     name, and that enumeration is now short by one: `tab-open` is added
     internal-only, deliberately absent from EXTERNAL_ACTIONS. -->

### Requirement: WHOOP tab dependency

All read operations SHALL require an open `app.whoop.com` tab. If no such tab
is found, the operation SHALL fail with a descriptive error.

Because the session bearer is held in memory-only session storage, it OUTLIVES
the tab it was captured from: a captured bearer is therefore not evidence that
a read can succeed. Any surface reporting this bridge's health SHALL treat the
bearer and the tab as two separate preconditions and SHALL NOT report a
readable bridge on the strength of the bearer alone. A surface that cannot
determine the tab SHALL report the unreadable state, not the healthy one — the
read it stands for would fail the same way.

The popup SHALL therefore distinguish three states, and SHALL name what each
one costs and what ends it, in claims the code sustains: which data stops
arriving, that records already imported into Kaiord are kept (no import path
deletes one), and where the missing precondition is restored — which for both
broken states is `app.whoop.com`, because that is the only origin the bearer is
ever captured on and the only tab a read can run in.

#### Scenario: No WHOOP tab open

- **WHEN** the SPA or popup requests a read and no `app.whoop.com` tab exists
- **THEN** the extension returns an error: "No app.whoop.com tab open."

#### Scenario: A held bearer with no tab is not reported as healthy

- **GIVEN** a captured session bearer and no open `app.whoop.com` tab
- **WHEN** the popup resolves its state
- **THEN** it SHALL report that no WHOOP tab is open rather than reporting a connected, reading bridge
- **AND** its primary action SHALL be the one that opens `app.whoop.com`

#### Scenario: An absent bearer is named ahead of an absent tab

- **GIVEN** neither a captured bearer nor an open `app.whoop.com` tab
- **WHEN** the popup resolves its state
- **THEN** it SHALL report the signed-out session, because opening a tab would not restore the bearer

#### Scenario: Every broken state states what is kept

- **WHEN** the popup reports either broken state
- **THEN** it SHALL state that everything already imported stays in Kaiord, which no import path contradicts

### Requirement: Origin-pinned external message API

The extension SHALL expose exactly `ping`, `status`, and `whoop-fetch` to
external (SPA) callers via `chrome.runtime.onMessageExternal` — `ping` returns
the bridge manifest plus the session status, `status` returns the session status
(`{ connected, userId, capturedAt }` — never the token), and `whoop-fetch`
relays an allowed read. The `capture-token`, `open-whoop` and `tab-open`
actions SHALL be reachable only over the internal `chrome.runtime.onMessage`
channel (the extension's own content script and popup) and SHALL NOT appear in
the external action allowlist. `tab-open` answers whether an `app.whoop.com`
tab exists; it stays internal because the SPA has no use for it and because
widening the externally reachable payload would mean amending
`privacy-justification.md` and the published privacy policy, which enumerate
exactly what this bridge discloses. It SHALL accept external messages only from sender origins
matching `https://*.kaiord.com` or `http://localhost:5173|5174`, rejecting
others with `{ ok: false, error: "Origin or action not permitted" }`. All
responses SHALL use `{ ok, protocolVersion, data?, error? }`, and manifest
identity keys SHALL take precedence over any upstream values on collision.

#### Scenario: SPA pings the WHOOP bridge

- **WHEN** an allowed SPA origin sends `{ action: "ping" }`
- **THEN** the extension returns `{ ok: true, protocolVersion: 1, data: { id: "whoop-bridge", name: "WHOOP", version: "<pkg version>", capabilities: ["read:body", "read:sleep"], ... } }`

#### Scenario: Disallowed origin is rejected

- **WHEN** a page whose origin is not an allowed SPA origin sends any external message
- **THEN** the extension returns `{ ok: false, error: "Origin or action not permitted" }` and performs no read

#### Scenario: Internal-only action is rejected from an allowed origin

- **WHEN** an allowed SPA origin sends `{ action: "open-whoop" }`, `{ action: "capture-token" }` or `{ action: "tab-open" }`
- **THEN** the extension returns `{ ok: false, error: "Origin or action not permitted" }` and does not run the handler

#### Scenario: Unknown action is rejected

- **WHEN** an allowed origin sends `{ action: "push" }`
- **THEN** the extension returns `{ ok: false, error: "Unknown action: push" }`
