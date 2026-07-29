> Synced: 2026-06-14 (add-spa-ai-chatbot)

# Privacy Policy

## Purpose

Public privacy-policy content and coverage requirements across every Kaiord surface that handles user data (website, docs, workout editor, garmin-bridge, train2go-bridge, tanita-bridge, trainingpeaks-bridge, whoop-bridge).

## Requirements

### Requirement: Privacy policy page

The docs site SHALL include a privacy policy page at `/legal/privacy-policy`. The page SHALL be a VitePress markdown file at `packages/docs/legal/privacy-policy.md`.

#### Scenario: Privacy policy is accessible

- **WHEN** a user navigates to `https://kaiord.com/docs/legal/privacy-policy`
- **THEN** the privacy policy page SHALL render with the full policy text

### Requirement: Privacy policy content

The privacy policy SHALL cover the following topics:

- **Data controller identity**: The policy SHALL state that Kaiord operates no backend and that processing is entirely client-side, so there is no Kaiord-operated data controller beyond the user
- **Data collection**: The project does NOT collect personal data, analytics, or telemetry
- **Client-side storage disclosure**: The policy SHALL state that workout-editor state (workouts, templates, profiles, AI provider keys, sync state, chat transcripts) is stored locally in the user's browser via IndexedDB / Dexie, and that nothing is sent to a Kaiord-operated server
- **LLM provider data flow**: The policy SHALL disclose that, when the user configures AI features, prompts and workout content are sent directly from the browser to the chosen LLM provider (Anthropic, OpenAI, or Google) and are subject to that provider's privacy policy and terms of service, and that Kaiord does not receive or relay this data. For the chat assistant specifically, the policy SHALL disclose that summaries of the user's locally stored history — including workout, coaching, and health data (e.g. sleep) — are sent to the configured provider only when the user converses with the assistant, and never in the background. The policy SHALL also state that chat transcripts are stored locally and, when the user enables cross-device sync, are included in the sync snapshot stored in the user's own cloud storage — never on a Kaiord-operated server
- **Garmin Bridge extension data handling**: The Garmin Bridge extension mints an OAuth token from the user's existing Garmin sign-in session (service ticket → OAuth1 → OAuth2) and stores it in `chrome.storage.local` so it can call Garmin's API on the user's behalf across service-worker restarts; the token is sent only to Garmin as a Bearer credential and never to a Kaiord-operated server. No password is entered or seen by the extension. With the user's action it may also upload a body-composition measurement (weight plus derived metrics such as body-fat percentage) to Garmin Connect as a FIT file, declaring the `write:body` capability; it only ever sends data the user supplies from the editor and never reads the user's Garmin body-composition history
- **Train2Go Bridge extension data handling**: The Train2Go Bridge extension stores no data locally; training plans are read on-demand from the Train2Go page DOM and delivered directly to the Kaiord workout editor
- **Tanita Bridge extension data handling**: The Tanita Bridge extension stores no data locally; its service worker fetches the user's own MyTANITA body-composition CSV export from `mytanita.eu` on demand (declaring only the `read:body` capability) and delivers the raw text directly to the Kaiord workout editor. The policy SHALL disclose that the extension uses no password — it rides the user's existing logged-in session cookie (`credentials:"include"`), does not declare the `cookies` permission, cannot read the session cookie value, injects no content script on `mytanita.eu`, and performs only a single fixed read-only export request
- **TrainingPeaks Bridge extension data handling**: The TrainingPeaks Bridge extension stores no measurement data locally; it reads the user's own body metrics (weight and related body-composition channels) from `tpapi.trainingpeaks.com` and, on the user's action, writes a single weight measurement back (declaring the `read:body` and `write:body` capabilities), delivering the raw JSON to the Kaiord workout editor. The policy SHALL disclose that the extension uses no password — it exchanges the user's existing `Production_tpAuth` session cookie for a short-lived access token via a single cookie-only `GET /users/v3/token` request (`credentials:"include"`, no `Authorization` header), stores only that token (in `chrome.storage.local`), does not declare the `cookies` permission, cannot read the cookie value, and injects no content script on TrainingPeaks. Because the cookie is a domain-wide `.trainingpeaks.com` cookie it reaches `tpapi.trainingpeaks.com` automatically, so a single `host_permissions` host suffices
- **WHOOP Bridge extension data handling**: The WHOOP Bridge extension performs no OAuth flow and stores no long-lived or developer credential. The policy SHALL enumerate **every** path by which the extension obtains the WHOOP session bearer — today exactly three: (1) a main-world content script that reads the `Authorization` header the WHOOP web app already attaches to its own `api.prod.whoop.com` requests and relays it through an isolated content script; (2) a read-only `chrome.webRequest.onBeforeSendHeaders` listener on `https://api.prod.whoop.com/*` that reads the same header directly, covering requests issued before the main-world script loaded, without modifying, redirecting, or blocking any request; and (3) a scan of the `app.whoop.com` `localStorage` for the `CognitoIdentityServiceProvider.<client-id>.accessToken` key WHOOP's own sign-in library writes, executed on every page load, which reads a credential **at rest** rather than one in flight. The policy SHALL state that no other `localStorage` key is read and that nothing in `localStorage` is written, modified, or removed. The extension holds the bearer only in `chrome.storage.session` (memory-only; cleared on browser restart) — never logged, never written to disk, never sent to a Kaiord-operated server, and never returned to the editor. The policy SHALL disclose that the extension decodes the bearer's JWT `custom:user_id` claim into the user's numeric WHOOP account identifier and returns that identifier, a boolean `connected` flag, and the capture timestamp to the editor as its status response. The extension reads a fixed allowlist of read-only WHOOP internal-API endpoints (recovery/HRV, sleep, vitals, strain, stress, heart-rate series, workouts, and Advanced-Labs biomarker tests, declaring the `read:body`, `read:sleep`, and `read:activities` capabilities and no write capability) and returns the parsed result directly to the Kaiord workout editor; every read is a `GET` from an open `app.whoop.com` tab carrying the bearer and `credentials:"include"`, and requests outside the allowlist are rejected without a network call. This extension is not yet registered with the Chrome Web Store
- **Multi-extension coverage**: The policy SHALL cover every Chrome extension currently shipping in the monorepo (at minimum `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`, `@kaiord/tanita-bridge`, `@kaiord/trainingpeaks-bridge`, and `@kaiord/whoop-bridge`) with symmetric data-handling disclosures, regardless of whether the extension is yet published to the Chrome Web Store. Each extension SHALL have its own `## Kaiord <Name> Bridge Extension` section, and every disclosure the policy makes about an extension SHALL live inside that extension's section — a claim satisfied only by the intro list or by the shared Communication Scope section does NOT satisfy that extension's disclosure obligation
- **Exhaustive credential-path disclosure**: For each extension, the policy SHALL enumerate **every** path by which a credential or personal datum enters or leaves the extension, not merely a representative one. A section in which every individual sentence is true but a capture, storage, derivation, or egress path is omitted SHALL be treated as a policy violation of the same severity as a false statement
- **Permission disclosure symmetry**: Each extension's section SHALL name the `permissions` its manifest declares and SHALL state which credential-adjacent permissions it does NOT declare (at minimum `cookies`, and the request-mutation permissions `webRequestBlocking` / `declarativeNetRequest*`). Where an extension declares a permission that grants direct credential access — today only `webRequest` on `@kaiord/whoop-bridge` — the policy SHALL say so explicitly and SHALL describe the read-only nature of its use
- **No password handling**: No extension reads, stores, or transmits user passwords. The Garmin Bridge stores an OAuth token minted from the user's own session locally (see Garmin Bridge data handling) and sends it only to Garmin; no extension transmits credentials to a Kaiord-operated server
- **No third-party sharing**: No data is shared with third parties beyond the user-configured LLM provider disclosed above
- **Communication scope**: Each extension only communicates with its declared hosts (`connect.garmin.com`, `connectapi.garmin.com`, `sso.garmin.com` / `app.train2go.com` / `mytanita.eu` / `tpapi.trainingpeaks.com` / `app.whoop.com`, `api.prod.whoop.com`) and allowed Kaiord origins. The Kaiord-origin channel (`externally_connectable`) SHALL be described as one-way inbound (editor → extension)
- **Runtime discovery disclosure**: The policy SHALL disclose the announce-only content script injected into SPA origins (`https://*.kaiord.com/*` in production, additionally `http://localhost/*` in development) and SHALL state that the script only posts a fixed announcement object via `window.postMessage`, does not read SPA DOM / cookies / storage / network, and does not modify the page
- **Localhost dev disclosure**: The policy SHALL disclose that local-development manifests additionally accept messages from `http://localhost:5173` / `http://localhost:5174` via `externally_connectable`, that the announce content script injects on `http://localhost/*`, and SHALL state that these development-only matches are stripped from the production manifest before CWS submission
- **Regulatory compliance**: Statement of compliance with applicable data protection regulations (GDPR, CCPA) — specifically that because no personal data is collected server-side, there is no personal data held by Kaiord to protect, share, or delete
- **Data-subject rights**: The policy SHALL explicitly enumerate GDPR/CCPA rights (access, rectification, erasure, portability) and state that, because Kaiord holds no records, such requests have no data to act upon
- **Retention guidance**: The policy SHALL describe how the user can remove local data — at minimum the editor's API-key clear action, per-workout delete, the per-conversation chat delete action (delete an individual conversation), and the browser-level "clear site data" path
- **Host-permission narrowing**: The policy SHALL state that each extension declares `host_permissions` limited to its disclosed hosts (no wildcard, no `<all_urls>`)
- **Children's Privacy**: The policy SHALL include a Children's Privacy section stating the products are not directed at children under 13 (or 16 in jurisdictions where that age applies)
- **Changes to this Policy**: The policy SHALL include a Changes-to-this-Policy section explaining how material changes are announced (project release notes / git log / "Last updated" date)
- **Open source**: Link to the GitHub repository for full transparency
- **Contact**: Contact information for privacy inquiries
- **Last updated date**: The policy SHALL include a "Last updated" date in YYYY-MM-DD format

