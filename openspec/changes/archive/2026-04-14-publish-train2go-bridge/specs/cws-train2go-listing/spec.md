## ADDED Requirements

### Requirement: Train2Go Bridge store listing documentation

The train2go-bridge package SHALL include a `store-listing.md` file containing the extension name, short description (max 132 characters), detailed description with features and privacy notes, and metadata (category, privacy policy URL, website, support URL, publisher).

#### Scenario: Store listing file exists with required fields

- **WHEN** the `packages/train2go-bridge/store-listing.md` file is read
- **THEN** it SHALL contain: extension name, short description, detailed description, and metadata section with category, privacy policy URL, website, support URL, and publisher

### Requirement: Train2Go Bridge privacy justification

The train2go-bridge package SHALL include a `privacy-justification.md` file explaining why each declared permission is required, for CWS review.

#### Scenario: Privacy justification covers all manifest permissions

- **WHEN** the `packages/train2go-bridge/privacy-justification.md` file is read
- **THEN** it SHALL document justification for the `tabs` permission, the `https://app.train2go.com/*` host permission, and the `externally_connectable` matches

### Requirement: Train2Go Bridge CWS privacy practices

The train2go-bridge package SHALL include a `dist/cws-privacy-practices.txt` file in CWS submission format covering single purpose description, host permission justification, and tabs permission justification.

#### Scenario: CWS privacy practices file exists

- **WHEN** the `packages/train2go-bridge/dist/cws-privacy-practices.txt` file is read
- **THEN** it SHALL contain: Single Purpose Description, Host Permission Justification, and Tabs Permission Justification sections

### Requirement: Multi-extension packaging script

The `scripts/package-extension.sh` script SHALL accept an extension name argument to package any extension, not just garmin-bridge.

#### Scenario: Package garmin-bridge by name

- **WHEN** `bash scripts/package-extension.sh garmin-bridge` is executed
- **THEN** it SHALL produce `packages/garmin-bridge/dist/kaiord-garmin-bridge-<version>.zip` with the correct files

#### Scenario: Package train2go-bridge by name

- **WHEN** `bash scripts/package-extension.sh train2go-bridge` is executed
- **THEN** it SHALL produce `packages/train2go-bridge/dist/kaiord-train2go-bridge-<version>.zip` with the correct files including `parser.js`

#### Scenario: Script fails without argument

- **WHEN** `bash scripts/package-extension.sh` is executed without arguments
- **THEN** it SHALL exit with a non-zero code and print a usage message

### Requirement: Multi-extension version sync script

The `scripts/sync-extension-version.mjs` script SHALL accept an extension name argument to sync versions for any extension.

#### Scenario: Sync train2go-bridge versions

- **WHEN** `node scripts/sync-extension-version.mjs train2go-bridge` is executed
- **THEN** it SHALL update `packages/train2go-bridge/manifest.json` and `packages/train2go-bridge/manifest.prod.json` version fields to match `packages/train2go-bridge/package.json`

### Requirement: CI workflow publishes both extensions

The `cws-publish.yml` workflow SHALL detect and publish version changes for both garmin-bridge and train2go-bridge independently.

#### Scenario: Train2Go Bridge version change triggers publish

- **WHEN** a push to main changes files under `packages/train2go-bridge/`
- **THEN** the workflow SHALL detect the version change, package the extension, upload to CWS using `CWS_TRAIN2GO_EXTENSION_ID`, and create a git tag `@kaiord/train2go-bridge@<version>`

#### Scenario: Garmin Bridge publish is unchanged

- **WHEN** a push to main changes files under `packages/garmin-bridge/`
- **THEN** the workflow SHALL continue to publish garmin-bridge using `CWS_EXTENSION_ID` as before
