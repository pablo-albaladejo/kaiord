## Why

The `train2go-profile-link` change shipped (PR #372, archived 2026-04-28). The post-merge `/opsx:verify` report flagged 7 genuine test gaps; PR #374 fast-followed and closed 1. Six gaps remain — all are scenarios already documented in the synced specs (`spa-coaching-integration`, `spa-train2go-extension`) but not yet asserted by tests. They cover behaviors that work today but are silently regressible: lossless `userId` capture, manual sync gate bypass, idempotent conversion preserving the source row, navigation after convert, profile-switch reactivity on the calendar header, and connect-vs-disconnect race handling.

Closing these gaps now (while the implementation is fresh) is cheaper than re-deriving the invariants months later from a regression.

## What Changes

- **Tests-only change.** No production code, no spec edits, no behavior changes. Each new test asserts behavior that already exists in `main` after PR #372.
- Add 6 surgical test additions across 5 files (one new test file for `use-coaching-convert`):
  1. `CalendarHeader.test.tsx` — Manual Sync button calls `source.sync()` even when `lastSyncedAt < 10 minutes` (bypasses staleness gate, distinct from auto-sync).
  2. `convert-coaching-activity.test.ts` — `coachingActivities` row still exists after `convertCoachingActivity` (the conversion creates a `WorkoutRecord`; the source coaching row MUST be preserved for re-conversion + history).
  3. `use-coaching-convert.test.tsx` (new) — `handleConvert` calls `navigate("/workout/:id")` and `onClose` after a successful conversion; on failure, sets `error` and stays on the page.
  4. `CalendarHeader.test.tsx` — Switching the active profile reactively updates the rendered Sync buttons (linked sources for new profile shown, unlinked sources hidden).
  5. `train2go-coaching-transport.test.ts` — A wire response carrying a numeric `userId` larger than `Number.MAX_SAFE_INTEGER` is preserved byte-identically as the resulting `externalUserId` string (asserts the JSON parse boundary stringifier, not `String(parsedNumber)`).
  6. `attempt-link.test.ts` (or extend `use-cases.test.ts`) — Calling `unlinkAccount(profileId, source)` while `attemptLink` is mid-poll causes the poll's `AbortSignal` to fire and the link is NOT written; final profile state matches the disconnect.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — no spec-level requirements change. All 6 scenarios are already documented in the synced main specs after `train2go-profile-link`.

## Impact

- **Affected packages:** `@kaiord/workout-spa-editor` only. No other packages touched.
- **Affected layers:** test files in `application/coaching/`, `adapters/train2go/`, `components/molecules/CoachingCard/`, `components/organisms/CalendarHeader/`. No port, domain, or adapter implementation changes.
- **APIs:** No public-API changes.
- **Dependencies:** No dependency changes.
- **Coverage:** Pushes diff coverage on `coaching` namespace toward 90% on the affected files; no global coverage threshold change.
- **Risk:** Very low — tests-only PR; if any of the 6 invariants do NOT hold today, the failing test will surface a real bug that warrants a separate code fix. Each test is independent and can be split into its own commit if a fix is needed.
