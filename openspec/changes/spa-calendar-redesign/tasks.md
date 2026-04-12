## 1. Domain — Workout Data Model

- [ ] 1.1 Define Zod schemas for workout record: state enum, raw payload (with comments, distance/duration with units, prescribedRpe, rawHash), feedback (actualRpe, conditions enum, customConditions, actualDuration/Distance with units), aiMeta (promptVersion, model, provider, processedAt), lastProcessingError, previousState, createdAt, modifiedAt, updatedAt (all ISO 8601 strings)
- [ ] 1.2 Define Zod schema for bridge capability manifest: id, name, version, protocolVersion, capabilities array
- [ ] 1.3 Define Zod schema for sync state record: source, extensionId, lastSeen, capabilities, protocolVersion
- [ ] 1.4 Implement rawHash normalization utility: trim, normalize newlines, sort comments by timestamp (tiebreaker: lexicographic author+text), canonical string, UTF-8, SHA-256, hex output
- [ ] 1.5 Write unit tests for all Zod schemas and rawHash normalization (including edge cases: empty comments, same-timestamp tiebreaker, Unicode content)

## 2. Ports — PersistencePort Interface

- [ ] 2.1 Define PersistencePort type with repository types: WorkoutRepository, TemplateRepository, ProfileRepository, AiProviderRepository, SyncStateRepository, UsageRepository
- [ ] 2.2 Define repository method signatures: CRUD operations, query by date range, query by state, query by source+sourceId
- [ ] 2.3 Implement InMemoryPersistenceAdapter in `src/test-utils/in-memory-persistence.ts`
- [ ] 2.4 Write tests for InMemoryPersistenceAdapter verifying all repository contracts

## 3. Adapters — Dexie Persistence

- [ ] 3.1 Add `dexie` and `dexie-react-hooks` dependencies to `@kaiord/workout-spa-editor`
- [ ] 3.2 Define Dexie database schema v1: workouts (indexes: `[date]`, `[date+state]`, `[source+sourceId]`, `sport`, `*tags`), templates, profiles, aiProviders, syncState, usage
- [ ] 3.3 Implement DexiePersistenceAdapter fulfilling PersistencePort interface
- [ ] 3.4 Implement AiProviderRepository with encryption (wrapping existing `createSecureStorage` or equivalent)
- [ ] 3.5 Implement storage degradation probe: test IndexedDB on boot, set hydrationStatus, fallback to in-memory
- [ ] 3.6 Write integration tests for DexiePersistenceAdapter (using fake-indexeddb for test environment)

## 4. Adapters — Zustand Store Migration

- [ ] 4.1 Split `use-store-hydration.ts` into independent hooks (one per concern) to decouple migration steps
- [ ] 4.2 Migrate settings-dialog-store → useState in layout component, delete store file, update tests
- [ ] 4.3 Migrate garmin-store → React context/hook (verify consumer count; if >1 subtree, use Context provider), deprecate 30s detection cache in favor of bridge lifecycle heartbeat, update tests
- [ ] 4.4 Migrate library-store → Dexie useLiveQuery + PersistencePort, convert actions to async Dexie writes, update tests
- [ ] 4.5 Migrate ai-store → Dexie + encrypted AiProviderRepository, preserve API key encryption, update tests
- [ ] 4.6 Migrate profile-store → Dexie useLiveQuery + PersistencePort, update tests
- [ ] 4.7 Verify workout-store remains untouched: all 512 existing tests pass without modification

## 5. Adapters — Routing

- [ ] 5.1 Add `wouter` dependency to `@kaiord/workout-spa-editor`
- [ ] 5.2 Define route structure: `/`, `/calendar`, `/calendar/:weekId`, `/library`, `/workout/:id`, `/workout/new`
- [ ] 5.3 Implement route-based lazy loading with React.lazy + Suspense (RouteSpinner fallback)
- [ ] 5.4 Implement route-level ErrorBoundary per page with retry button and "Go to Calendar" escape
- [ ] 5.5 Extract current WelcomeSection + WorkoutSection into EditorPage component
- [ ] 5.6 Write routing tests: navigation, back button, deep linking, 404 handling

## 6. Application — Workout State Machine

- [ ] 6.1 Implement state transition functions: raw→structured, structured→ready, ready→pushed, pushed→modified, modified→pushed, any(except skipped)→stale, raw→skipped, skipped→raw (un-skip)
- [ ] 6.2 Implement STALE detection: compare rawHash on bridge sync, trigger stale transition if changed
- [ ] 6.3 Implement STALE conflict resolution logic: detect modifiedAt > aiMeta.processedAt for conflict dialog, no-conflict immediate re-process, "Keep my version" restores previousState
- [ ] 6.4 Write unit tests for all state transitions including invalid transitions (e.g., skipped→pushed SHALL fail)

