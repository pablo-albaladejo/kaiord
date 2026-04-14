## Context

The garmin-bridge extension is already published to the Chrome Web Store with:

- Store listing assets (`store-listing.md`, `privacy-justification.md`, `assets/`)
- Hardcoded CI scripts (`package-extension.sh`, `sync-extension-version.mjs`) pointing to `packages/garmin-bridge`
- A single-extension workflow (`cws-publish.yml`) with one set of secrets

The train2go-bridge extension is feature-complete (PR #286 merged) but has no CWS listing assets and is not wired into CI/CD publishing.

## Goals / Non-Goals

**Goals:**

- Publish train2go-bridge to CWS with proper listing, permissions justification, and assets
- Generalize CI scripts to support multiple extensions without duplication
- Reuse the existing Google Cloud project credentials (same `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`)

**Non-Goals:**

- Changing any train2go-bridge runtime code or behavior
- Creating a unified extension that combines both bridges
- Automating screenshot generation (manual capture is fine)

## Decisions

### D1: Parameterize scripts instead of duplicating

**Decision**: Refactor `package-extension.sh` and `sync-extension-version.mjs` to accept a package name argument (e.g., `bash scripts/package-extension.sh train2go-bridge`) instead of creating separate scripts per extension.

**Rationale**: Both extensions have identical packaging structure (manifest.prod.json + JS + HTML + icons). Duplication would create maintenance drift. The only differences are: package directory name, zip filename, and file count (train2go has `parser.js` = 9 files vs garmin's 8).

**Alternative considered**: Separate scripts per extension — rejected due to DRY violation and because the logic is identical.

### D2: Matrix strategy in cws-publish.yml

**Decision**: Use a GitHub Actions matrix to run the publish job for each extension independently, with per-extension secrets for the extension ID.

```yaml
strategy:
  matrix:
    extension:
      - name: garmin-bridge
        secret_id: CWS_EXTENSION_ID
      - name: train2go-bridge
        secret_id: CWS_TRAIN2GO_EXTENSION_ID
```

**Rationale**: Shared credentials (same Google Cloud project) but different CWS extension IDs. Matrix avoids duplicating the entire job. Each extension publishes independently when its files change.

**Alternative considered**: Two separate workflow files — rejected because 95% of the steps are identical.

### D3: Separate extension ID secret, shared OAuth credentials

**Decision**: Add only `CWS_TRAIN2GO_EXTENSION_ID` as a new GitHub secret. Reuse existing `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.

**Rationale**: Both extensions belong to the same CWS developer account and Google Cloud project. The OAuth tokens are account-level, not extension-level.

### D4: File count validation per extension

**Decision**: The package script validates file count. Train2go-bridge has 9 files (extra `parser.js`) vs garmin-bridge's 8. Pass the expected count as a parameter or compute it dynamically from the file list.

**Rationale**: Static file count is fragile. Compute from the actual files copied into the temp directory.

## Risks / Trade-offs

- **[Matrix path trigger]** GitHub Actions path triggers with matrix can be noisy — a change to garmin-bridge triggers the workflow but train2go-bridge matrix entry detects no version change and skips. Acceptable: the skip is fast and explicit.
  → Mitigation: The version-change detection step already handles this gracefully.

- **[Screenshot creation]** Screenshots must be manually captured from the running extension. No automation available.
  → Mitigation: Include step-by-step capture instructions in `store-listing.md`.

- **[CWS review time]** First submission may take longer for manual review (1-3 business days).
  → Mitigation: No code changes needed, just patience.
