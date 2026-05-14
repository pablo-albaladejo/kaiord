<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/train2go/`

## Purpose

Train2Go-specific adapter code: scrape the Train2Go coaching plan via the extension bridge, convert scraped records into `CoachingActivityRecord`s, fan out per-sport zone definitions, and orchestrate the zones-sync push.

## Key Files

- `train2go-record.converter.ts` / `.converter.test.ts` — raw Train2Go record → intermediate shape.
- `coaching-record-to-activity.converter.ts` / `.converter.test.ts` — intermediate → `CoachingActivityRecord` (uses `buildCoachingActivityId` for the composite id).
- `train2go-coaching-transport.ts` / `.test.ts` — request/response over the bridge transport for coaching scrape calls.
- `train2go-fetch-zones.ts` — pulls per-sport zone definitions from Train2Go.
- `train2go-sport-map.ts` / `.test.ts` — maps Train2Go sport strings → canonical SPA sport identifiers.
- `should-fan-out-zones.ts` — predicate deciding when a profile snapshot should trigger a zones push.
- `coaching-telemetry.ts` / `.test.ts` — emits analytics events for scrape success/failure.
- `use-train2go-source.ts` / `.test.tsx` — React hook surfacing the discovered Train2Go bridge.
- `use-train2go-actions.ts` — actions exposed to UI (sync, link/unlink).
- `use-train2go-actions-fanout.test.tsx` — fan-out behavior for multi-bridge zones-sync.
- `use-train2go-data.ts` — `useLiveQuery` wrapper over coaching data.
- `use-expand-callback.ts` — day-expand callback wiring.
- `use-zones-sync-orchestrator.ts` / `.test.ts` — coordinates the zones-sync write flow with the application layer.

## For AI Agents

### Working In This Directory

1. **All `CoachingActivityRecord.id` values created here go through `buildCoachingActivityId(profileId, source, sourceId)`** — never string-concat. (R-SessionMatchIdShape enforces this on the session-match side; the convention is shared.)
2. **Telemetry events must use static event names** (constants), not interpolated strings — R-PIIInterpolation applies to `console.*` inside hooks.
3. **The coaching transport is a thin client over `bridge-transport.ts`** — don't reimplement timeout/retry here, reuse the queue.

### Testing Requirements

- Converters have property-style coverage (round-trips, sport-map exhaustiveness).
- Hooks are tested with `@testing-library/react` + a stubbed bridge transport.
- Fan-out behavior is tested across simulated multi-bridge environments.

### Common Patterns

- Hook naming: `use-train2go-*.ts(x)` (kebab-case file, camelCase export).
- Converters are pure functions, no side effects; the transport layer owns I/O.

## Dependencies

### Internal

- `../bridge/*` (transport + queue).
- `../../application/coaching/*` (use cases for zones-sync).
- `../../types/{coaching-activity-record,coaching-zones,session-match,coaching-source}`.

### External

- `dexie-react-hooks` (in hook files, for `useLiveQuery`).

<!-- MANUAL: -->

The Train2Go scrape is best-effort: any record-shape change upstream surfaces here first. Keep converters tightly typed and tested per sport.
