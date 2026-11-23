## ADDED Requirements

### Requirement: Internal messages answer only the extension's own pages

The vendored envelope module SHALL provide `createInternalDispatch({ dispatch, internalActions, protocolVersion })` for `chrome.runtime.onMessage`. It SHALL answer only a sender whose `id` equals the extension's own `chrome.runtime.id`, that has no `tab`, and whose `origin` is exactly `chrome-extension://<own id>`; any other sender (a content script, another extension, an extension page opened in a tab) SHALL get no answer. An action outside `internalActions` SHALL be refused with `{ ok: false, retryable: false }` before the handler runs. A bridge using it keeps every action that reaches a Platform on behalf of the App reachable only through the external, exact-origin gate.

#### Scenario: A content script gets no answer

- **GIVEN** a sender `{ id: <own id>, origin: "https://kaiord.com", tab: { id: 1 } }`
- **WHEN** it sends an internal message
- **THEN** the dispatcher returns `false` and the handler does not run

#### Scenario: The popup is answered

- **GIVEN** a sender `{ id: <own id>, origin: "chrome-extension://<own id>" }` and an internal action
- **WHEN** it sends the message
- **THEN** the handler runs and the answer uses the shared envelope

### Requirement: Announcement carries the bridge's protocol version

The announce master SHALL post `protocolVersion` from `globalThis.KAIORD_BRIDGE_IDENTITY.protocolVersion`, and 1 when the identity does not declare one, so a bridge that moved to a newer protocol announces the version its `ping` answers with.

#### Scenario: A bridge on protocol 2 announces 2

- **GIVEN** a `bridge-identity.js` declaring `protocolVersion: 2`
- **WHEN** the announcement is built
- **THEN** it carries `protocolVersion: 2`
