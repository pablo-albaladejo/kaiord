## Context

The workout-spa-editor (`@kaiord/workout-spa-editor`, private) persists all user data to a single browser's IndexedDB via Dexie (`kaiord-spa`, schema v18, ~24 tables: workouts, templates, profiles, coaching activities, session matches, health metrics, AI providers, usage, meta, sync/integration state). There is no cross-device continuity: a user's laptop and phone hold independent datasets.

Constraints that shape this design:

- **No backend.** The SPA is statically hosted; we will not introduce a server, database, or hosted sync service.
- **User-owned, free, secure.** Data must live on storage the user already owns and pays nothing extra for.
- **Hexagonal architecture.** `application/` and the Zustand store MUST NOT import `dexie-database` (guards R-AppDexieImport / R-DexieImport / R-PersistStateImport). All I/O goes through ports.
- **Existing AI-key handling.** `aiProviders` rows already store API keys encrypted via `createSecureStorage` (`src/lib/secure-storage.ts`), but the wrapping key is derived from a **hardcoded passphrase** (`"kaiord-spa-v1"`) embedded in the JS bundle (`crypto.ts` PBKDF2 → AES-GCM). This is obfuscation, not real protection, and it is **portable**: the same ciphertext decrypts on any device running the same code.

Google Drive's `appDataFolder` is a hidden, per-app, per-user folder on the user's own Drive quota (15 GB free), accessible with client-side OAuth and invisible in the user's Drive UI. It fits all three constraints.

## Goals / Non-Goals

**Goals:**

- Replicate the full SPA dataset across the same user's devices through their own Google Drive, with no developer-operated infrastructure.
- Keep the merge/conflict logic pure and testable, with Drive isolated behind a port.
- Deliver value incrementally: snapshot export/import (local backup) works before any OAuth code exists.
- Preserve hexagonal boundaries and all existing mechanical guards.
- Make deletions propagate correctly (no resurrection of records deleted on another device).
- Offer optional real end-to-end encryption for users who want it.

**Non-Goals:**

- Real-time / collaborative multi-user editing or operational-transform/CRDT merge. This targets one user across their own devices, where simultaneous edits are rare.
- Sync of data owned by the Chrome bridge extensions' own auth/SSO (those keep their own session; only the resulting Dexie records sync).
- Providers other than Google Drive in this change (the port keeps the door open for Dropbox/Gist later).
- Replacing the existing hardcoded-passphrase obfuscation for AI keys; that is a separate concern (a future user-PIN enhancement).
- Selective/partial sync configuration UI. The snapshot is whole-database in this change.

## Decisions

### D1 — Storage: single canonical snapshot file in Drive `appDataFolder`

One file, `kaiord-snapshot.json`, holding the full database dump plus a manifest. Rationale: a single blob makes atomic read/write and optimistic concurrency trivial (one `headRevisionId` to compare), and Drive's native file revision history gives free, automatic backups with no extra code. Alternative considered — one file per table or per record: finer-grained merges but N× the API calls, N× the rate-limit exposure, and no atomic cross-table consistency. Rejected for a single-user workload.

**Snapshot shape:**

```
{
  "manifest": { "schemaVersion": 18, "deviceId": "<uuid>", "exportedAt": "<ISO>", "encrypted": false },
  "tables": { "workouts": [...], "templates": [...], "profiles": [...], /* every table */ },
  "tombstones": [ { "table": "workouts", "id": "...", "deletedAt": "<ISO>" }, ... ]
}
```

When encryption is on, `tables` + `tombstones` are replaced by a single `ciphertext` field (and the manifest carries salt/iv); the manifest stays in cleartext so a device can detect encryption before prompting for the passphrase.

### D2 — Port before adapter: `CloudSyncPort` (ports layer)

```
type CloudSyncPort = {
  isAuthenticated(): boolean;
  authenticate(): Promise<void>;          // triggers GIS consent / silent token
  pull(): Promise<RemoteSnapshot | null>; // null when no file exists yet
  push(snapshot: Snapshot, expectedRevision: string | null): Promise<string>; // returns new headRevisionId
};
```

`pull` returns the parsed snapshot plus the current `headRevisionId`; `push` takes the revision the caller last saw and the adapter rejects (or the use case re-pulls) if Drive moved on. The adapter does **auth + file I/O only** — zero merge logic. Rationale: keeps the merge engine pure and unit-testable with an in-memory fake port, mirroring the existing `InMemoryPersistenceAdapter` pattern.

### D3 — Adapter: `googleDriveCloudSyncAdapter` (adapters layer)

Uses Google Identity Services (`https://accounts.google.com/gsi/client`) `initTokenClient` with scope `https://www.googleapis.com/auth/drive.appdata` for a client-side access token (~1 h lifetime; silent refresh via `requestAccessToken({ prompt: '' })`). File I/O via `fetch` against the Drive REST API (multipart upload to create, `uploadType=media` PATCH to update, `alt=media` GET to download, `fields=headRevisionId` for concurrency). Rationale: no Google SDK dependency needed; `fetch` keeps the bundle lean. Alternative — `gapi` client library: heavier, more global state, unnecessary for four endpoints. Rejected.

### D4 — Conflict resolution: last-write-wins per record + tombstones + optimistic concurrency (application layer)

