## Context

The Kaiord SPA already has a generic bridge infrastructure (`adapters/bridge/`) that detects Chrome extensions by ID, validates their manifest via Zod schema, and routes messages through `chrome.runtime.sendMessage`. The Garmin bridge (`packages/garmin-bridge/`) uses this infrastructure to push workouts to Garmin Connect.

Train2Go is a Laravel-based coaching platform at `app.train2go.com`. It exposes an internal API (`/api/v2/`) that returns JSON envelopes containing HTML fragments. Authentication is cookie-based — the `remember_web_*` session cookie is sufficient for all GET requests, with no XSRF token or special headers required.

The Train2Go bridge follows the same Chrome extension architecture as the Garmin bridge but is simpler: read-only access, no CSRF capture, and only the `tabs` permission.

## Goals / Non-Goals

**Goals:**
- Read training plan activities from Train2Go and display them in the SPA calendar
- Follow the same extension architecture and bridge protocol as Garmin bridge
- Design data shape to support future KRD conversion (via LLM or manual editing)
- Keep the extension minimal — `tabs` permission only, no storage, no webRequest

**Non-Goals:**
- Writing data back to Train2Go (marking activities as done, etc.)
- Converting Train2Go descriptions to KRD format (Phase 2 — future work)
- Merging Garmin and Train2Go into a single extension
- Supporting browsers other than Chrome/Chromium
- Automated/scheduled syncing — sync is always user-initiated

## Decisions

### D1: Content script fetches Train2Go API, not DOM scraping

**Decision**: The content script on `app.train2go.com` makes `fetch()` calls to the internal API and parses the JSON/HTML response, rather than scraping the live DOM.

**Why**: The API returns consistent JSON-wrapped HTML fragments. DOM scraping would be fragile (depends on which page the user has open, JS-rendered content, CSS class changes). Fetch-based approach works regardless of the active tab's page state and can request any date range.

**Alternative considered**: DOM scraping of the rendered page. Rejected because it requires the user to navigate to the correct page and is more fragile.

**Layer**: Infrastructure (content script adapter).

### D2: Two-level parsing — weekly overview + daily detail

**Decision**: Use the weekly endpoint for the activity index (id, sport, title, duration, workload) and the daily endpoint on-demand for full descriptions.

- `GET /api/v2/workplan/weekly/{date}?user={userId}` — returns 3-week grid with all activity metadata
- `GET /api/v2/workplan/daily/{date}?user={userId}&source=sidebar` — returns full description for a specific day

**Why**: The weekly endpoint returns all activities for 3 weeks in a single request but lacks full descriptions. The daily endpoint has descriptions but requires one request per day. Fetching weekly first gives the calendar what it needs to render cards; descriptions are loaded on-demand when the user expands an activity.

The 3-week response includes the previous week, current week, and next week. The SPA SHALL use all 3 weeks of data from a single response, caching them in state. When the user navigates to an adjacent week that is already in state, no additional `read-week` call is needed. A new fetch is triggered only when navigating beyond the cached range.

**Layer**: Infrastructure (content script parser + background action routing).

### D3: New `read:training-plan` bridge capability

**Decision**: Add `"read:training-plan"` to the `BridgeCapability` Zod enum instead of reusing `"read:workouts"`.

**Why**: Coach-planned workouts from Train2Go are semantically different from user-created workouts on Garmin. The SPA calendar needs to distinguish them (read-only vs. editable, different visual treatment). A distinct capability enables capability-based feature gating.

**Layer**: Infrastructure (SPA bridge types — `bridge-schemas.ts`).

### D4: Parser lives in the content script

**Decision**: HTML parsing happens in the content script (`parser.js`), not in the background service worker or the SPA.

**Why**: The content script already receives the raw HTML from fetch responses. Parsing there means the background script only routes clean JSON activity objects. This matches how the Garmin bridge's content script parses Garmin API JSON — the SPA never sees raw transport formats.

**Alternative considered**: Parsing in the SPA (TypeScript). This would require sending raw HTML over the bridge protocol and adding a parser to the SPA bundle. Rejected to keep SPA clean and bridge protocol simple.

**Layer**: Infrastructure (content script).

### D5: Path allowlist for security

**Decision**: Content script enforces an allowlist of permitted API paths, matching the Garmin bridge pattern.

Allowed paths:
- `GET /api/v2/profile/ping`
- `GET /api/v2/workplan/weekly/*`
- `GET /api/v2/workplan/daily/*`
- `GET /api/v2/workplan/tooltip/activity/*`

All GET-only. No POST/PUT/DELETE.

**Why**: Principle of least privilege. The SPA should only be able to read training plan data, not modify it.

**Layer**: Infrastructure (content script security boundary).

### D6: Train2Go activity data shape designed for KRD future

**Decision**: The parsed activity object includes `description` as raw text (HTML cleaned) and `sport` as the Train2Go sport identifier. These fields are the input for future KRD conversion.

```
{
  id: number,
  date: string,         // ISO date
  sport: string,        // Train2Go sport key (cycling, swimming, running, gym, ...)
  title: string,
  duration: string,     // Raw duration text ("1:30 h", "2.40 km", "15 min")
  workload: number,     // 1-5
  status: number,       // 0=pending, 1=done, -1=not done
  description: string,  // Cleaned text with section markers
  completion: number    // 0-100
}
```

