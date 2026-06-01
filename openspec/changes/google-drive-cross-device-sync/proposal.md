## Why

Today the workout-spa-editor persists everything to a single browser's IndexedDB (Dexie `kaiord-spa`, currently v18). A user with a laptop and a phone has two disconnected datasets — there is no way to see the same workouts, templates, profiles, or coaching data across their own devices. We want cross-device continuity **without** running any backend: the data must stay owned by the user, be free, and be secure. Google Drive's hidden `appDataFolder` lets the SPA store an app-scoped snapshot on the user's own Drive quota using purely client-side OAuth, so the app stays static-hostable with zero infrastructure to operate.

## What Changes

- Add a **cloud sync capability** that snapshots the full Dexie database to a single canonical file (`kaiord-snapshot.json`) in the user's Google Drive `appDataFolder` and restores/merges it on other devices.
- Add a new `CloudSyncPort` (I/O contract: `isAuthenticated`, `authenticate`, `pull`, `push`) and a `googleDriveCloudSyncAdapter` implementing it via Google Identity Services (client-side OAuth, scope `https://www.googleapis.com/auth/drive.appdata`) plus the Drive REST API. The adapter performs auth and file I/O only — no merge logic.
- Add pure application use cases: `exportSnapshot`, `importSnapshot`, and `syncWithCloud` (the last-write-wins + tombstones + optimistic-concurrency merge engine). All testable without Drive.
- Add a new Dexie `tombstones` table (PK `[table+id]`, `deletedAt`) and a **delete-decorator over `PersistencePort`** so every delete records a tombstone at a single chokepoint — preventing deleted records from resurrecting during merge. This modifies the persistence-port contract (deletes now leave a tombstone).
- **Conflict resolution**: last-write-wins per record using existing `updatedAt`/`createdAt` ISO fields; tables without those (`meta`, `usage`) merge whole-record LWW against a snapshot timestamp. **Optimistic concurrency**: before push, compare the Drive file `headRevisionId`; if it changed since the last pull, pull+merge first, then push.
- **Sync trigger (hybrid)**: auto pull on app open, auto push (debounced) after edits, plus a manual "Sync now" control.
- **Snapshot scope**: the entire database, including `aiProviders` (LLM API keys) and `usage` telemetry — a full-device clone.
- **Optional E2E encryption** (off by default): a toggle to encrypt the snapshot with a user passphrase (AES-GCM via Web Crypto). When AI keys are in scope and encryption is off, show a one-time warning that API keys will be uploaded in plaintext.
- Add Settings UI: connect/disconnect Google account, sync status, "Sync now" button, and the encryption toggle.
- A side benefit of `exportSnapshot`/`importSnapshot`: local file backup/restore becomes possible with no OAuth involved.

This change is **additive and non-breaking** to the public API. It touches only `@kaiord/workout-spa-editor` (private package) — no changes to `@kaiord/core` or the format adapters, and no new publishable package.

## Capabilities

### New Capabilities

- `spa-cloud-sync`: Cross-device synchronization of the SPA's persisted data through the user's own Google Drive `appDataFolder`. Covers the `CloudSyncPort` contract, the Google Drive adapter, the snapshot format, the merge/conflict-resolution rules (LWW + tombstones + optimistic concurrency), the hybrid sync triggers, optional E2E encryption, and the connect/sync UI.

### Modified Capabilities

- `spa-persistence-port`: Delete operations must now record a tombstone (`[table+id]`, `deletedAt`) via a decorator over the port, so deletions propagate across devices instead of being silently undone by a merge from a stale device.

## Impact

- **Package**: `@kaiord/workout-spa-editor` only (private; not published — no changeset/CI matrix updates required).
- **Hexagonal layers**:
  - `ports/` — new `CloudSyncPort`; `PersistencePort` gains a delete-decorator wrapper.
  - `application/` — new pure use cases `exportSnapshot`, `importSnapshot`, `syncWithCloud` (no `dexie-database` import; respects guard R-AppDexieImport).
  - `adapters/` — new `googleDriveCloudSyncAdapter`; new Dexie `tombstones` table + schema version bump (v19) in `dexie-schemas.ts` / `register-kaiord-versions-v10-plus.ts`; delete-decorator wrapping the Dexie persistence adapter.
  - `components/` — Settings sync section (account connect, status, "Sync now", encryption toggle).
- **Dependencies**: Google Identity Services script (`https://accounts.google.com/gsi/client`) loaded client-side; Drive REST via `fetch` (no SDK dependency required). No server-side dependency.
- **Configuration / external setup (not code)**: a Google Cloud OAuth Client ID (Web) with authorized JS origins for the SPA domain + `localhost`. The `drive.appdata` scope is classified "sensitive" → Google production verification is required before serving more than ~100 users (free, but a review process); test-user mode works in the interim. Documented as a known caveat, not a code task.
- **Guards**: must keep passing `check-no-zustand-writethrough.mjs` (R-DexieImport / R-PersistStateImport / R-AppDexieImport) and the PII guard (`check-no-pii-leakage.mjs`) for any new toasts/logs.