## 7. Application — AI Batch Processing

- [ ] 7.1 Define AI prompt constants with semver versioning: system prompt with Spanish abbreviation dictionary, zone mapping template
- [ ] 7.2 Implement single workout AI processing: build prompt (description + selected comments + zones + sport), call LLM, validate output (JSON → Zod → sanity checks), retry once on failure
- [ ] 7.3 Implement batch processing orchestrator: continue-on-failure, 500ms cadence, max 1 retry/workout, max 3 retries/batch, cancel support
- [ ] 7.4 Implement cost estimation: chars/3 heuristic × provider rates, monthly usage tracking via UsageRepository (PersistencePort)
- [ ] 7.5 Write tests for AI processing pipeline (mock LLM responses: valid, invalid JSON, Zod failure, sanity check failure, batch partial failure)

## 8. Adapters — Bridge Protocol

- [ ] 8.1 Implement bridge registry: detect configured bridges on boot via env vars + chrome.runtime.sendMessage ping
- [ ] 8.2 Implement bridge lifecycle: 60s heartbeat, 3 retries → UNAVAILABLE, 24h prune → REMOVED, toast on removal
- [ ] 8.3 Implement per-bridge operation queue: concurrency 1, 500ms delay, exponential backoff on 429, 60 ops/hour hard cap per bridge (counter persisted in Dexie syncState, rolling window)
- [ ] 8.4 Update garmin-bridge ping response to include capability manifest (`id`, `name`, `version`, `capabilities: ["write:workouts"]`)
- [ ] 8.5 Write tests for bridge lifecycle (mock extension responses: success, timeout, removal) and operation queue (serialization, backoff)

## 9. Adapters — Calendar Core

- [ ] 9.1 Implement CalendarPage component: single useLiveQuery for week range, pass workouts as props to day columns, support multiple workouts per day (stacked by createdAt)
- [ ] 9.2 Implement WorkoutCard component with state indicators (priority: STALE > MODIFIED > RAW > STRUCTURED > READY > PUSHED > SKIPPED)
- [ ] 9.3 Implement week navigation controls: previous/next week, "Today" button, URL sync with weekId, invalid weekId redirect to current week
- [ ] 9.4 Implement hydration status tracking and skeleton loading states
- [ ] 9.5 Write tests for calendar core: rendering with workouts, week navigation, skeleton states, multi-workout-per-day ordering

## 10. Adapters — Calendar Empty States and Interactions

- [ ] 10.1 Implement 4 empty states: first visit (onboarding with 3 paths + value props), empty week, no bridges, no AI provider
- [ ] 10.2 Implement batch AI processing banner: "N raw workouts [Process all]", progress counter, cancel button
- [ ] 10.3 Implement RAW workout detail view: coach description, selectable comments with checkboxes, action buttons (Process/Skip/Un-skip/Manual)
- [ ] 10.4 Implement click-empty-day flow: "Add from Library" or "Create new" with date pre-filled
- [ ] 10.5 Write tests for empty states, batch processing UI, and click interactions

## 11. Adapters — Library Page

- [ ] 11.1 Refactor WorkoutLibrary from modal/dialog to routed page at `/library`
- [ ] 11.2 Implement "Schedule from library" action: copy template to calendar day with date picker
- [ ] 11.3 Implement "Save as template" action from calendar/editor: copy workout KRD to templates table
- [ ] 11.4 Write tests for library page and template ↔ calendar instance flows

## 12. Adapters — Editor Integration

- [ ] 12.1 Wire editor to calendar workflow: load workout by ID from Dexie, save state transitions on accept/push
- [ ] 12.2 Implement STALE conflict dialog: "View diff", "Re-process anyway", "Keep my version"
- [ ] 12.3 Implement MODIFIED indicator and re-push flow for pushed-then-edited workouts
- [ ] 12.4 Write tests for editor-calendar integration: load from calendar, accept, push, edit-after-push

## 13. Quality and Finalization

- [ ] 13.1 Verify zero ESLint warnings across all changed files
- [ ] 13.2 Verify zero TypeScript errors in strict mode
- [ ] 13.3 Verify 70% test coverage for `@kaiord/workout-spa-editor`
- [ ] 13.4 Verify all existing tests pass (including workout-store's 512 tests unchanged)
- [ ] 13.5 Update CLAUDE.md with state management boundary rule documentation
- [ ] 13.6 Add changeset for `@kaiord/workout-spa-editor` (minor version bump)
- [ ] 13.7 Add changeset for `@kaiord/garmin-bridge` (patch version bump for capability manifest)
