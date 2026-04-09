## MODIFIED Requirements

### Requirement: Sticky navigation

The landing page sticky nav SHALL include a "Docs" link pointing to `/docs/` alongside the existing "Features", "Developers", "Open Source", and "GitHub" links.

#### Scenario: Docs link in nav

- **WHEN** the landing page renders
- **THEN** the sticky nav SHALL include a "Docs" link that navigates to `kaiord.com/docs/`

### Requirement: SEO fundamentals

The landing page SHALL update `robots.txt` to allow `/docs/` and `sitemap.xml` to include documentation page URLs.

#### Scenario: Docs crawlable

- **WHEN** a search engine crawls `kaiord.com/robots.txt`
- **THEN** `/docs/` SHALL be allowed (not disallowed)

#### Scenario: Docs in sitemap

- **WHEN** a search engine reads `kaiord.com/sitemap.xml`
- **THEN** documentation URLs SHALL be included
