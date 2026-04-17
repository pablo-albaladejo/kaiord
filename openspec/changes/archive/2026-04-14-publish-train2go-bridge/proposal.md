> Completed: 2026-04-14

## Why

The train2go-bridge Chrome extension is feature-complete and tested but not yet published to the Chrome Web Store. The garmin-bridge extension is already published and serves as the template. Publishing train2go-bridge enables users to install it directly from the CWS instead of loading it as an unpacked extension.

## What Changes

- Add CWS listing assets for `@kaiord/train2go-bridge`: store listing description, privacy justification, and CWS privacy practices documentation
- Generalize the CI/CD publishing scripts (`package-extension.sh`, `sync-extension-version.mjs`) to support multiple extensions instead of hardcoding garmin-bridge
- Update `cws-publish.yml` workflow to publish train2go-bridge alongside garmin-bridge (with separate extension IDs and secrets)
- Add screenshot capture guidelines for the Train2Go Bridge popup states

## Capabilities

### New Capabilities

- `cws-train2go-listing`: Chrome Web Store listing assets and documentation for the train2go-bridge extension (store description, privacy justification, permission documentation)

### Modified Capabilities

_(none — no spec-level behavior changes, only CI/CD and store listing additions)_

## Impact

- **Packages**: `@kaiord/train2go-bridge` (listing assets only, no code changes)
- **Scripts**: `scripts/package-extension.sh` and `scripts/sync-extension-version.mjs` need parameterization to support both extensions
- **CI/CD**: `.github/workflows/cws-publish.yml` needs a matrix or second job for train2go-bridge
- **GitHub Secrets**: New secrets needed: `CWS_TRAIN2GO_EXTENSION_ID` (client ID/secret/refresh token reusable from garmin-bridge since same Google Cloud project)
- **Hexagonal layers**: None — this change is purely infrastructure/CI and store metadata
