## 1. Create @kaiord/garmin-bridge package

- [x] 1.1 Scaffold `packages/garmin-bridge/` with `package.json` (name, version, description, vitest as devDependency)
- [x] 1.2 Create `manifest.json` with MV3 permissions (`storage`, `tabs`, `webRequest`), `host_permissions` (`connect.garmin.com` only), `externally_connectable` (localhost:5173, localhost:5174, \*.kaiord.com), content script at `document_start`, background service worker
- [x] 1.3 Implement `background.js` — CSRF capture via `webRequest.onBeforeSendHeaders` stored in `chrome.storage.session`, Garmin tab lookup, message routing to content script, external message API (`ping` with `protocolVersion: 1`, `list`, `push`, `open-garmin`). No console.log of token values.
- [x] 1.4 Implement `content.js` — capture pristine `fetch` reference at load, validate path/method against allowlist (`GET /workout-service/workouts`, `POST /workout-service/workout`), execute `fetch()` to `/gc-api/*` with required headers, 30s `AbortController` timeout, handle 204 No Content, return response shape `{ ok, status, data/body/error }`
- [x] 1.5 Create `popup.html` + `popup.js` — diagnostic UI showing CSRF status (boolean only), session check, workout list
- [x] 1.6 Add extension icon (`icon48.png`, `icon128.png`) — placeholder PNGs, replace with proper icons later

## 2. Extension tests

- [x] 2.1 Add `vitest.config.js` and Chrome API mock stubs (`chrome.runtime`, `chrome.tabs`, `chrome.webRequest`, `chrome.storage.session`)
- [x] 2.2 Write unit tests for `background.js` — message routing, CSRF capture/storage, session check, unknown action handling, missing gcn payload
- [x] 2.3 Write unit tests for `content.js` — path allowlist acceptance/rejection, successful GET/POST, non-2xx responses, 204 handling, timeout, network errors
- [x] 2.4 Create `TESTING.md` manual integration test checklist (load unpacked, navigate Garmin, verify CSRF, push from SPA)
- [x] 2.5 Add `privacy-justification.md` explaining each permission for future Web Store review

## 3. SPA — Remove Lambda integration

- [x] 3.1 Delete `lib/garmin-push.ts` and `lib/garmin-push.test.ts` (Lambda fetch logic)
- [x] 3.2 Remove `GarminLambdaInput` component from settings panel
- [x] 3.3 Remove credential fields (username, password) from `GarminTab` settings
- [x] 3.4 Remove `VITE_GARMIN_LAMBDA_URL` from `.env.example` and any env documentation
- [x] 3.5 Remove `garmin-store-persistence.ts` (localStorage persistence for credentials)

## 4. SPA — Redesign Garmin store

- [x] 4.1 Rewrite `garmin-store.ts` — new state: `extensionInstalled`, `sessionActive`, `pushing`, `lastError`, `lastDetectionTimestamp`; no persistence, no credentials
- [x] 4.2 Rewrite `garmin-store-actions.ts` — new actions: `detectExtension` (2s+4s retry, 30s cache), `pushWorkout` (15s timeout, auto-redetect on 401/403), `listWorkouts` (10s timeout); handle "Extension context invalidated" error with auto-redetect
- [x] 4.3 Add `VITE_GARMIN_EXTENSION_ID` env var to `.env.example` with unpacked extension ID as default
- [x] 4.4 Write tests for new Garmin store (detection states, retry logic, cache behavior, push flow, error handling, auto-redetect on 401/403)

## 5. SPA — Update Garmin UI components

- [x] 5.1 Update `GarminPushButton` — use extension push instead of Lambda; disable when extension not installed or session inactive
- [x] 5.2 Update `useGarminPush` hook — call store's `pushWorkout` action (extension messaging), show timeout-specific message ("may have been created — check Garmin")
- [x] 5.3 Create extension install prompt component — integrated into GarminTab settings panel
- [x] 5.4 Create session status component — integrated into GarminTab settings panel
- [x] 5.5 Update `GarminTab` in settings panel — show extension status instead of Lambda URL / credentials
- [x] 5.6 Update `WorkoutActions` — GarminPushButton now self-hides when extension not installed
- [x] 5.7 Write tests for updated Garmin UI components

## 6. Delete @kaiord/infra package

- [x] 6.1 Document CDK stack teardown procedure in `docs/garmin-bridge-migration.md`
- [x] 6.2 Delete `packages/infra/` directory entirely
- [x] 6.3 Remove `@kaiord/infra` from root `pnpm-workspace.yaml` if listed — uses `packages/*` glob, no explicit listing
- [x] 6.4 Remove `@kaiord/infra` from `.changeset/config.json` ignore list — replaced with `@kaiord/garmin-bridge`
- [x] 6.5 Delete `.github/workflows/deploy-infra.yml`

## 7. Update CI/CD

- [x] 7.1 Remove `integration-garmin` job from `.github/workflows/ci.yml`
- [x] 7.2 Remove `infra` from test matrix in `ci.yml` — replaced with `garmin-bridge`
- [x] 7.3 Remove `infra-changed` change detection from `ci.yml`
- [x] 7.4 Remove `integration-garmin` failure notification from `ci.yml`
- [x] 7.5 Verify `@kaiord/garmin-connect` unit tests remain in CI (unchanged) — confirmed in test matrix
- [x] 7.6 Remove `@kaiord/infra` from `.github/workflows/changeset-bot.yml` `PUBLISHABLE` list — was not listed
- [x] 7.7 Remove `@kaiord/infra` from `.github/workflows/release.yml` — was not listed
- [x] 7.8 Remove `@kaiord/infra` from `scripts/create-github-releases.js` — was not listed
- [x] 7.9 Add `@kaiord/garmin-bridge` to `.changeset/config.json` ignore list
- [x] 7.10 Add `@kaiord/garmin-bridge` to `ci.yml` test matrix

## 8. Cleanup and documentation

- [x] 8.1 Delete `poc-cf-worker/` directory — already removed (was never committed)
- [x] 8.2 Delete `poc-extension/` directory
- [x] 8.3 Update root `README.md` — no infra references found, no changes needed
- [x] 8.4 Update `CLAUDE.md` — removed infra dev:local command, added garmin-bridge package
- [x] 8.5 Update SPA FAQ section (`FAQSection.tsx`) — no Lambda-specific content found, no changes needed
- [x] 8.6 Create changeset for breaking changes — deferred to commit time
