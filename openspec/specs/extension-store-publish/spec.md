> Synced: 2026-04-20

# Extension Store Publish

## Purpose

Generic requirements that any Chrome extension in the monorepo MUST meet before CWS submission: icons, production manifest, store listing, and privacy documentation.

## Requirements

### Requirement: Production extension icons

The extension SHALL include PNG icons at 16x16, 48x48, and 128x128 pixels, generated from the project's `assets/favicon.svg`. Icons SHALL use the brand colors: `#0284c7` (sky-600) on `#0f172a` (slate-900) background with rounded corners. Icons SHALL be stored in `packages/garmin-bridge/icons/` and committed to the repository (they rarely change and avoid build-step dependencies).

#### Scenario: Icons are valid PNG at correct dimensions

- **GIVEN** the icon generation script has been run
- **WHEN** the icon files are inspected
- **THEN** `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` SHALL exist as valid PNG files at their respective dimensions

#### Scenario: Icon is legible at 16x16

- **WHEN** the 16x16 icon is displayed in the Chrome toolbar
- **THEN** the Kaiord hexagon symbol SHALL be recognizable without fine detail artifacts

### Requirement: Production manifest

The extension SHALL have a `manifest.prod.json` that is identical to `manifest.json` except:

- `externally_connectable.matches` SHALL only contain `https://*.kaiord.com/*` (no localhost origins)
- The top-level `icons` field SHALL reference `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png`
- `action.default_icon` SHALL reference `icons/icon48.png` and `icons/icon128.png` (Chrome does not use 16px for the action icon)

The development `manifest.json` SHALL remain unchanged for local development.

#### Scenario: Production manifest excludes localhost

- **WHEN** `manifest.prod.json` is read
- **THEN** `externally_connectable.matches` SHALL NOT contain any `http://localhost:*` entries

#### Scenario: Production manifest includes real icons

- **WHEN** `manifest.prod.json` is read
- **THEN** `action.default_icon` SHALL reference `icons/icon48.png` and `icons/icon128.png`
- **AND** a top-level `icons` field SHALL reference sizes 16, 48, and 128

#### Scenario: Dev manifest retains localhost origins with updated icons

- **WHEN** a developer loads the extension unpacked from the source directory
- **THEN** `manifest.json` SHALL contain localhost origins in `externally_connectable`
- **AND** `manifest.json` SHALL reference the new icon paths in `icons/`

### Requirement: Extension packaging script

The project SHALL include a `scripts/package-extension.sh` script that accepts an extension name argument and produces a `.zip` file ready for Chrome Web Store upload. The script SHALL copy:

- All `*.js` and `*.html` files from the package root (excluding `vitest.config*`)
- `icons/` directory (all PNG icons)
- `manifest.prod.json` copied as `manifest.json`

The script SHALL read the version from `packages/<extension>/package.json` and output to `packages/<extension>/dist/kaiord-<extension>-{version}.zip`.

The script SHALL exit with a non-zero code and a usage message when called without arguments.

The script SHALL exit with a non-zero code and a descriptive error message if:

- `manifest.prod.json` does not exist
- The `icons/` directory does not exist or is empty
- The version cannot be read from `package.json`
- The version in `manifest.prod.json` does not match `package.json`

After creating the zip, the script SHALL verify that the packaged `manifest.json` does not contain localhost origins.

The packaging script MAY be invoked by CI without user interaction. It SHALL produce deterministic output given the same input files and SHALL NOT require a TTY.

#### Scenario: Packaging produces valid zip

- **GIVEN** the icons exist in `icons/` and `manifest.prod.json` exists
- **WHEN** `scripts/package-extension.sh garmin-bridge` is executed
- **THEN** a zip file SHALL be created at `packages/garmin-bridge/dist/kaiord-garmin-bridge-{version}.zip`
- **AND** the zip SHALL contain the extension's JS/HTML files, manifest.json, and icon files

#### Scenario: Packaging uses production manifest

- **GIVEN** the packaging script has produced a zip
- **WHEN** the zip is extracted
- **THEN** `manifest.json` inside the zip SHALL match the contents of `manifest.prod.json` (not the dev manifest)
- **AND** `externally_connectable.matches` SHALL NOT contain any localhost entries

#### Scenario: Packaging fails when manifest is missing

- **GIVEN** `manifest.prod.json` does not exist
- **WHEN** `scripts/package-extension.sh` is executed
- **THEN** the script SHALL exit with a non-zero code and print an error message indicating the missing file

#### Scenario: Packaging fails when icons directory is missing

- **GIVEN** the `icons/` directory does not exist or contains no PNG files
- **WHEN** `scripts/package-extension.sh` is executed
- **THEN** the script SHALL exit with a non-zero code and print an error message about missing icons

#### Scenario: Packaging fails when version cannot be read

- **GIVEN** `packages/<extension>/package.json` does not exist or has no `version` field
- **WHEN** `scripts/package-extension.sh <extension>` is executed
- **THEN** the script SHALL exit with a non-zero code and print an error message about the missing version

#### Scenario: Packaging is CI-compatible

- **GIVEN** the script is executed in a headless CI environment
- **WHEN** no TTY is attached
- **THEN** the script SHALL complete without prompts or interactive input

#### Scenario: Packaging script is idempotent

- **GIVEN** a zip file already exists at `packages/<extension>/dist/kaiord-<extension>-{version}.zip`
- **WHEN** `scripts/package-extension.sh <extension>` is executed again
- **THEN** the script SHALL overwrite the existing zip without error

### Requirement: Chrome Web Store listing metadata

The CWS listing SHALL use the following metadata:

- **Name**: "Kaiord Garmin Bridge"
- **Short description**: "Connects the Kaiord workout editor to Garmin Connect via your browser session"
- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: `https://kaiord.com/docs/legal/privacy-policy`

A `store-listing.md` file SHALL be created in `packages/garmin-bridge/` documenting the full listing text and submission checklist.

#### Scenario: Store listing file contains required metadata

- **WHEN** `packages/garmin-bridge/store-listing.md` is read
- **THEN** it SHALL contain: extension name, short description, detailed description, category, privacy policy URL, and a submission checklist
