## MODIFIED Requirements

### Requirement: Theme color meta tag

The landing page, the editor, AND the documentation site SHALL include `<meta name="theme-color">` with the value of `--brand-bg-primary` (dark background color). This controls the browser chrome color on mobile devices for brand consistency across every first-party surface.

#### Scenario: Mobile browser chrome matches brand on landing and editor

- **WHEN** the landing page or the editor is opened on Android Chrome or iOS Safari
- **THEN** the browser address bar SHALL tint to the dark brand background color

#### Scenario: Documentation site matches brand

- **WHEN** any `/docs/*` page is opened on Android Chrome or iOS Safari
- **THEN** the VitePress-rendered HTML SHALL include `<meta name="theme-color" content="#0f172a">` in its `<head>` so the browser address bar tints to the same dark brand background color as the landing page and the editor
