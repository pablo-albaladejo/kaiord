<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/bridge/`

## Purpose

Discovers, verifies, and talks to the in-page Chrome extension bridges (`@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`). The discovery layer is an in-memory singleton — bridges are never persisted to Dexie (see `README.md`).

## Key Files

- `bridge-discovery.ts` / `bridge-discovery-types.ts` — singleton that listens for `kaiord-announce` events from installed extensions and emits a verified registry via `useSyncExternalStore`.
- `bridge-discovery-verify.ts` — `ping` round-trip that confirms an announced bridge is live before exposing it to the UI.
- `bridge-transport.ts` — request/response transport over `chrome.runtime.sendMessage` (with timeout + error wrapping).
- `operation-queue.ts` / `operation-queue-helpers.ts` / `shared-operation-queue.ts` — token-bucket rate limiter shared across bridges (60/h-per-bridge ceiling mandated by the SPA Bridge Protocol).
- `bridge-store-persistence-boundary.test.ts` — non-regression guard pinning the rule "bridge registry is never persisted."
- `README.md` — protocol overview and persistence-boundary rationale.

## For AI Agents

### Working In This Directory

1. **No Dexie writes from here.** The registry is in-memory by design. Any new bridge state belongs to the singleton, not a Dexie table.
2. **Operation queue is shared across bridges,** so the per-extension rate budget cannot be circumvented by adding a new bridge type.
3. **Transport contracts are typed in `bridge-schemas.ts` under `types/`** — extend there, not here.

### Testing Requirements

- Tests stub `chrome.runtime` via `e2e/helpers/train2go-bridge-stub.ts` and equivalent unit-level fakes.
- Verify timeout, retry, and idempotency keys for every new transport call.

### Common Patterns

- `useDiscoveredBridges()` hook (in `hooks/`) is the single React-side consumer.
- Profile snapshot push (`hooks/use-profile-snapshot-push.ts`) uses content-fingerprint dedup and a shared queue.

## Dependencies

### Internal

- `../../types/bridge-schemas`, `../../lib/raw-hash` (fingerprinting).
- `@kaiord/core` (`fingerprintSnapshot`).

### External

- `chrome.runtime` (typed in `../../types/chrome.d.ts`).

<!-- MANUAL: -->

The bridge layer is the trust boundary: anything coming back from a browser extension is untrusted input and MUST be Zod-validated via the schemas in `../../types/bridge-schemas.ts` before flowing into the SPA.
