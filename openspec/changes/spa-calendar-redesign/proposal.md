## Why

The current workout SPA editor is a standalone single-page editor with no concept of time, scheduling, or external data sources. Users receive workouts from coaches on platforms like Train2Go as natural language descriptions, manually recreate them in Kaiord, then push to Garmin Connect. This friction-heavy flow limits Kaiord's usefulness as a training data hub.

A calendar-centric redesign makes Kaiord the bridge between coaching platforms and training devices — import from coach, process with AI, push to watch — all within the browser.

## What Changes

- **Calendar as home page**: Replace the welcome screen with a week-view calendar showing scheduled/completed workouts by date, with state indicators (raw, structured, ready, pushed, modified, stale, skipped)
- **Library as a separate page**: Promote the current modal-based library to a full page with routing, keeping templates (reusable, no date) distinct from calendar instances (scheduled, with date and source)
- **Editor as detail view**: The current editor becomes a routed detail view reached from calendar or library, preserving all existing functionality
- **URL-based routing**: Add wouter (~1.5KB) with routes for calendar, library, editor, and new workout creation
- **Dexie.js persistence**: Replace fragmented localStorage/encrypted-IndexedDB persistence with Dexie.js (~50KB) over IndexedDB, accessed through a PersistencePort interface (hexagonal boundary)
- **State management refactor**: Keep Zustand only for workout-store (editor runtime: undo/redo, selection, clipboard). Migrate 5 other stores to Dexie + React native state
- **Workout state machine**: Introduce lifecycle states (RAW → STRUCTURED → READY → PUSHED) with STALE, MODIFIED, and SKIPPED transitions for workouts imported from external sources
- **Bridge plugin protocol**: Formalize the Chrome extension communication pattern with typed capability manifests, lifecycle management (heartbeat, prune), and per-bridge operation queues
- **AI batch processing**: On-demand processing of natural language workout descriptions with user-selectable comment inclusion, cost estimation, continue-on-failure batch mode, and prompt versioning
- **Empty states and onboarding**: Four distinct empty states (first visit, empty week, no bridges, no AI provider) with progressive onboarding

## Capabilities

### New Capabilities

- `spa-calendar`: Calendar week view as home page — displays workout instances by date with state indicators, batch AI processing banner, empty states, skeleton loading, week navigation
- `spa-workout-state-machine`: Workout lifecycle states (RAW, STRUCTURED, READY, PUSHED, MODIFIED, STALE, SKIPPED) with transitions, conflict resolution (STALE + user edits), and rawHash-based source change detection
- `spa-persistence-port`: PersistencePort hexagonal interface with Dexie adapter (production) and in-memory adapter (tests) — repositories for workouts, templates, profiles, AI providers, and sync state
- `spa-bridge-protocol`: Formalized bridge plugin protocol — typed capability manifests (read:workouts, write:workouts, read:body, read:sleep), lifecycle management, operation queuing, protocol versioning
- `spa-ai-batch`: On-demand AI processing for imported workouts — comment selection, batch continue-on-failure, cost estimation, prompt versioning (aiMeta), structured output validation

### Modified Capabilities

- `spa-garmin-extension`: Bridge communication evolves to support the formalized bridge protocol with capability manifests and lifecycle heartbeat. Extension ID configuration stays env-var based (V1).

## Impact

**Packages affected:**
- `@kaiord/workout-spa-editor` — primary target: routing, calendar page, library page refactor, state management migration, Dexie integration, AI batch UI
- `@kaiord/garmin-bridge` — minor: add capability manifest to ping response, align with bridge protocol
- `@kaiord/core` — none (domain layer untouched)

**Hexagonal layers:**
- **Application**: New use cases for workout state transitions, calendar queries, batch AI orchestration
- **Ports**: New PersistencePort interface (WorkoutRepository, TemplateRepository, ProfileRepository, AiProviderRepository, SyncStateRepository)
- **Adapters**: DexiePersistenceAdapter, InMemoryPersistenceAdapter
- **Domain**: No changes (KRD format unchanged)

**Dependencies added:**
- `dexie` + `dexie-react-hooks` (~50KB) — IndexedDB persistence
- `wouter` (~1.5KB) — client-side routing

**Dependencies removed:**
- None (Zustand kept for workout-store)

**Breaking changes:** None. This is a UX redesign of a private package.
