## ADDED Requirements

### Requirement: Test coverage for previously-undertested invariants

The test suite SHALL include assertions for the following six scenarios that already exist in the synced `spa-coaching-integration` and `spa-train2go-extension` specs but were flagged as uncovered by the post-merge `train2go-profile-link` verify report.

This requirement adds NO new behavior — it only formalizes the test-coverage obligation. When the corresponding tests land, this requirement and its scenarios become redundant with the parent specs and SHALL be removed at archive time (no merge into `openspec/specs/`).

#### Scenario: Manual sync bypasses the staleness gate

- **WHEN** the user clicks the per-source Sync button on `CalendarHeader` while `lastSyncedAt < 10 minutes`
- **THEN** the test asserts `source.sync(profileId, weekStart)` is called exactly once (the staleness gate is auto-sync-only)

#### Scenario: Coaching activity row preserved after conversion

- **WHEN** `convertCoachingActivity(deps, coachingActivityId)` succeeds and creates a `WorkoutRecord`
- **THEN** the test asserts the original `coachingActivities` row at `(profileId, source, sourceId)` still exists and is unchanged

#### Scenario: Convert action navigates to editor and closes dialog

- **WHEN** `useCoachingConvert.handleConvert()` resolves with `{ created: true, workoutId }`
- **THEN** the test asserts `navigate` was called with `/workout/<workoutId>` and `onClose` was called once

#### Scenario: Sync buttons re-render when active profile changes

- **WHEN** `CalendarHeader` is rendered first with a profile linked to Train2Go, then re-mounted with a profile that has no linked accounts
- **THEN** the first render exposes the Train2Go Sync button; the second render does not

#### Scenario: Lossless userId at the JSON parse boundary

- **WHEN** the Train2Go transport receives a wire response with `userId: 9007199254740993` (one above `Number.MAX_SAFE_INTEGER`)
- **THEN** the test asserts `t.ping().externalUserId === "9007199254740993"` (string-equal, byte-identical to the wire digits)

#### Scenario: Concurrent disconnect aborts an in-flight link

- **WHEN** `attemptLink(deps, profileId, signal)` is mid-poll and the caller calls `signal.abort()` (modeling a Disconnect click on Profile Settings)
- **THEN** the test asserts the returned result is `{ ok: false, reason: "aborted" }` and `profile.linkedAccounts` is unchanged
