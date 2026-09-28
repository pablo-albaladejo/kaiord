## RENAMED Requirements

- FROM: `### Requirement: SPA editor served at /editor/ path`
- TO: `### Requirement: SPA editor served at /app/ path`

## MODIFIED Requirements

### Requirement: SPA editor served at /app/ path

The SPA editor SHALL be served at `kaiord.com/app/` with full functionality preserved. The editor's `VITE_BASE_PATH` SHALL be set to `/app/` in the deploy workflow env var only (local dev remains at `/`). The legacy `kaiord.com/editor/` URL SHALL answer 200 with a page whose `rel="canonical"` is `https://kaiord.com/app/` and that redirects immediately to the editor; it SHALL NOT carry `noindex`. Site content SHALL link `/app/`, never `/editor/`.

#### Scenario: Editor loads at /app/

- **WHEN** a user navigates to `https://kaiord.com/app/`
- **THEN** the workout SPA editor loads and functions identically to the current deployment

#### Scenario: Editor loads at /editor/

- **WHEN** a user navigates to the legacy `https://kaiord.com/editor/`
- **THEN** the response status SHALL be 200
- **AND** the page SHALL carry `<link rel="canonical" href="https://kaiord.com/app/">` and no `noindex`
- **AND** the browser SHALL land on the editor at `/app/` immediately

#### Scenario: Content never links the legacy path

- **WHEN** a built landing, docs or SPA page links `https://kaiord.com/editor/`
- **THEN** `scripts/check-site-links.mjs` SHALL fail, naming the file and the link

#### Scenario: Local dev unaffected

- **WHEN** a developer runs `pnpm --filter @kaiord/workout-spa-editor dev`
- **THEN** the editor SHALL serve at `localhost:5173/` with base path `/`
