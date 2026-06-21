## Context

The Athlete page's Connections section (`components/organisms/AthleteConnections/`)
shows Garmin (real, via the `garmin-bridge` Chrome extension) plus inert
placeholders for Strava, Wahoo, and intervals.icu. Connection state is currently
**inferred** from whether any `IntegrationPolicy` row is `enabled`, and
"Disconnect" (`use-policy-toggle.ts` `disableBridge`) only flips those rows to
`enabled:false`. There is no notion of an account being linked, no credential
storage, and no real disconnect.

Hard constraint: `@kaiord/workout-spa-editor` is a **client-only React/Vite PWA**
(Dexie persistence, no backend server). The existing integrations are Chrome
extensions, not OAuth. Reusable security primitive: `lib/crypto.ts` (AES-256-GCM

- PBKDF2), already used to encrypt the cloud-sync passphrase.

## Goals / Non-Goals

**Goals:**

- An explicit per-provider **connection state** (`connected` / `disconnected` /
  `not-supported`) that is distinct from per-flow integration policies.
- **Real disconnect**: clear the provider's stored connection (bridge session or
  credential) AND disable its flows — not just toggle policy `enabled`.
- **intervals.icu** connect via a user-pasted **API key**, validated and stored
  encrypted at rest (client-only — no backend).
- **Honest UI** for Strava/Wahoo: an accurate `not-supported` state, no Connect
  action that pretends to do OAuth.
- A `ConnectionProvider` port so each mechanism is an interchangeable adapter.

**Non-Goals (this change):**

- Strava/Wahoo OAuth — deferred (needs a client secret + token exchange, i.e. a
  backend/serverless surface this repo does not have). Tracked as a follow-up.
- Any backend / serverless endpoint, redirect-URI hosting, or secret management.
- Changes to how enabled flows actually import/export data (the existing
  `IntegrationPolicy` + bridge sync paths are unchanged).
- Syncing connection credentials across devices (kept local — see Decisions).

## Decisions

**D1 — Connection state is a first-class record, not inferred from policies.**
Add a `ConnectionRecord { profileId, providerId, status, mechanism, credentialRef?, updatedAt }`
persisted in a new Dexie store `connections` (PK `[profileId+providerId]`).
The UI reads connection status from this record; per-flow toggles stay in
`IntegrationPolicy`. _Alternative — keep inferring from policies (status quo):
rejected; it conflates "this data flow is on" with "this account is linked",
which is the bug #714 calls out._

**D2 — A `ConnectionProvider` port with mechanism-specific adapters.**
Port (specified before any adapter, per hexagonal rules):
`connect(input): Promise<ConnectionRecord>`, `disconnect(profileId): Promise<void>`,
`status(profileId): Promise<ConnectionStatus>`. Adapters: `bridge` (Garmin,
Train2Go), `api-key` (intervals.icu), and a `not-supported` sentinel (Strava,
Wahoo) that exposes no connect. The provider catalog (`connection-config.ts`)
declares each provider's `mechanism`. _Alternative — bespoke per-provider hooks:
rejected; a port keeps the UI uniform and lets Strava/Wahoo flip from
`not-supported` to `oauth` later without UI churn._

**D3 — `disconnect()` = clear connection + disable flows.**
Real disconnect composes two steps: (1) clear the `ConnectionRecord` and any
credential (bridge: clear the extension session/local linkage; api-key: delete
the encrypted key), then (2) the existing `disableBridge` policy step. So
`disableBridge` becomes one stage of `disconnect`, not the whole thing.

**D4 — Credentials encrypted at rest, reusing `lib/crypto.ts`.**
The intervals.icu API key is stored AES-GCM-encrypted in the `connections` store
(via `credentialRef`), never plaintext. _Alternative — localStorage / plaintext
Dexie: rejected (unencrypted secret at rest)._

**D5 — Connection records stay device-local (not in the cloud snapshot).**
To avoid writing provider tokens/keys into Google-Drive snapshots, the
`connections` store is excluded from the sync snapshot in this change; connect/
disconnect is per-device. _Alternative — sync encrypted credentials: deferred;
revisit once token rotation/expiry handling exists._

**D6 — intervals.icu connect validates the key with a live API call.**
`connect` issues a test request (e.g. `GET /api/v1/athlete/{id}` with the key)
and only persists on success, surfacing a clear error otherwise. This depends on
intervals.icu serving permissive CORS to browser origins (see Risks).

## Risks / Trade-offs

- **intervals.icu API CORS** → the client-only API-key path requires
  intervals.icu to allow cross-origin requests from the app origin. → Mitigation:
  verify the request shape + auth header early (first task) so the integration is
  built right. intervals.icu is **in scope for this change** — it is not a
  follow-up. The only deferred follow-ups are Strava/Wahoo OAuth.
- **Deferring Strava/Wahoo leaves visible "not supported" rows** → could read as
  unfinished. → Mitigation: explicit, honest copy ("Connect coming soon") and no
  dead Connect button; better than today's fake deep-link.
- **Bridge "disconnect" semantics are limited** → the SPA cannot force a Garmin
  Connect logout inside the extension. → Mitigation: scope bridge disconnect to
  clearing local linkage + disabling flows + prompting the user; document the
  boundary in the spec.
- **Device-local credentials** → connecting on one device does not connect
  others. → Accepted trade-off for security simplicity this phase (D5).

## Migration Plan

- **Dexie v24**: additive `connections` store (`[profileId+providerId]`,
  `profileId` index for the profile-delete cascade). Index-only/new-store change
  — non-destructive, no data transform (mirrors the v23 pattern). Register in
  `register-kaiord-versions*`; add v24 schema-declaration tests.
- No existing data is rewritten; absence of a `ConnectionRecord` = `disconnected`
  (or `not-supported` per catalog), so current users see no regression.
- **Rollback**: the store is additive and unread by older code; reverting the
  feature leaves orphan rows that are harmless and pruned by the profile cascade.

## Open Questions

- Confirm the exact intervals.icu API endpoint + auth header used for the
  connect-time validation call (resolved by the early verification task).
  intervals.icu remains in scope regardless of the outcome.
- Should the intervals.icu key eventually sync (encrypted) across devices, or stay
  device-local permanently? (Deferred per D5.)
- For Garmin/Train2Go, is clearing local linkage + disabling flows a sufficient
  "disconnect", or should it also drive the extension to sign out? (Spec scopes
  to local linkage for now.)
