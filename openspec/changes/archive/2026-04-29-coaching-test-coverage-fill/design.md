## Context

This is a tests-only follow-up to `train2go-profile-link` (archived 2026-04-28). The 6 invariants closed here are documented in `openspec/specs/spa-coaching-integration/spec.md` and `spa-train2go-extension/spec.md` but are not asserted today. No production code changes; no new dependencies; no migrations.

## Goals / Non-Goals

**Goals:**

- Lock in 6 silently-regressible invariants as test assertions on `main`.
- Keep each test isolated to a single behavioral claim — when a test fails, the cause is unambiguous.
- Use the existing in-memory persistence + mocked transports already established by `train2go-profile-link`. No new test infrastructure.

**Non-Goals:**

- Production code changes. If any test fails on first run, the failing scenario is a real bug — fix it in a separate PR, not as a side-effect here.
- Spec changes. The scenarios already exist in synced main specs.
- Restructuring existing tests. Add tests; do not refactor tests.
- Pre-existing scenarios from prior specs (e.g., "Click RAW workout", "Click empty day") and Dexie migration scenarios (v3→v4 backfill) — those are out of scope; verify report classified them as pre-existing or implicitly covered.

## Decisions

### D1. One scenario → one test, in the file closest to the production code

Each of the 6 gaps maps to exactly one new `it(...)` block in the test file that lives next to the production code under test:

| Gap                                     | File                                                                    | Surface under test                                                   |
| --------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Manual sync bypasses gate               | `components/organisms/CalendarHeader.test.tsx`                          | `CalendarHeader` Sync button → `source.sync()` (no staleness lookup) |
| Coaching row preserved on convert       | `application/coaching/convert-coaching-activity.test.ts`                | `convertCoachingActivity` does not delete `coachingActivities` row   |
| Convert navigates + closes dialog       | `components/molecules/CoachingCard/use-coaching-convert.test.tsx` (NEW) | `useCoachingConvert.handleConvert`                                   |
| Sync buttons reactive to profile switch | `components/organisms/CalendarHeader.test.tsx`                          | Same as #1 — re-render on `useActiveProfile` change                  |
| Lossless userId                         | `adapters/train2go/train2go-coaching-transport.test.ts`                 | JSON parse boundary stringification                                  |
| Concurrent disconnect aborts link       | `application/coaching/use-cases.test.ts` (existing `attemptLink` block) | `AbortSignal` propagation through poll loop                          |

**Why colocate?** The verify report flagged these because the closest test file did not assert them. Adding the assertion next to the existing tests minimises context overhead for a future reviewer.

### D2. The `concurrent disconnect` test drives the `AbortController` directly, not via the UI

The race is at the use-case level (`attemptLink` with an injected `signal`). Driving it from the React component would require timing tricks; driving it from the use-case test is deterministic.

```
const controller = new AbortController();
const linkPromise = attemptLink(deps, "p1", controller.signal);
controller.abort();  // simulates Disconnect arriving mid-poll
const result = await linkPromise;
expect(result).toEqual({ ok: false, reason: "aborted" });
expect(profile.linkedAccounts).toEqual([]);
```

### D3. The `lossless userId` test asserts the wire→port boundary, not transport internals

Use a numeric `userId: 9007199254740993` (one above `MAX_SAFE_INTEGER`) in the mocked `chrome.runtime.sendMessage` response. Assert that `t.ping().externalUserId === "9007199254740993"` (string-equal, byte-identical). This locks in the JSON-reviver-based stringification pattern in `train2go-ping-result.ts` without coupling the test to its internals.

### D4. The `Sync buttons reactive` test uses two renders, not `rerender`

Test the `CalendarHeader` with two mounts (profile A linked → profile B unlinked) rather than mutating `useActiveProfile` mid-render. This avoids relying on the order in which `useLiveQuery` and `useActiveProfile` flush, which is implementation-detail.

## Risks / Trade-offs

- [Risk: A test surfaces a real bug] → Pause this PR, open a separate fix PR, then come back. Don't bundle code fixes into this tests-only PR.
- [Risk: Test for `coachingActivities preserved on convert` over-asserts] → Assert only that `getByProfileAndSourceId(p, src, sid)` still returns the row after convert. Don't compare every field — that would couple the test to the row shape.
- [Risk: `CalendarHeader` profile-switch test flakes on re-render order] → D4 mitigation (two distinct mounts).
