## 1. Extension content scripts

- [ ] 1.1 Create `packages/garmin-bridge/kaiord-announce.js` — content script that posts `KAIORD_BRIDGE_ANNOUNCE` and listens for `KAIORD_BRIDGE_DISCOVER`
- [ ] 1.2 Update `packages/garmin-bridge/manifest.json` — add content script entry for `*.kaiord.com` and `localhost:*`
- [ ] 1.3 Create `packages/train2go-bridge/kaiord-announce.js` — same pattern as garmin
- [ ] 1.4 Update `packages/train2go-bridge/manifest.json` — add content script entry

## 2. SPA bridge discovery adapter

- [ ] 2.1 Create `adapters/bridge/bridge-discovery.ts` — listens for `KAIORD_BRIDGE_ANNOUNCE`, validates, exposes discovered bridges
- [ ] 2.2 Add tests for `bridge-discovery.ts` (announce, re-discover, timeout, spoofed message)
- [ ] 2.3 Wire discovery into app bootstrap (listen on mount, cleanup on unmount)

## 3. Remove VITE env var coupling

- [ ] 3.1 Update `use-garmin-bridge-actions.ts` — get extensionId from discovery instead of `import.meta.env`
- [ ] 3.2 Update `train2go-store.ts` / `train2go-store-actions.ts` — get extensionId from discovery
- [ ] 3.3 Remove `VITE_GARMIN_EXTENSION_ID` and `VITE_TRAIN2GO_EXTENSION_ID` from `.env.example`
- [ ] 3.4 Update tests for hooks/stores that mocked env vars

## 4. Integration and verification

- [ ] 4.1 Run full test suite, fix any broken tests
- [ ] 4.2 Run lint and type check
- [ ] 4.3 Manual verification: install both extensions locally, confirm discovery works on localhost
- [ ] 4.4 Update `deploy-site.yml` — remove any VITE extension ID env vars (currently none, confirm)
- [ ] 4.5 Create changeset
