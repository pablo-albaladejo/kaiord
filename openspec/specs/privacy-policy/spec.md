## ADDED Requirements

### Requirement: Privacy policy page

The docs site SHALL include a privacy policy page at `/legal/privacy-policy`. The page SHALL be a VitePress markdown file at `packages/docs/legal/privacy-policy.md`.

#### Scenario: Privacy policy is accessible

- **WHEN** a user navigates to `https://kaiord.com/docs/legal/privacy-policy`
- **THEN** the privacy policy page SHALL render with the full policy text

### Requirement: Privacy policy content

The privacy policy SHALL cover the following topics:

- **Data collection**: The project does NOT collect personal data, analytics, or telemetry
- **Garmin Bridge extension data handling**: The Garmin Bridge extension stores only a CSRF token in `chrome.storage.session` (encrypted, memory-only, cleared on browser close)
- **Train2Go Bridge extension data handling**: The Train2Go Bridge extension stores no data locally; training plans are read on-demand from the Train2Go page DOM and delivered directly to the Kaiord workout editor
- **Multi-extension coverage**: The policy SHALL cover every Chrome extension currently shipping in the monorepo (at minimum `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge`) with symmetric data-handling disclosures
- **No credentials storage**: No extension reads, stores, or transmits user passwords or OAuth tokens
- **No third-party sharing**: No data is shared with third parties
- **Communication scope**: Each extension only communicates with its declared host (`connect.garmin.com` / `app.train2go.com`) and allowed Kaiord origins
- **Regulatory compliance**: Statement of compliance with applicable data protection regulations (GDPR, CCPA) — specifically that because no personal data is collected, there is no personal data to protect, share, or delete
- **Open source**: Link to the GitHub repository for full transparency
- **Contact**: Contact information for privacy inquiries
- **Last updated date**: The policy SHALL include a "Last updated" date in YYYY-MM-DD format

#### Scenario: Policy states no data collection

- **WHEN** the privacy policy is read
- **THEN** it SHALL explicitly state that no personal data, analytics, or telemetry is collected

#### Scenario: Policy describes Garmin Bridge data handling

- **WHEN** the privacy policy is read
- **THEN** it SHALL describe the CSRF token stored in session storage, its purpose, and that it is not persisted to disk

#### Scenario: Policy describes Train2Go Bridge data handling

- **WHEN** the privacy policy is read
- **THEN** it SHALL describe that the Train2Go Bridge reads coaching plans from the DOM on `app.train2go.com`, does not persist data, does not modify pages, and does not make authenticated API calls on the user's behalf

#### Scenario: Policy includes regulatory compliance statement

- **WHEN** the privacy policy is read
- **THEN** it SHALL include references to GDPR and CCPA and state that no personal data is collected or processed

#### Scenario: Policy includes last updated date

- **WHEN** the privacy policy is read
- **THEN** it SHALL include a "Last updated" date in YYYY-MM-DD format

### Requirement: Privacy policy navigation

The privacy policy page SHALL be accessible from the docs site navigation. It SHALL appear in a "Legal" section in the sidebar.

#### Scenario: Privacy policy appears in sidebar

- **WHEN** a user browses the docs site
- **THEN** a "Legal" section SHALL appear in the sidebar with a "Privacy Policy" link
