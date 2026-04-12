## Why

Publishing the Garmin Bridge extension to the Chrome Web Store currently requires manual zip generation and dashboard upload. As the extension evolves, this manual process is error-prone (wrong manifest, forgotten version bump) and slow. Automating the CWS publish via GitHub Actions ensures every release is consistent, traceable, and hands-free — matching the existing npm release automation via changesets.

## What Changes

- Add `chrome-webstore-upload-cli` as a root devDependency for CWS API integration
- Create a dedicated GitHub Actions workflow (`cws-publish.yml`) that packages and publishes the extension to CWS when `@kaiord/garmin-bridge` version changes on main
- Add a version sync script that keeps `manifest.json` and `manifest.prod.json` versions in sync with `package.json`
- Remove `@kaiord/garmin-bridge` from the changesets `ignore` list so it participates in versioning (it remains `private: true`, so npm publish is skipped automatically)
- Document the one-time OAuth credential setup for CWS API access

## Capabilities

### New Capabilities

- `cws-auto-publish`: Automated Chrome Web Store publishing pipeline triggered by version changes to `@kaiord/garmin-bridge`

### Modified Capabilities

- `extension-store-publish`: The packaging script gains CI-compatibility documentation; the submission checklist is updated to reflect the automated flow

## Impact

- **Packages affected**: `@kaiord/garmin-bridge` (version sync, changeset config), root (new devDependency, new workflow)
- **Hexagonal layers**: Infrastructure only (CI/CD pipeline, no domain/application changes)
- **APIs**: No changes to the extension message API
- **Dependencies**: `chrome-webstore-upload-cli` as root devDependency
- **External systems**: Chrome Web Store API (OAuth2 credentials), GitHub Secrets (3 new secrets)
- **Config changes**: `.changeset/config.json` (remove garmin-bridge from ignore list)
- **Manual steps required**: One-time setup of Google Cloud OAuth credentials and GitHub Secrets
