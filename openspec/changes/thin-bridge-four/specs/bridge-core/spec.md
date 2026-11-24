## ADDED Requirements

### Requirement: A thin Bridge's request is admitted by one shared gate

The bridge-core master `bridge-request-gate.js` SHALL provide `createRequestGate({ allowed, bodySchemas })`. It SHALL admit a `request` message only when its keys are among `action`, `method`, `path` and `body`; when `method` and `path` match an entry of `allowed`; when a `body` is present exactly if that entry names a schema; and when the body matches the named schema in `bodySchemas`. Anything else SHALL be refused with `Request not allowed` and `retryable: false` before any token is used or any request is sent. The master SHALL hold no identity: the list and the schemas belong to the consuming bridge.

#### Scenario: A body on an entry that declares none is refused

- **GIVEN** an entry `{ method: "DELETE", pattern: /^\/items\/\d+$/ }`
- **WHEN** a request for `DELETE /items/7` carries a `body`
- **THEN** it is refused with `Request not allowed` and nothing is sent

#### Scenario: A body outside its schema is refused

- **GIVEN** an entry naming the schema `item` that declares `name` and `day`
- **WHEN** the body carries an undeclared key or a date that does not exist
- **THEN** it is refused with `Request not allowed` and nothing is sent

### Requirement: The Bearer transport can hand an answer over unread

`bearerRequest({ …, raw: true })` SHALL answer `{ ok: true, status, contentType, body }` with the body as text, unread, and `{ ok: false, status }` for a non-2xx answer, keeping the single 401 re-mint and `needsReauth`.

#### Scenario: A raw answer is not parsed

- **GIVEN** a 200 answer whose body is `{"id":1}`
- **WHEN** the request is sent with `raw: true`
- **THEN** the envelope carries the body text `{"id":1}` and its content type

### Requirement: Every service worker evaluates with its imports in one scope

Every master and every bridge's own script loaded with `importScripts` SHALL declare no top-level name another file loaded into the same service worker declares; a master keeps its internals in one scope object. `check-bridge-core-parity.test.mjs` SHALL evaluate each bridge's `background.js` and its imports in one shared context, as Chrome does, and fail on a redeclaration.

#### Scenario: Two masters declaring the same constant fail the guard

- **GIVEN** `session-fetch.js` and `bearer-fetch.js` both declaring `UNAUTHORIZED_STATUS` at the top level
- **WHEN** the TrainingPeaks service worker is evaluated
- **THEN** the guard fails naming the file that could not load
