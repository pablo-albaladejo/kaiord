## MODIFIED Requirements

### Requirement: Extension packaging script

The project SHALL include a `scripts/package-extension.sh` script that produces a `.zip` file ready for Chrome Web Store upload. The script SHALL use a whitelist approach, copying only explicitly named production files:

- `background.js`, `content.js`, `popup.html`, `popup.js` (popup.html uses inline styles with no external CSS/asset references)
- `icons/` directory (all PNG icons)
- `manifest.prod.json` copied as `manifest.json`

The script SHALL read the version from `packages/garmin-bridge/package.json` and output to `packages/garmin-bridge/dist/kaiord-garmin-bridge-{version}.zip`.

The script SHALL exit with a non-zero code and a descriptive error message if:

- `manifest.prod.json` does not exist
- The `icons/` directory does not exist or is empty
- The version cannot be read from `package.json`
- The version in `manifest.prod.json` does not match `package.json` (documents existing behavior)

After creating the zip, the script SHALL verify that the packaged `manifest.json` does not contain localhost origins.

The packaging script MAY be invoked by CI without user interaction. It SHALL produce deterministic output given the same input files and SHALL NOT require a TTY.

#### Scenario: Packaging produces valid zip

- **GIVEN** the icons exist in `icons/` and `manifest.prod.json` exists
- **WHEN** `scripts/package-extension.sh` is executed
- **THEN** a zip file SHALL be created at `packages/garmin-bridge/dist/kaiord-garmin-bridge-{version}.zip`
- **AND** the zip SHALL contain 5 root files (`manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`) and 3 icon files under `icons/` (`icon16.png`, `icon48.png`, `icon128.png`)

#### Scenario: Packaging is CI-compatible

- **GIVEN** the script is executed in a headless CI environment
- **WHEN** no TTY is attached
- **THEN** the script SHALL complete without prompts or interactive input
