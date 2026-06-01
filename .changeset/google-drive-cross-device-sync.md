---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): cross-device sync via the user's own Google Drive

Adds optional cross-device synchronization of the editor's local data
(workouts, templates, profiles, coaching, health, AI providers) through the
user's own Google Drive `appDataFolder` — no backend, free, and the data stays
owned by the user. Connect a Google account from Settings → Google Drive sync.

- A whole-database snapshot is stored as a single `kaiord-snapshot.json` in the
  hidden, app-scoped `appDataFolder`; Drive's native file revisions are a free
  backup. Local snapshot export/import also enables on-device backup/restore.
- `CloudSyncPort` + a `fetch`-based Google Drive adapter (Google Identity
  Services OAuth, `drive.appdata` scope, no Google SDK dependency); auth + I/O
  only, no merge logic.
- Conflict resolution is last-write-wins per record (`updatedAt`/`createdAt`),
  timestampless tables by snapshot time, with tombstones so deletions propagate
  and a Dexie v19 `tombstones` table; optimistic concurrency on `headRevisionId`.
- Hybrid triggers: pull-merge on app open, debounced auto-push on any change
  (create, delete, or in-place edit), and a manual "Sync now".
- Optional end-to-end encryption (off by default): a passphrase encrypts the
  snapshot with AES-256-GCM before upload, with a one-time warning that AI API
  keys are uploaded in cleartext when encryption is off.
