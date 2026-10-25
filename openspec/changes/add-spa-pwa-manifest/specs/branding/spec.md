## ADDED Requirements

### Requirement: Installable web app manifest

The editor SHALL link a web app manifest from its `index.html` at `<base>manifest.webmanifest`, where `<base>` is the Vite build base (`/app/` in production). The manifest SHALL set `id`, `start_url` and `scope` to `/app/`, `display` to `standalone`, `name` and `short_name` to `Kaiord`, and `theme_color` and `background_color` to the value of the editor's `theme-color` meta tag. It SHALL list a 192x192 and a 512x512 PNG icon, and one 512x512 PNG icon with `purpose` `maskable` whose mark lies inside the central 80% safe zone. The icons SHALL be generated from the brand masters by `pnpm brand:images`. The editor SHALL NOT register a service worker, so a deploy can never leave an installed client running a cached shell that points at chunks no longer served.

#### Scenario: Chrome on Android offers to install the editor

- **GIVEN** the production deploy of `kaiord.com/app/`
- **WHEN** Chrome on Android loads it
- **THEN** it SHALL find the linked manifest with no installability error, and the installed app SHALL open `/app/` in a standalone window

#### Scenario: The shipped tree carries the manifest and its icons

- **GIVEN** the merged site tree the deploy publishes
- **WHEN** the dist guard reads `app/index.html` with base `/app/`
- **THEN** the HTML SHALL link `/app/manifest.webmanifest`, the manifest SHALL parse with `id`, `start_url` and `scope` `/app/`, and its 192 and 512 icons SHALL exist at those pixel sizes

#### Scenario: No service worker is registered

- **WHEN** the editor loads
- **THEN** no service worker SHALL be registered and every chunk SHALL load from the network as today
