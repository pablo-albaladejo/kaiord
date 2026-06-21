<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/`

## Purpose

Use cases. Pure functions and small orchestrators that take a `PersistencePort` (and other ports) and a set of typed inputs and return typed results. Application code MUST NOT import React, Dexie, or any other adapter. Tests use the in-memory ports from `src/test-utils/`.

## Key Files (loose, top-level use cases)

- `auto-match-candidate.ts`, `auto-match-sessions.ts` / `.test.ts`, `auto-match-dismissal.ts` / `.test.ts`, `auto-match-dismissal-helpers.ts` — auto-match suggestion engine: scores candidates, applies/dismisses suggestions per `(profileId, weekStart)`.
- `match-session.ts` / `.test.ts`, `unmatch-session.ts` / `.test.ts`, `match-suggestion.ts` — explicit user link/unlink between coaching activity ↔ executed workout.
- `convert-and-auto-match.ts` / `.test.ts` — convert a coaching activity to a workout AND link it in one transaction.
- `on-workout-mutation.ts` / `.test.ts` — invariants triggered when a workout changes (e.g. recompute compliance).
- `compute-compliance-score.ts` / `.test.ts`, `compliance-bucket.ts` / `.test.ts` — coaching compliance scoring.
- `ai-workout-processor.ts` / `.test.ts`, `ai-prompts.ts` / `.test.ts` — orchestrates a single AI workout generation: builds the prompt (with zones), calls the AI port, validates the response.
- `batch-processor.ts` / `.test.ts` + `batch-processor.test-fixtures.ts`, `batch-progress.ts`, `cost-estimation.ts` / `.test.ts`, `provider-rates.ts` / `.test.ts` — multi-coaching-activity batch AI conversion with cost estimation.
- `parse-coaching-duration.ts` / `.test.ts` — parses Train2Go coaching duration strings into seconds.
- `canonical-sport-family.ts` / `.test.ts` — normalises sport identifiers across formats.
- `sanity-checks.ts` / `.test.ts` — boot-time invariant checks.
- `set-calendar-density.ts` / `.test.ts` — calendar density user-preference mutation.
- `stale-detection.ts` + `.integration.test.ts`, `stale-resolution.ts` — coaching-activity stale-record detection and resolution.
- `workout-transitions.ts` / `.test.ts` — `WorkoutState` (planned/executed/discarded) transition rules.
- `get-user-preferences.ts` / `.test.ts` — read-with-defaults wrapper over the user-prefs repo.
- `test-helpers.ts` — application-test helpers (NOT a runtime export).

## Subdirectories

- `ai/` — AI provider config use cases (add/remove/update/clear/set-default + custom prompt).
- `chat/` — in-app AI chat assistant: the tool registry (`tools/` — read tools over `PersistencePort` + confirmation-gated action tools), versioned system prompt, record↔`ModelMessage` mapper, conversation use cases (`ensure-conversation`, `rename-conversation`, `delete-conversation`, `set-conversation-model`, `derive-conversation-title`), the `append-turn-messages` transcript writer, and `record-chat-usage`. The provider-agnostic turn engine lives in `@kaiord/ai` (`createChatAgent`).
- `coaching/` — coaching domain use cases (link/unlink, convert, zones sync, expand-day, heal-id-shape).
- `library/` — workout template use cases (add/update/delete/schedule).
- `profile/` — profile + sport-zone use cases (CRUD + cascade-delete).
- `shared/` — cross-domain helpers (date utilities).

## For AI Agents

### Working In This Directory

1. **Pure-function bias.** A use case is a `(deps, input) => Promise<output>` factory. Inject the `PersistencePort` (and AI port if needed); don't import the adapter.
2. **No React, no Dexie, no DOM.** Tests run in jsdom but the code itself must be runnable in a non-DOM environment.
3. **Errors are domain types.** Throw a typed `*Error` from `types/errors.ts` or a domain-local error class; don't throw bare strings.
4. **Atomicity.** Multi-write use cases call `persistence.transaction(fn)` — they MUST NOT open Dexie transactions directly.
5. **Coaching-activity ids are composites.** When writing a `sessionMatches.coachingActivityId`, build it via `buildCoachingActivityId(...)` / `toPersistedCoachingActivityId(...)` / read from `CoachingActivityRecord.id` — never concat.

### Testing Requirements

- One `.test.ts` per use case. AAA markers + `should ` titles.
- Wire `createInMemoryPersistence()` from `src/test-utils/` for repository-backed tests.
- Use `application-fixtures.ts` from test-utils for canonical inputs.

### Common Patterns

- Co-locate helpers (`*-helpers.ts`) when a use case exceeds the file-size cap.
- Bigger use cases split into `<name>.ts` + `<name>-types.ts` + `<name>-helpers.ts` (see `convert-coaching-activity-with-ai.*`).

## Dependencies

### Internal

- `../ports/*` (port contracts).
- `../types/*` (domain types + errors).
- `../lib/*` (pure helpers: zone math, hashing, scrubbing, runtime config).
- `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` (format conversion via core's reader/writer ports).
- `@kaiord/ai` (AI generation port).

### External

- `zod` (input/output validation at the boundary).
- No `react`, no `dexie`, no `@radix-ui/*`.

<!-- MANUAL: -->

`application/` is the load-bearing layer for business rules. Anything that's not "render a pixel" or "talk to IndexedDB / the bridge / the AI provider" belongs here.
