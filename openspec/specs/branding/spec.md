> Synced: 2026-04-17

# Branding

## Requirements

### Requirement: Kaiord logo SVG

The project SHALL have an SVG logo consisting of a geometric symbol (representing the hub/convergence concept of KRD) paired with the "kaiord" wordmark. The logo SHALL work on both dark and light backgrounds. The symbol SHALL be geometrically simple enough to remain legible at 16px (favicon size) through 200px (hero size).

#### Scenario: Logo renders on dark background

- **WHEN** the logo is displayed on the landing page (dark background)
- **THEN** the symbol and wordmark SHALL be clearly visible in light/white colors

#### Scenario: Logo renders on light background

- **WHEN** the logo is displayed on the editor header (light mode)
- **THEN** the symbol and wordmark SHALL be clearly visible in dark colors

#### Scenario: Logo scales without quality loss

- **WHEN** the logo is displayed at sizes from 16px to 200px height
- **THEN** the SVG SHALL render crisply with no pixelation or blurring

### Requirement: Favicon

The project SHALL have a favicon derived from the logo symbol (without wordmark). The favicon SHALL be provided in ICO format (multi-size: 16x16, 32x32, 48x48) and as a 180x180 PNG for apple-touch-icon.

#### Scenario: Favicon displays in browser tab

- **WHEN** a user opens `kaiord.com` or `kaiord.com/editor/`
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

- **WHEN** a user shares `kaiord.com/editor/`
- **THEN** the preview SHALL show "Kaiord Editor" as title with appropriate description

### Requirement: Twitter Card meta tags

Both the landing page and the editor SHALL include Twitter Card meta tags: `twitter:card` (set to `summary_large_image`), `twitter:title`, `twitter:description`, and `twitter:image`.

#### Scenario: Landing page shared on Twitter/X

- **WHEN** a user shares `kaiord.com` on Twitter/X
- **THEN** a large image card preview SHALL render with the OG image, title, and description

### Requirement: Meta description

Both the landing page and the editor SHALL include `<meta name="description">` with a 150-160 character description targeting the keyword "fitness data TypeScript library". The meta description SHALL include "by Pablo Albaladejo" for personal brand attribution.

#### Scenario: Search result snippet

- **WHEN** a search engine indexes `kaiord.com`
- **THEN** the meta description SHALL be used as the search result snippet

### Requirement: Page titles

The landing page SHALL have the title "Kaiord — One framework. Every fitness format." The editor SHALL have the title "Kaiord Editor".

#### Scenario: Landing page title

- **WHEN** the landing page loads
- **THEN** the browser tab SHALL display "Kaiord — One framework. Every fitness format."

#### Scenario: Editor page title

- **WHEN** the editor loads
- **THEN** the browser tab SHALL display "Kaiord Editor" instead of "workout-spa-editor"

### Requirement: Theme color meta tag

Both the landing page and the editor SHALL include `<meta name="theme-color">` with the value of `--brand-bg-primary` (dark background color). This controls the browser chrome color on mobile devices for brand consistency.

#### Scenario: Mobile browser chrome matches brand

- **WHEN** the landing page is opened on Android Chrome or iOS Safari
- **THEN** the browser address bar SHALL tint to the dark brand background color

### Requirement: Shared brand color tokens

Brand colors SHALL be defined as semantic CSS custom properties in a shared file at the repo root (`styles/brand-tokens.css`), outside any package, importable by both landing and editor via relative path without creating workspace dependencies. Tokens: `--brand-bg-primary`, `--brand-bg-surface`, `--brand-text-primary`, `--brand-text-secondary`, `--brand-text-muted`, `--brand-accent-blue` (`#0284c7`), `--brand-accent-purple` (`#9333ea`), `--brand-border`. No arbitrary hex values SHALL be used in component styles.

#### Scenario: Color consistency

- **WHEN** the landing page and editor render
- **THEN** interactive elements SHALL use the same brand accent colors from the shared tokens

#### Scenario: WCAG contrast

- **WHEN** brand colors are used for text on dark backgrounds
- **THEN** the combinations SHALL meet WCAG AA contrast ratios (4.5:1 body text, 3:1 large text)
