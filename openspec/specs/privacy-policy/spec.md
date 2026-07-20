> Synced: 2026-06-14 (add-spa-ai-chatbot)

# Privacy Policy

## Purpose

Public privacy-policy content and coverage requirements across every Kaiord surface that handles user data (website, docs, workout editor, garmin-bridge, train2go-bridge).

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
- **Garmin Bridge extension data handling**: The Garmin Bridge extension mints an OAuth token from the user's existing Garmin sign-in session (service ticket → OAuth1 → OAuth2) and stores it in `chrome.storage.local` so it can call Garmin's API on the user's behalf across service-worker restarts; the token is sent only to Garmin as a Bearer credential and never to a Kaiord-operated server. No password is entered or seen by the extension
- **Train2Go Bridge extension data handling**: The Train2Go Bridge extension stores no data locally; training plans are read on-demand from the Train2Go page DOM and delivered directly to the Kaiord workout editor
- **Multi-extension coverage**: The policy SHALL cover every Chrome extension currently shipping in the monorepo (at minimum `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge`) with symmetric data-handling disclosures
- **No password handling**: No extension reads, stores, or transmits user passwords. The Garmin Bridge stores an OAuth token minted from the user's own session locally (see Garmin Bridge data handling) and sends it only to Garmin; no extension transmits credentials to a Kaiord-operated server
- **No third-party sharing**: No data is shared with third parties beyond the user-configured LLM provider disclosed above
- **Communication scope**: Each extension only communicates with its declared hosts (`connect.garmin.com`, `connectapi.garmin.com`, `sso.garmin.com` / `app.train2go.com`) and allowed Kaiord origins. The Kaiord-origin channel (`externally_connectable`) SHALL be described as one-way inbound (editor → extension)
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
- **THEN** it SHALL describe the OAuth token minted from the user's Garmin session and stored in local storage, its purpose, and that no password is entered or seen by the extension

#### Scenario: Policy describes Train2Go Bridge data handling

- **WHEN** the privacy policy is read
- **THEN** it SHALL describe that the Train2Go Bridge reads coaching plans from the DOM on `app.train2go.com`, does not persist data, does not modify pages, and does not make authenticated API calls on the user's behalf

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
