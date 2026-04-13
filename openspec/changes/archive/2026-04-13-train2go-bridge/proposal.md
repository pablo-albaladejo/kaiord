## Why

Pablo's coach programs training plans on Train2Go (app.train2go.com), but there is no way to view those planned workouts alongside user-created workouts in the Kaiord SPA calendar. This forces constant context-switching between apps. A Train2Go bridge extension — following the same architecture as the Garmin bridge — would read the coach's planned workouts and surface them in the unified calendar, enabling the future pipeline: Train2Go → KRD → Garmin Connect.

## What Changes

- **New Chrome extension** (`packages/train2go-bridge/`): MV3 extension that reads training plans from Train2Go's internal API (`/api/v2/workplan/*`) via authenticated fetch on `app.train2go.com`. Supports `ping`, `read-week`, and `read-day` actions. Simpler than Garmin bridge — no CSRF capture, no webRequest, only `tabs` permission needed.
- **HTML parser** (`parser.js`): Extracts structured activity data (id, date, sport, title, duration, workload, status, description) from JSON-wrapped HTML fragments returned by Train2Go API.
- **New bridge capability**: Add `"read:training-plan"` to `BridgeCapability` enum in the SPA so the calendar can distinguish coach-planned workouts from user workouts.
- **SPA calendar integration**: Display Train2Go activities as read-only cards in the existing `CalendarWeekGrid`, visually distinguished from editable Kaiord workouts.
- **New env var**: `VITE_TRAIN2GO_EXTENSION_ID` for SPA extension detection.

## Capabilities

### New Capabilities

- `train2go-bridge`: Chrome extension manifest, content script API proxy, HTML parsing, background service worker actions, popup UI, and allowlist security
- `spa-train2go-extension`: SPA-side detection, state management, data fetching, and calendar rendering for Train2Go planned workouts

### Modified Capabilities

- (none — existing bridge infrastructure is already generic enough)

## Impact

- **New package**: `@kaiord/train2go-bridge` (private, not published to npm)
- **Affected packages**: `@kaiord/workout-spa-editor` (new env var, calendar UI, bridge capability type)
- **Hexagonal layers**: Infrastructure only (new adapter). No domain or application changes.
- **Dependencies**: None new — pure vanilla JS extension + existing SPA bridge infrastructure
- **APIs**: Read-only access to Train2Go internal API v2 (workplan endpoints). No writes.
- **No breaking changes** to any existing functionality.
