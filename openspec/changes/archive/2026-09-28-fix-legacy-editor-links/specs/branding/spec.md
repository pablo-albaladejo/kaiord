## MODIFIED Requirements

### Requirement: Favicon

The project SHALL have a favicon derived from the logo symbol (without wordmark). The favicon SHALL be provided in ICO format (multi-size: 16x16, 32x32, 48x48) and as a 180x180 PNG for apple-touch-icon.

#### Scenario: Favicon displays in browser tab

- **WHEN** a user opens `kaiord.com` or `kaiord.com/app/`
- **THEN** the browser tab SHALL display the Kaiord favicon instead of the default Vite icon

#### Scenario: Apple touch icon

- **WHEN** a user adds the site to their iOS home screen
- **THEN** the home screen icon SHALL display the Kaiord apple-touch-icon

### Requirement: Open Graph meta tags

Both the landing page and the editor SHALL include Open Graph meta tags for social sharing: `og:title`, `og:description`, `og:image` (1200x630 PNG, optimized to < 100KB), `og:url`, `og:type`, `og:locale` (`en_US`), and `og:site_name` (`Kaiord`).

#### Scenario: Landing page shared on social media

- **WHEN** a user shares `kaiord.com` on LinkedIn/Slack
- **THEN** the preview SHALL show the Kaiord OG image, title, and description including author attribution

#### Scenario: Editor shared on social media

- **WHEN** a user shares `kaiord.com/app/`
- **THEN** the preview SHALL show "Kaiord Editor" as title with appropriate description