#### Scenario: Policy states no data collection

- **WHEN** the privacy policy is read
- **THEN** it SHALL explicitly state that no personal data, analytics, or telemetry is collected

#### Scenario: Policy describes Garmin Bridge data handling

- **WHEN** the privacy policy is read
- **THEN** it SHALL describe the OAuth token minted from the user's Garmin session and stored in local storage, its purpose, and that no password is entered or seen by the extension, and that with the user's action it may upload a body-composition measurement to Garmin as a FIT file (`write:body`)

#### Scenario: Policy describes Train2Go Bridge data handling

- **WHEN** the privacy policy is read
- **THEN** it SHALL describe that the Train2Go Bridge reads coaching plans from the DOM on `app.train2go.com`, does not persist data, does not modify pages, and does not make authenticated API calls on the user's behalf

#### Scenario: Policy describes WHOOP Bridge data handling

- **WHEN** the privacy policy is read
- **THEN** it SHALL describe the session-bearer capture from the user's own `app.whoop.com` session, that no OAuth flow or developer API key is used, that the bearer is held only in memory-only `chrome.storage.session`, and the read-only internal-API scope (recovery/HRV, sleep, vitals, strain, stress, heart-rate series, workouts, and Advanced-Labs biomarker tests)

#### Scenario: Policy enumerates all three WHOOP capture paths

