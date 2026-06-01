## 1. Phase 1 — Snapshot export/import + tombstones (no OAuth)

> Status note: Phase 1 is implemented, committed, and fully green (539 files / 4342 tests passing; build/lint/guards clean). It was lost once when uncommitted code was discarded on a branch switch, then regenerated via the lifecycle workflow and committed immediately. A follow-up fix resolved a `TS2589`/`this`-binding issue in `dexie-snapshot-port.ts` (call `transaction` as a method on a narrowed `db` cast). Uses the `SnapshotPort` shape from design.md.

- [x] 1.1 Define `Snapshot`, `RemoteSnapshot`, and `SnapshotManifest` types in the domain/types layer (`manifest` with `schemaVersion`, `deviceId`, `exportedAt`, `encrypted`; `tables` map; `tombstones` array)
- [x] 1.2 Add the `tombstones` table to `dexie-schemas.ts` (PK `[table+id]`, fields `table`, `id`, `deletedAt`, `profileId?`) and register schema version 19 in `register-kaiord-versions-v10-plus.ts` (additive upgrade, no data transform)
- [x] 1.3 Write a failing test for the v18→v19 migration (existing rows intact, `tombstones` table present), then implement until green
- [x] 1.4 Extend `PersistencePort` with a `Tombstone` repository (read/list/prune) and write its in-memory adapter implementation for tests
- [x] 1.5 Write failing tests for a `withTombstones` delete-decorator over `PersistencePort` (delete records a tombstone; rolled-back delete records none; call sites pass no extra args), then implement the decorator wiring the tombstone write into the same transaction
- [x] 1.6 Write failing tests for `exportSnapshot` (all tables included, manifest schemaVersion correct), then implement it as a pure use case depending only on `SnapshotPort` (whole-DB dump/restore port; per-domain `PersistencePort` repos lack a uniform `getAll`/`clear`)
- [x] 1.7 Write failing tests for `importSnapshot` (clears + restores every table) and an export→import round-trip (including an encrypted `aiProviders` row decrypting afterward), then implement
- [x] 1.8 Verify no Phase-1 file under `application/` imports `dexie-database` (guard R-AppDexieImport) and run `pnpm test:scripts`

## 2. Phase 2 — CloudSyncPort + Google Drive adapter

- [x] 2.1 Define the `CloudSyncPort` interface in `ports/` (`isAuthenticated`, `authenticate`, `pull`, `push`) plus an in-memory fake implementation for use-case tests
- [x] 2.2 Add a Google Cloud OAuth Client ID config surface and document the `appDataFolder` scope; load the GIS script (`accounts.google.com/gsi/client`) lazily.
  - **Provisioned values (use these):** OAuth Client ID = `1059521446940-tplqmpmbrmp8qgsjn4r195gf75un4vt1.apps.googleusercontent.com` (public — Google client IDs are not secrets and may be committed). Scope = `https://www.googleapis.com/auth/drive.appdata` (confirmed NON-sensitive). Authorized JS origins set in Google: `http://localhost:5173` (Vite dev) and `https://kaiord.com` (production).
  - Read the Client ID from `import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID`, with the value above committed as the default in a `.env` file (it is public). Do NOT hardcode it inline in feature code; expose it via a single config module and surface a clear error if the env var is unset at runtime.
- [x] 2.3 Implement `googleDriveCloudSyncAdapter.authenticate`/`isAuthenticated` via GIS `initTokenClient` (silent refresh with `prompt: ''`); unit-test token handling with a mocked GIS global
- [x] 2.4 Implement adapter file I/O against Drive REST: locate-or-create `kaiord-snapshot.json` in `appDataFolder`, multipart create, media PATCH update, `alt=media` download, request `fields=headRevisionId`; unit-test against a mocked `fetch`
- [x] 2.5 Write a test proving `pull()` returns `null` when the file is absent and returns `{ snapshot, headRevisionId }` when present
- [x] 2.6 Confirm the adapter contains no merge logic (auth + I/O only) and the bundle adds no Google SDK dependency

## 3. Phase 3 — syncWithCloud merge engine

- [x] 3.1 Write failing tests for the pure per-record LWW merge: newer-local-wins, newer-remote-wins, present-on-one-side-kept, `createdAt` fallback when `updatedAt` absent
- [x] 3.2 Write failing tests for timestampless tables (`meta`, `usage`) merging whole-record by manifest `exportedAt`
- [x] 3.3 Write failing tests for tombstone handling: delete-on-A removes-on-B (tombstone retained), re-creation newer than tombstone is retained
- [x] 3.4 Implement the pure `mergeSnapshots` function until 3.1–3.3 are green
- [x] 3.5 Write failing tests for `syncWithCloud` orchestration using the fake `CloudSyncPort` and in-memory `PersistencePort`: pull → export → merge → import → push; stale `headRevisionId` triggers re-pull/re-merge/retry; unchanged revision pushes directly and records the returned revision
- [x] 3.6 Implement `syncWithCloud` (bounded retry on revision conflict) until green
- [x] 3.7 Add tombstone pruning on import (drop tombstones older than the retention window) with a test

## 4. Phase 4 — Hybrid sync UI

- [ ] 4.1 Add a sync-state context/hook exposing status (idle, syncing, error, lastSyncedAt) without writing Dexie from Zustand (respect R-DexieImport / R-PersistStateImport)
- [ ] 4.2 Wire pull-merge on app open after persistence boot; add a test that a connected account with a remote snapshot applies it before normal use
- [ ] 4.3 Wire debounced auto-push after edits settle (single push for a burst of edits); test the debounce collapses multiple edits into one push
- [ ] 4.4 Build the Settings sync section: connect/disconnect Google account, status display, "Sync now" button; component tests follow AAA and the PII guard for any toasts/logs
- [ ] 4.5 Ensure sync failures are surfaced non-fatally and the app stays usable offline; test the offline-degradation path

## 5. Phase 5 — Optional E2E encryption

- [ ] 5.1 Add an encryption toggle (off by default) and passphrase entry in Settings; persist the preference in `meta`
- [ ] 5.2 Reuse `crypto.ts` PBKDF2→AES-GCM primitives to encrypt `tables`+`tombstones` with the user passphrase before push, keeping the manifest cleartext with `encrypted: true`; test that ciphertext only decrypts with the correct passphrase
- [ ] 5.3 On pull, detect `manifest.encrypted` and prompt for the passphrase before import; test that import is blocked until decryption succeeds
- [ ] 5.4 Implement the one-time plaintext warning shown when AI keys are in scope and encryption is off; test it shows once on connect/first-enable

## 6. Verification & wrap-up

- [ ] 6.1 Run `pnpm -r test`, `pnpm -r build`, `pnpm lint:fix`, and `pnpm test:scripts` — zero warnings/errors
- [ ] 6.2 Run `pnpm lint:specs` and `/opsx:verify` for this change; confirm every spec scenario maps to a passing test
- [ ] 6.3 Confirm frontend coverage ≥ 70% for new code
- [ ] 6.4 Add a `docs/` note documenting the Google Cloud OAuth Client ID setup and the `drive.appdata` verification caveat (test-user mode until verified)
- [ ] 6.5 Add a changeset describing the cross-device sync feature