`syncWithCloud` is a pure use case:

1. `pull()` the remote snapshot (capture its `headRevisionId`).
2. Build the local snapshot via `exportSnapshot()`.
3. Merge per table, per record by primary key: keep the side whose `updatedAt` (fallback `createdAt`) is newer. Tables without those fields (`meta`, `usage`) merge whole-record against the manifest `exportedAt`.
4. Apply tombstones: a record present on one side but tombstoned on the other with a newer `deletedAt` is removed (and the tombstone retained); a record re-created with `updatedAt` newer than the tombstone wins (resurrection is intentional only when the edit is newer).
5. `importSnapshot()` the merged result locally.
6. `push(merged, expectedRevision)`. If Drive's `headRevisionId` changed since step 1, discard and retry from step 1 (bounded retries).

Rationale: timestamps already exist on nearly every table; LWW is adequate for one user. CRDTs were considered and rejected as disproportionate to the concurrency profile and bundle cost.

### D5 — Deletions: `tombstones` table + delete-decorator over `PersistencePort` (adapters layer)

A new Dexie table `tombstones` (PK `[table+id]`, fields `table`, `id`, `deletedAt`, optional `profileId`) at **schema v19**. Every `delete` flows through a `PersistencePort` decorator that, after the underlying delete succeeds, writes a tombstone in the same transaction. Rationale: a single chokepoint means zero changes at call sites and guarantees no delete escapes tombstoning. This is the spec-level change to `spa-persistence-port` (deletes now leave a tombstone). Alternative — soft-delete flags on every table: invasive across 24 tables and every query. Rejected.

A merged-away (resurrected) record is the only failure mode of snapshot LWW without tombstones; the tombstone table closes it.

### D6 — Snapshot scope: whole database, including AI keys

The snapshot includes `aiProviders` rows verbatim (their existing ciphertext). Because the obfuscation passphrase is hardcoded and portable, the keys decrypt and work on the receiving device with no extra logic — good for UX. But the same fact means the Drive blob is effectively cleartext to anyone who can read it. This drives D7.

### D7 — Optional E2E encryption (off by default) + one-time AI-keys warning

A Settings toggle enables true end-to-end encryption: before upload, the snapshot's `tables`+`tombstones` are encrypted with a **user-supplied passphrase** (PBKDF2 → AES-256-GCM via Web Crypto — reuse `crypto.ts` primitives, but with a real user secret, not the hardcoded one). The manifest stays cleartext so other devices know to prompt. Rationale: gives privacy-conscious users genuine protection without forcing passphrase management on everyone. When AI keys are in scope **and** encryption is off, the connect flow shows a one-time warning that API keys will be uploaded in a form that is effectively plaintext. Forgotten passphrase = unrecoverable cloud data (documented, accepted).

### D8 — Sync triggers: hybrid (components layer)

Auto `syncWithCloud` on app open (after persistence boot), auto push debounced (~5 s) after edits settle, and a manual "Sync now" button in Settings. Pull-on-open keeps a freshly opened device current; debounced push avoids a Drive call per keystroke. The manual button is the escape hatch and the primary affordance while the feature is new.

## Risks / Trade-offs

- **AI keys effectively cleartext in Drive when E2E off** → Mitigation: one-time explicit warning (D7); the real fix is the optional E2E toggle. Documented that the existing at-rest obfuscation is not security.
- **Concurrent edits on two devices within the debounce/sync window can lose the older edit** (LWW) → Mitigation: per-record granularity limits blast radius to the single record edited on both sides; optimistic-concurrency retry prevents whole-snapshot clobber. Accepted for single-user scope.
- **`drive.appdata` is a "sensitive" scope** → Google production verification required before ~100 users (free but a review process). Mitigation: ship behind test-user mode; document verification as a launch-gating ops task, not a code task. No code depends on verification status.
- **Access token expiry / revoked consent mid-session** → Mitigation: adapter surfaces auth errors; UI offers reconnect; failed push leaves local data intact (source of truth stays local until a successful merge).
- **Schema drift between devices** (one device on v18 snapshot, other on v19) → Mitigation: `manifest.schemaVersion` gates import; a newer device can up-migrate an older snapshot via the existing Dexie upgrade path; an older device refuses a newer snapshot with a clear "update the app" message rather than corrupting data.
- **Drive quota exhausted / offline** → Mitigation: push failures are non-fatal and retried on next trigger; the local DB remains fully functional offline (the feature is additive).
- **Tombstones grow unbounded** → Mitigation: prune tombstones older than a retention window (e.g. 90 days) on import, long after every active device would have observed them.

## Migration Plan

No public-API breaking change. Schema bumps Dexie v18 → v19 to add `tombstones`; the v19 upgrade is additive (new empty table) and runs automatically on first load of the new code. Rollback: reverting the code leaves the `tombstones` table dormant and the Drive file untouched; no data migration to undo. The feature is opt-in (user must connect a Google account), so un-connected users are unaffected.

## Open Questions

- Tombstone retention window — 90 days proposed; confirm during implementation against real device-reconnect intervals.
- Debounce interval for auto-push (5 s proposed) — tune against Drive rate limits in Phase 4.
- Whether to expose a "download snapshot to file" / "restore from file" affordance from the Phase 1 use cases in this change or defer to a follow-up (low cost; likely include).
