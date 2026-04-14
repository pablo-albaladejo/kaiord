## 1. Store Listing Assets

- [x] 1.1 Create `packages/train2go-bridge/store-listing.md` with extension name, short description, detailed description, metadata, and screenshot capture instructions
- [x] 1.2 Create `packages/train2go-bridge/privacy-justification.md` documenting `tabs` permission, `https://app.train2go.com/*` host permission, and `externally_connectable` matches
- [x] 1.3 Create `packages/train2go-bridge/dist/cws-privacy-practices.txt` in CWS submission format

## 2. Generalize CI Scripts

- [x] 2.1 Refactor `scripts/package-extension.sh` to accept extension name as argument, dynamically determine file list and count
- [x] 2.2 Refactor `scripts/sync-extension-version.mjs` to accept extension name as argument, default to processing all extensions if no argument given
- [x] 2.3 Verify both scripts work for garmin-bridge (backward compatibility)
- [x] 2.4 Verify both scripts work for train2go-bridge

## 3. CI Workflow

- [x] 3.1 Update `.github/workflows/cws-publish.yml` to use matrix strategy for both extensions with per-extension secrets
- [x] 3.2 Update path triggers to include `packages/train2go-bridge/**`

## 4. Finalize

- [x] 4.1 Run `pnpm lint:fix` and verify zero warnings/errors (pre-existing packages/ai errors unrelated)
- [x] 4.2 Create changeset for the CI/script changes
- [ ] 4.3 Commit and create PR
