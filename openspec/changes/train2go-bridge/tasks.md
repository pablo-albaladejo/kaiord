## 1. Extension Package Setup

- [x] 1.1 Create `packages/train2go-bridge/` directory with `package.json`, `vitest.config.js`, `tsconfig.json`
- [x] 1.2 Create `manifest.json` (dev) and `manifest.prod.json` (prod) with MV3, `tabs` permission, `https://app.train2go.com/*` host permission, `externally_connectable` origins
- [x] 1.3 Create extension icons (16, 48, 128) — reuse Kaiord icon set with Train2Go color variant
- [x] 1.4 Create `popup.html` and `popup.js` with session check UI (Check Session button, status indicator, user name display, Read This Week button)

## 2. Content Script

- [x] 2.1 Create `content.js` with pristine `fetch` capture at `document_start`, anchored regex allowlist (GET-only: `^/api/v2/profile/ping$`, `^/api/v2/workplan/weekly/[\d-]+(\?user=\d+(&source=\w+)?)?$`, `^/api/v2/workplan/daily/[\d-]+(\?user=\d+(&source=\w+)?)?$`, `^/api/v2/workplan/tooltip/activity/\d+$`), and `train2go-fetch` message handler with 30s abort timeout
- [x] 2.2 Create `test/content.test.js` — test allowlist validation (allowed paths pass, disallowed paths/methods blocked), timeout handling, error responses

## 3. HTML Parser

- [x] 3.1 Create `parser.js` with `parseWeeklyHtml(html)` — extract activities from weekly workplan HTML (id, date, sport, title, duration, workload, status) by splitting on `workplan-table-date-{date}` day cells
- [x] 3.2 Create `parser.js` with `parseDailyHtml(html)` — extract full activity detail from daily HTML (description from `.activity-description`, completion from `.percent`)
- [x] 3.3 Create `parser.js` with `parsePingJson(json)` — extract userId, name, sessionActive from profile/ping response
- [x] 3.4 Create `test/parser.test.js` — test weekly parsing (multi-day activities, empty days, HTML entity decoding, malformed HTML graceful degradation), daily parsing (rich description, empty description, completion), ping parsing (active session, expired session)
- [x] 3.5 Create `test/fixtures/` with saved HTML fragments from real Train2Go responses (weekly, daily, tooltip, ping) for parser tests

## 4. Background Service Worker

- [x] 4.1 Create `background.js` with `PROTOCOL_VERSION = 1`, tab helpers (`findTrain2GoTab`), content script messaging (`train2goFetch`), and action handlers (`ping`, `read-week`, `read-day`, `open-train2go`)
- [x] 4.2 Wire `ping` action: call content script with `/api/v2/profile/ping`, parse response with `parsePingJson`, return bridge manifest + session data
- [x] 4.3 Wire `read-week` action: call content script with `/api/v2/workplan/weekly/{date}?user={userId}`, extract JSON `.data.replace["#workplan"]`, parse with `parseWeeklyHtml`, return activities array spanning all 3 weeks (prev + current + next) from the single API response
- [x] 4.4 Wire `read-day` action: call content script with `/api/v2/workplan/daily/{date}?user={userId}&source=sidebar`, extract JSON `.data.content`, parse with `parseDailyHtml`, return activities with descriptions
- [x] 4.5 Wire external message listeners (`onMessageExternal` for SPA, `onMessage` for popup)
- [x] 4.6 Create `test/background.test.js` — test all actions (ping, read-week, read-day, open-train2go, unknown action), error handling (no tab, session expired), bridge manifest shape
- [x] 4.7 Create `test/chrome-mock.js` — minimal Chrome API mock (tabs.query, tabs.sendMessage, tabs.create, runtime.lastError)

## 5. SPA Bridge Schema Extension

- [ ] 5.1 Add `"read:training-plan"` to `bridgeCapabilitySchema` enum in `packages/workout-spa-editor/src/types/bridge-schemas.ts`
- [ ] 5.2 Add `VITE_TRAIN2GO_EXTENSION_ID` to `.env.example` and SPA env type declarations. Ensure the SPA gracefully skips Train2Go detection when the env var is unset (no error, no crash)

## 6. SPA Train2Go State & Data Fetching

- [ ] 6.1 Create Train2Go state (Zustand slice or React context) with `extensionInstalled`, `sessionActive`, `userId`, `userName`, `loading`, `lastError`, `lastDetectionTimestamp`, `activities` (transient, not Dexie)
- [ ] 6.2 Create `useTrain2GoBridgeActions` hook — detect extension, ping, read-week, read-day, open-train2go, connection polling (2s x 5 attempts), 30s detection cache
- [ ] 6.3 Wire Train2Go extension detection in existing bridge registry (`adapters/bridge/bridge-registry.ts`) — call `detectBridge(VITE_TRAIN2GO_EXTENSION_ID)` alongside Garmin detection on boot
- [ ] 6.4 Create tests for Train2Go state (initial state, ping update, session expiry, detection cache hit/miss, userId stored from ping)

## 7. SPA Calendar Integration

- [ ] 7.0 Create `train2go-sport-map.ts` — mapping from Train2Go sport identifiers (28 known) to SPA icon keys, with fallback to generic activity icon. Include test.
- [ ] 7.1 Create `Train2GoActivityCard` component — sport icon, title, duration, workload dots, status badge, "T2G" label, read-only (not draggable/editable)
- [ ] 7.2 Integrate Train2Go activities into `CalendarWeekGrid` — render `Train2GoActivityCard` alongside Kaiord workout cards per day column
- [ ] 7.3 Add expand-on-click for Train2Go cards — lazy-load description via `read-day` on first expand, display cleaned description text
- [ ] 7.4 Add "Sync Train2Go" button in calendar header — visible when extension is detected, triggers `read-week` for current displayed week
- [ ] 7.5 Add "Connect to Train2Go" prompt — shown when extension is installed but session is expired, triggers `open-train2go` + polling
- [ ] 7.6 Create tests for `Train2GoActivityCard` (render sport icon, display title/duration, workload dots, read-only behavior)
- [ ] 7.7 Create tests for CalendarWeekGrid integration (both Kaiord + Train2Go sources rendered, empty Train2Go state, Train2Go-only week)

## 8. Testing & Quality

- [ ] 8.1 Verify all extension tests pass: `cd packages/train2go-bridge && pnpm test`
- [ ] 8.2 Verify SPA builds cleanly: `cd packages/workout-spa-editor && pnpm build`
- [ ] 8.3 Run full lint: `pnpm lint`
- [ ] 8.4 Create `TESTING.md` in `packages/train2go-bridge/` with manual testing guide (load unpacked, open Train2Go tab, test popup, test SPA integration)

## 9. Finalization

- [ ] 9.1 Add changeset for `@kaiord/workout-spa-editor` (minor — new Train2Go calendar integration)
- [ ] 9.2 Update root `CLAUDE.md` packages list to include `@kaiord/train2go-bridge`
