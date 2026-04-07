## 1. Create @kaiord/garmin-bridge package

- [ ] 1.1 Scaffold `packages/garmin-bridge/` with `package.json` (name, version, description, vitest as devDependency)
- [ ] 1.2 Create `manifest.json` with MV3 permissions (`storage`, `tabs`, `webRequest`), `host_permissions` (`connect.garmin.com` only), `externally_connectable` (localhost:5173, localhost:5174, \*.kaiord.com), content script at `document_start`, background service worker
- [ ] 1.3 Implement `background.js` — CSRF capture via `webRequest.onBeforeSendHeaders` stored in `chrome.storage.session`, Garmin tab lookup, message routing to content script, external message API (`ping` with `protocolVersion: 1`, `list`, `push`, `open-garmin`). No console.log of token values.
- [ ] 1.4 Implement `content.js` — capture pristine `fetch` reference at load, validate path/method against allowlist (`GET /workout-service/workouts`, `POST /workout-service/workout`), execute `fetch()` to `/gc-api/*` with required headers, 30s `AbortController` timeout, handle 204 No Content, return response shape `{ ok, status, data/body/error }`
- [ ] 1.5 Create `popup.html` + `popup.js` — diagnostic UI showing CSRF status (boolean only), session check, workout list
- [ ] 1.6 Add extension icon (`icon48.png`, `icon128.png`)

## 2. Extension tests

- [ ] 2.1 Add `vitest.config.js` and Chrome API mock stubs (`chrome.runtime`, `chrome.tabs`, `chrome.webRequest`, `chrome.storage.session`)
- [ ] 2.2 Write unit tests for `background.js` — message routing, CSRF capture/storage, session check, unknown action handling, missing gcn payload
- [ ] 2.3 Write unit tests for `content.js` — path allowlist acceptance/rejection, successful GET/POST, non-2xx responses, 204 handling, timeout, network errors
- [ ] 2.4 Create `TESTING.md` manual integration test checklist (load unpacked, navigate Garmin, verify CSRF, push from SPA)
- [ ] 2.5 Add `privacy-justification.md` explaining each permission for future Web Store review

## 3. SPA — Remove Lambda integration

- [ ] 3.1 Delete `lib/garmin-push.ts` and `lib/garmin-push.test.ts` (Lambda fetch logic)
- [ ] 3.2 Remove `GarminLambdaInput` component from settings panel
- [ ] 3.3 Remove credential fields (username, password) from `GarminTab` settings
- [ ] 3.4 Remove `VITE_GARMIN_LAMBDA_URL` from `.env.example` and any env documentation
- [ ] 3.5 Remove `garmin-store-persistence.ts` (localStorage persistence for credentials)

## 4. SPA — Redesign Garmin store

- [ ] 4.1 Rewrite `garmin-store.ts` — new state: `extensionInstalled`, `sessionActive`, `pushing`, `lastError`, `lastDetectionTimestamp`; no persistence, no credentials
- [ ] 4.2 Rewrite `garmin-store-actions.ts` — new actions: `detectExtension` (2s+4s retry, 30s cache), `pushWorkout` (15s timeout, auto-redetect on 401/403), `listWorkouts` (10s timeout); handle "Extension context invalidated" error with auto-redetect
- [ ] 4.3 Add `VITE_GARMIN_EXTENSION_ID` env var to `.env.example` with unpacked extension ID as default
- [ ] 4.4 Write tests for new Garmin store (detection states, retry logic, cache behavior, push flow, error handling, auto-redetect on 401/403)

## 5. SPA — Update Garmin UI components

- [ ] 5.1 Update `GarminPushButton` — use extension push instead of Lambda; disable when extension not installed or session inactive
- [ ] 5.2 Update `useGarminPush` hook — call store's `pushWorkout` action (extension messaging), show timeout-specific message ("may have been created — check Garmin")
- [ ] 5.3 Create extension install prompt component — shown when `extensionInstalled: false`; include manual install instructions (load unpacked), say "installed AND enabled"; show "Chrome required" if `chrome.runtime` is undefined
- [ ] 5.4 Create session status component — "Connect to Garmin" one-click button that sends `open-garmin` action + polls ping every 2s (up to 5 attempts) with spinner
- [ ] 5.5 Update `GarminTab` in settings panel — show extension status instead of Lambda URL / credentials
- [ ] 5.6 Update `WorkoutActions` to show correct button state based on extension detection
- [ ] 5.7 Write tests for updated Garmin UI components

## 6. Delete @kaiord/infra package

- [ ] 6.1 Document CDK stack teardown procedure in `docs/garmin-bridge-migration.md` (`cdk destroy`, manual cleanup checklist, verification)
- [ ] 6.2 Delete `packages/infra/` directory entirely
- [ ] 6.3 Remove `@kaiord/infra` from root `pnpm-workspace.yaml` if listed
- [ ] 6.4 Remove `@kaiord/infra` from `.changeset/config.json` ignore list
- [ ] 6.5 Delete `.github/workflows/deploy-infra.yml`

## 7. Update CI/CD

- [ ] 7.1 Remove `integration-garmin` job from `.github/workflows/ci.yml`
- [ ] 7.2 Remove `infra` from test matrix in `ci.yml`
- [ ] 7.3 Remove `infra-changed` change detection from `ci.yml`
- [ ] 7.4 Remove `integration-garmin` failure notification label from `ci.yml`
- [ ] 7.5 Verify `@kaiord/garmin-connect` unit tests remain in CI (unchanged)
- [ ] 7.6 Remove `@kaiord/infra` from `.github/workflows/changeset-bot.yml` `PUBLISHABLE` list (if present)
- [ ] 7.7 Remove `@kaiord/infra` from `.github/workflows/release.yml` (paths trigger, version tracking, build step)
- [ ] 7.8 Remove `@kaiord/infra` from `scripts/create-github-releases.js`
- [ ] 7.9 Add `@kaiord/garmin-bridge` to `.changeset/config.json` ignore list (browser extension, not npm-publishable)
- [ ] 7.10 Add `@kaiord/garmin-bridge` to `ci.yml` test matrix (vitest unit tests)

## 8. Cleanup and documentation

- [ ] 8.1 Delete `poc-cf-worker/` directory
- [ ] 8.2 Delete `poc-extension/` directory
- [ ] 8.3 Update root `README.md` — remove infra references, add garmin-bridge package description
- [ ] 8.4 Update `CLAUDE.md` — remove `pnpm --filter @kaiord/infra dev:local` command, add garmin-bridge info
- [ ] 8.5 Update SPA FAQ section (`FAQSection.tsx`) — replace Lambda setup instructions with extension install guide
- [ ] 8.6 Create changeset for breaking changes (`@kaiord/workout-spa-editor`, removed `@kaiord/infra`)
