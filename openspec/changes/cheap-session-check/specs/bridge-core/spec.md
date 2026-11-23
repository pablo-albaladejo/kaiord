## ADDED Requirements

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
- `"signed-out"`: the Platform itself said the Session is gone (a redirect,
  a 401/403, a sign-in page, or Train2Go's `success: false`). Nothing else
  SHALL be reported as signed out;
- `"not-answering"`: the Platform was asked and did not answer usably;
- `"not-checked"`: nothing was asked, because no request could tell without
  minting a token; the first real read or send finds out.

Per extension the check SHALL be: Tanita, one `HEAD` of
`/en/user/export-csv` (no body read); Train2Go, one `GET` of
`/api/v2/profile/ping` whose profile is dropped in the service worker;
TrainingPeaks, Garmin and WHOOP, no request (the stored token's expiry, or the
captured bearer, decides between `"signed-in"` and `"not-checked"`).

What a check used to hand over travels only to an explicit read made when it
is about to be used: `read-athlete-id` (TrainingPeaks, before a write; this is
where the token is minted), `read-user-id` (WHOOP, before an import) and
`read-profile` (Train2Go, for the connect flow and the popup).

#### Scenario: Tanita checks with headers only

- **WHEN** the Kaiord App sends `checkSession` to Kaiord for Tanita
- **THEN** the extension sends one `HEAD` of the export, reads no body, and answers only the manifest, `session` and `authenticated`

#### Scenario: Tanita reports signed out only when MyTANITA said so

- **WHEN** the `HEAD` is redirected to the sign-in page
- **THEN** the answer is `session: "signed-out"`; a network failure is `"not-answering"`

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
- **THEN** the extension sends no request and answers no WHOOP id and no capture time; `"not-checked"` while no bearer is captured
