## MODIFIED Requirements

### Requirement: Production extension icons

Each extension SHALL include PNG icons at 16x16, 48x48, and 128x128 pixels, generated from a single shared SVG master at `packages/_shared/extension-icon/master.svg` via the repo-level `pnpm icons:build` script. Icons SHALL preserve the shared Kaiord silhouette and SHALL use a per-bridge accent color drawn from the brand-compliant palette:

- Garmin Bridge: accent `#007cc3` (Garmin-compatible blue) on the `#0f172a` (slate-900) background.
- Train2Go Bridge: accent `#f74464` (Kaiord coral, matches the existing Train2Go popup brand color) on the `#0f172a` (slate-900) background.

The previously-fixed `#0284c7` (sky-600) accent is superseded; per-bridge accents are required to make the two extensions visually distinguishable in the browser toolbar at every size, especially 16×16. Icons SHALL be stored in `packages/<bridge>/icons/` and committed to the repository (they rarely change and the build script is run on demand, not as part of the install pipeline).

A mechanical guard (`scripts/check-extension-icons-distinct.mjs`) SHALL fail the lint job if either of the following is true at any of the three sizes:

1. The Garmin and Train2Go icons of that size are pixel-identical or below a fixed inter-icon mean-color-delta threshold.
2. At 16×16, the bridge's accent color (within ±15° hue tolerance of the bridge's accent token) constitutes less than 25% of non-transparent pixel mass.

#### Scenario: Icons are valid PNG at correct dimensions

- **GIVEN** the icon generation script has been run
- **WHEN** the icon files are inspected
- **THEN** `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` SHALL exist as valid PNG files at their respective dimensions

#### Scenario: Icon is legible at 16x16

- **WHEN** the 16x16 icon is displayed in the Chrome toolbar
- **THEN** the Kaiord hexagon symbol SHALL be recognizable without fine detail artifacts

#### Scenario: Per-bridge icons are visually distinguishable

- **WHEN** the icon-build guard compares the Garmin and Train2Go icons at the same size
- **THEN** the average per-pixel color delta SHALL exceed the configured visual-separation threshold

#### Scenario: Accent color occupies sufficient pixel mass

- **WHEN** the icon-build guard inspects either bridge's `icons/icon16.png`
- **THEN** pixels within ±15° hue of that bridge's accent token SHALL constitute at least 25% of the non-transparent pixel mass

#### Scenario: Icons regenerate from a shared SVG master

- **WHEN** `pnpm icons:build` is run from the repo root
- **THEN** both bridges' `icons/icon{16,48,128}.png` SHALL be regenerated from `packages/_shared/extension-icon/master.svg` with the bridge-specific accent applied
