## MODIFIED Requirements

### Requirement: Landing tracks key funnel events

The system SHALL call `analytics.event` on the following user interactions in `@kaiord/landing`: clicking the "Try the Editor" CTA (`editor-opened`), clicking the "Star on GitHub" link (`github-opened`), clicking the "Read the Docs" link (`docs-opened`), and clicking any Chrome Web Store link (`extension-install-clicked`). The `extension-install-clicked` payload SHALL be exactly `{ extension: <listing slug> }`, the slug being the `<slug>` path segment of a `chromewebstore.google.com/detail/<slug>/<id>` URL, or `unknown` for any other store URL. It MUST NOT carry the listing id, the full URL, or anything about the visitor. AI-assistant referrals SHALL NOT be tracked with an event: they are read from the referrer and UTM data Umami already records with each page view (`reports/seo/umami-ai-referrers.md`).

#### Scenario: CTA click triggers editor-opened event

- **WHEN** a user clicks the "Try the Editor" button on the landing page
- **THEN** `analytics.event('editor-opened')` is called before navigation

#### Scenario: GitHub link click triggers github-opened event

- **WHEN** a user clicks the "Star on GitHub" link on the landing page
- **THEN** `analytics.event('github-opened')` is called

#### Scenario: Docs link click triggers docs-opened event

- **WHEN** a user clicks the "Read the Docs" link on the landing page
- **THEN** `analytics.event('docs-opened')` is called

#### Scenario: Chrome Web Store link click triggers extension-install-clicked

- **WHEN** a user clicks `https://chromewebstore.google.com/detail/kaiord-garmin-bridge/<id>` on the landing page
- **THEN** `analytics.event('extension-install-clicked', { extension: 'kaiord-garmin-bridge' })` is called, and the payload holds no other key

#### Scenario: Store link that is not a listing

- **WHEN** a user clicks a `chromewebstore.google.com` link whose path is not `/detail/<slug>/<id>` (for example `/detail/<slug>` with no id)
- **THEN** `analytics.event('extension-install-clicked', { extension: 'unknown' })` is called