- **WHEN** the `## Kaiord WHOOP Bridge Extension` section is read
- **THEN** it SHALL describe the main-world request interceptor, the `chrome.webRequest` header listener, and the `localStorage` Cognito access-token scan
- **AND** it SHALL name the four declared permissions (`tabs`, `webRequest`, `scripting`, `storage`) and state that `cookies` is not declared
- **AND** it SHALL disclose that the numeric WHOOP account identifier decoded from the bearer is returned to the editor

#### Scenario: Deleting an extension's section fails the policy lint

- **GIVEN** the policy's intro sentence and Communication Scope section still name every extension
- **WHEN** an extension's `## Kaiord <Name> Bridge Extension` section is deleted in full
- **THEN** `pnpm -C packages/docs lint:privacy-policy` SHALL fail, reporting that extension's section as missing rather than passing on the intro mention

#### Scenario: Gutting an extension's section body fails the policy lint

- **GIVEN** each bridge section is constrained by its own rule per capture path, per sensitive permission, and per data destination, so that removing any one disclosure fails on its own
- **WHEN** an extension's section body is replaced by prose that merely names its host
- **THEN** `pnpm -C packages/docs lint:privacy-policy` SHALL fail, reporting each removed disclosure as a separate violation

#### Scenario: A section's rule count is shrink-only

