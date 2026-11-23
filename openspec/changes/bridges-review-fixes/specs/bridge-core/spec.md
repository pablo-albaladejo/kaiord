## MODIFIED Requirements

### Requirement: A Session check downloads no athlete data and mints no token

Every extension SHALL answer a Session check (`ping`, and `checkSession` or
`status` where the extension has one) with the cheapest request its Platform
offers that tells a live Session from a dead one, or with no request when
every such request would mint a token or download the athlete's data. The
answer SHALL carry the bridge manifest where the action carried it before, a
typed `session` outcome, and the booleans older Kaiord Apps read
(`authenticated`, and `gcApi.ok`, `sessionActive` or `connected` where the
extension sent them before), and nothing else: no id, no name, no note, no
workout, no count and no token. A check SHALL store nothing and SHALL NOT mint
a token; a token is minted only when a real read or send is about to use it.

`session` SHALL be one of:

- `"signed-in"`: the Platform answered that the Session works, or the
  extension holds a token a real request minted that has not expired;
- `"signed-out"`: the Platform itself verified the Session is gone: a
  redirect to its sign-in page, a 401, an answer the research notes and
  fixtures identify as its sign-in page (Garmin's sign-in page issuing no
  ticket), or an explicit "session expired" body (Train2Go's ping answering
  `Unauthenticated`). Nothing else SHALL be reported as signed out: a 403,
  a 5xx, a network failure, and any other answer (MyTANITA's maintenance
  page served with a 200 `text/html`, Train2Go's `success: false` without
  the `Unauthenticated` marker) are `"not-answering"`, and a request error
  carries `needsReauth` only on a verified sign-out;
- `"not-answering"`: the Platform was asked and did not answer usably;
- `"not-checked"`: nothing was asked, because no request could tell without
  minting a token; the first real read or send finds out.

Per extension the check SHALL be: Tanita, one `HEAD` of
`/en/user/export-csv` (no body read); Train2Go, one `GET` of
`/api/v2/profile/ping` whose profile is dropped in the service worker;
TrainingPeaks, Garmin and WHOOP, no request (the stored token's expiry, or the
captured bearer, decides between `"signed-in"` and `"not-checked"`). WHOOP's
check also answers, as yes or no and without a request, whether the held
sign-in names a WHOOP account (`hasAccountId`) and whether an `app.whoop.com`
tab is open (`tabOpen`), so the Kaiord App shows the notice its popup shows.

What a check used to hand over travels only to an explicit read made when it
is about to be used: `read-athlete-id` (TrainingPeaks, before a write; this is
where the token is minted) and `read-user-id` (WHOOP, before an import). On Train2Go the Kaiord App links from the profile ping read raw through `request`, and the popup reads it through the internal-only `read-profile`.

#### Scenario: Tanita checks with headers only

- **WHEN** the Kaiord App sends `checkSession` to Kaiord for Tanita
- **THEN** the extension sends one `HEAD` of the export, reads no body, and answers only the manifest, `session` and `authenticated`

#### Scenario: Tanita reports signed out only when MyTANITA said so

- **WHEN** the `HEAD` is redirected to the sign-in page
- **THEN** the answer is `session: "signed-out"`; a network failure, a 403 and a 200 `text/html` page are `"not-answering"`

#### Scenario: TrainingPeaks checks without minting

- **GIVEN** Kaiord for TrainingPeaks holds no token that has not expired
- **WHEN** the Kaiord App or the popup checks the Session
- **THEN** the extension sends no request, stores nothing, and answers `session: "not-checked"` with no athlete id

#### Scenario: The TrainingPeaks token is minted for a real use

- **WHEN** the Kaiord App reads metrics or asks `read-athlete-id` before a send
- **THEN** the extension mints the token, stores it in `chrome.storage.local`, and uses it for that request

#### Scenario: Garmin checks without a request

- **WHEN** the Kaiord App or the popup sends `ping` to Kaiord for Garmin
- **THEN** the extension sends no request and answers no workout, `"signed-in"` only while it holds Garmin access that has not expired

#### Scenario: Train2Go checks with yes or no

- **WHEN** the Kaiord App sends `ping` to Kaiord for Train2Go
- **THEN** the extension sends one `GET /api/v2/profile/ping` and answers only the manifest, `session`, `authenticated` and `sessionActive`, never the athlete's id or name or the coach's name or notes

#### Scenario: WHOOP checks without an id

- **WHEN** the Kaiord App sends `status` or `ping` to the WHOOP extension
- **THEN** the extension sends no request and answers no WHOOP id and no capture time, only `connected`, `session`, `authenticated`, `hasAccountId` and `tabOpen`; `"not-checked"` while no bearer is captured

#### Scenario: A 403 is not a sign-out

- **WHEN** Train2Go or MyTANITA answers a check or a request with a 403
- **THEN** the answer is `session: "not-answering"` (a request error carries `status: 403` and no `needsReauth`)

## ADDED Requirements

### Requirement: An answer carries no Session-bound secret

Before any extension hands a Platform's answer to the Kaiord App, the shared
master `bridge-answer.js` SHALL remove what is tied to the athlete's Session:
in HTML (also HTML wrapped in a JSON answer), every `<input>` and `<meta>`
whose name contains token, csrf, xsrf, session or nonce (Train2Go's hidden
`_token`, `csrf-token`, `csrf-param`), and the value of an inline `csrfToken`
or `_token` string; in JSON, every member whose key is a credential name
(`_token`, `csrf_token`, `access_token`, `token`, `sessionId`,
`authorization`, `cookie`, `password` and the like). An answer with nothing to
remove SHALL pass byte for byte. Account ids the Connector reads (`user_id`,
`ownerId`, an athlete id) are not secrets and SHALL be kept.

#### Scenario: Train2Go's anti-forgery token never reaches the App

- **WHEN** the Kaiord App requests `/user/details` and Train2Go answers the page in `fixtures/details-active.html`
- **THEN** the answer the App receives has no `_token` input, and the rest of the page is unchanged

#### Scenario: A clean answer passes unchanged

- **WHEN** a Platform's answer carries no Session-bound field
- **THEN** the App receives it byte for byte

### Requirement: The App reads the Connection notices from a generated copy

`@kaiord/i18n` SHALL read the Connection notices from
`packages/i18n/src/generated/connection-notices.{js,d.ts}`, written by the
same `pnpm bridge:sync` that vendors the master into the extensions and held
byte-identical to the master by `scripts/check-bridge-core-parity.test.mjs`.
No package SHALL import `packages/_shared/` at runtime.

#### Scenario: A drifted copy fails

- **WHEN** the generated copy in `@kaiord/i18n` differs from the master
- **THEN** `pnpm test:scripts` fails and names the copy