**Why**: Keeping the raw description text (with section headers like "Calentamiento:", "Parte Principal:") preserves the coach's notation for future LLM or manual parsing into KRD steps. The sport identifier enables future mapping to KRD sport types.

The `workload` field (1-5) is a coach-assigned effort scale (1=easy/recovery, 5=maximum effort). In Phase 1, the visual treatment is neutral (dots without color coding). Color-coded intensity can be added in Phase 2 alongside KRD conversion.

**Layer**: Infrastructure (data contract between content script and SPA).

### D7: SPA calendar shows coaching activities as read-only overlays via CoachingSource port

**Decision**: Coaching activities from external platforms appear in the `CalendarWeekGrid` as visually distinct read-only cards. The calendar components are fully decoupled from any platform — they consume only the generic `CoachingActivity` type and never import platform-specific stores, mappers, or types.

Each platform implements the `CoachingSource` port interface:

```typescript
type CoachingSource = {
  id: string;              // "train2go"
  label: string;           // "Train2Go"
  badge: string;           // "T2G"
  available: boolean;
  connected: boolean;
  loading: boolean;
  error: string | null;
  activities: CoachingActivity[];
  sync: (weekStart: string) => void;
  expand: (date: string) => void;
  connect: () => void;
};
```

A `CoachingRegistry` React context aggregates all registered sources. Hooks and components consume the registry — never platform stores directly.

Registration happens at boot in a single composition point (the registry provider). Adding a new platform (TrainingPeaks, Final Surge) means implementing one adapter and one `register()` call — zero changes to hooks, components, or calendar code.

Coaching data is NOT stored in Dexie — it is transient state in each platform's Zustand store. The registry reads from all stores and returns unified `CoachingActivity[]`.

**Why**: Hexagonal architecture. The port (`CoachingSource`) defines what the SPA needs. The adapter (`createTrain2GoSource`) bridges the platform-specific store to the port. Components and hooks only depend on the port. This makes the system open for extension (new platforms) without modification of existing code.

**Layer**: Application (port) + Infrastructure (adapter per platform).

### D8: No storage permission — session state is ephemeral

**Decision**: Unlike the Garmin bridge (which stores CSRF tokens in `chrome.storage.session`), the Train2Go bridge stores nothing. Session validity is checked on every `ping` by calling `/api/v2/profile/ping`.

**Why**: Train2Go auth is purely cookie-based with no CSRF tokens to capture. The browser manages cookies automatically. There's nothing to persist across service worker restarts.

**Layer**: Infrastructure (extension permissions).

## Risks / Trade-offs

- **[HTML structure changes]** → Train2Go could change their HTML class names or DOM structure, breaking the parser. Mitigation: Parser uses the most stable selectors (data attributes like `data-id`, semantic classes like `activity-title`, `activity-description`). Tests cover parsing with HTML fixtures.

- **[Session expiry during use]** → The `remember_web_*` cookie could expire mid-session. Mitigation: Every `read-week`/`read-day` response is validated. On auth failure (redirect to login), the bridge returns `{ ok: false, error: "Session expired" }` and the SPA prompts reconnection.

- **[Train2Go API is not public]** → These are internal endpoints that could change without notice. Mitigation: Phase 1 is deliberately minimal (read-only text). Versioned parser with test fixtures allows quick adaptation. The extension only uses stable endpoints that the Train2Go web app itself depends on.

- **[No future-date guarantee]** → While current testing shows no date restrictions, the coach may not have planned future weeks yet. Mitigation: The SPA gracefully handles empty weeks (no Train2Go cards shown).

- **[userId tampering]** → The SPA passes `userId` in read-week/read-day messages. A compromised SPA page could send a different userId. Mitigation: Train2Go server-side validation rejects mismatched userId/cookie combinations. The extension could optionally validate that the userId matches the one returned by ping, but this is not required for Phase 1.

- **[Duration is raw text]** → The `duration` field holds heterogeneous values ("1:30 h" for time, "2.40 km" for distance, "15 min" for minutes). This is sufficient for calendar display but will need structured parsing (seconds or `{ value, unit }`) in Phase 2 when converting to KRD.

- **[Allowlist inconsistency with Garmin bridge]** → The Train2Go bridge uses tighter regex patterns (restricted query params) than the Garmin bridge (`(\?.*)?`). Phase 2 consideration: backport the improved anchored regex pattern to Garmin bridge `content.js` for consistency.

## Open Questions

- **Sport mapping**: How should Train2Go sport identifiers map to Kaiord sport types in Phase 2? Known Train2Go sports: `cycling`, `swimming`, `running`, `gym`, `stretching`, `mountainwalk`, `trail`, `rest`, `walk`, `stationarybike`, `mountainbike`, `yoga`, `pilates`, `rowing`, `indoorrowing`, `climbing`, `sprint`, `tennis`, `ski`, `mountainski`, `cardio`, `canicross`, `canibike`, `dog`, `shoe`, `race`, `plane`, `medal`. This can be deferred to the KRD conversion phase.