- **GIVEN** each bridge section has its current rule count recorded as a floor, in the shape `BOUNDARIES_ALLOWLIST_MAX` already uses
- **WHEN** any rule anchored to a section is deleted without the requirement being deleted
- **THEN** `pnpm -C packages/docs lint:privacy-policy` SHALL fail for that section, reporting the count it dropped from
- **AND** a recorded floor SHALL equal that section's current rule count, so no section carries slack a later deletion could spend unnoticed
- **AND** a section with no recorded floor SHALL need a minimum number of rules before it can be recorded

#### Scenario: A new bridge package fails the lint until the policy covers it

- **GIVEN** the policy lint derives its bridge list from `packages/*-bridge` on disk rather than from hardcoded manifest paths, host sets, and section names
- **WHEN** a new `packages/<name>-bridge` package is added
- **THEN** `pnpm -C packages/docs lint:privacy-policy` SHALL fail until that bridge has a policy section, a disclosed host set, and its own content rules — so it cannot ship without the forbidden-permission and credential-permission checks applying to it

#### Scenario: The policy lint checks something when invoked through a symlink

- **GIVEN** an invocation path containing a symlink, under which Node resolves the module URL to the real path but leaves `process.argv[1]` as typed
- **WHEN** `check-privacy-policy.mjs` is executed through that path
- **THEN** it SHALL run its checks and report the result, rather than exiting 0 having verified nothing

#### Scenario: Credential-access permission requires a documented exemption

- **GIVEN** the policy lint treats `cookies` and `webRequest` as credential-access permissions, because both expose a credential the user never handed to the extension (session cookie values, and `Authorization` headers via `extraHeaders` respectively)
- **WHEN** an extension's manifest declares either one
- **THEN** the lint SHALL fail unless that extension has a written exemption recorded in the lint script naming the permission and the reason
- **AND** the request-mutation permissions (`webRequestBlocking`, `declarativeNetRequest*`) SHALL remain unconditionally forbidden, with no exemption possible

#### Scenario: Policy includes regulatory compliance statement

- **WHEN** the privacy policy is read
- **THEN** it SHALL include references to GDPR and CCPA and state that no personal data is collected or processed

#### Scenario: Policy includes last updated date

- **WHEN** the privacy policy is read
- **THEN** it SHALL include a "Last updated" date in YYYY-MM-DD format

#### Scenario: Policy discloses LLM provider data flow

- **WHEN** the privacy policy is read
- **THEN** it SHALL state that if the user configures AI features, prompts and workout content are sent directly from the browser to the chosen provider (Anthropic, OpenAI, or Google) and that Kaiord does not receive or relay this data

#### Scenario: Policy discloses chat assistant data flow

- **WHEN** the privacy policy is read
- **THEN** it SHALL state that the chat assistant sends summaries of locally stored workout, coaching, and health data to the user-configured LLM provider only during a user-initiated conversation, and that chat transcripts are stored locally in the browser (and in the user's own cloud-sync snapshot when cross-device sync is enabled), never on a Kaiord-operated server

#### Scenario: Policy clarifies client-side storage boundary

- **WHEN** the privacy policy is read
- **THEN** it SHALL state that editor state is stored locally in the browser (IndexedDB / Dexie) and that nothing is sent to a Kaiord-operated server

#### Scenario: Policy lint enforces required disclosures

- **WHEN** the `pnpm -C packages/docs lint:privacy-policy` command runs in CI
- **THEN** it SHALL verify that the policy file contains all the required disclosures listed in this spec and fail the build if any are missing

### Requirement: Privacy policy navigation

The privacy policy page SHALL be accessible from the docs site navigation. It SHALL appear in a "Legal" section in the sidebar.

#### Scenario: Privacy policy appears in sidebar

- **WHEN** a user browses the docs site
- **THEN** a "Legal" section SHALL appear in the sidebar with a "Privacy Policy" link
