## Why

The Athlete page's **Connections** section ships Strava, Wahoo, and
intervals.icu as inert placeholders (their "Connect" pill only deep-links to
`/settings/extensions`), and the "Disconnect" action for the real Garmin
integration is provisional — it merely flips `IntegrationPolicy.enabled` to
`false` (`use-policy-toggle.ts` `disableBridge`) rather than performing an
actual account disconnect. Users are shown brands they cannot connect and a
"Disconnect" that does not really disconnect. This change makes connection
state honest and gives each provider a real connect/disconnect path (or an
explicit, accurate "not supported yet" state).

## What Changes

- Introduce an explicit **connection-state model** per provider
  (`connected` / `disconnected` / `not-supported`) distinct from per-flow
  integration policies, so the UI reflects real account linkage rather than
  inferring it from whether any policy is enabled.
- Define **real disconnect semantics**: disconnect clears the provider's stored
  connection (session/credential/token) AND disables its flows, instead of only
  toggling policy `enabled`. Garmin/Train2Go (Chrome-extension bridges) gain a
  defined "clear bridge session" disconnect.
- Add a **per-provider connect mechanism**, chosen in `design.md` against the
  client-only-PWA constraint (no backend server today):
  - **intervals.icu** — personal **API-key** entry (client-only feasible now).
  - **Strava / Wahoo** — OAuth 2.0; these need a redirect URI + token exchange
    (a secret/backend), so the design decides between a minimal serverless
    token-exchange endpoint, PKCE where supported, or an explicit **deferred**
    "not supported yet" state with honest UI. No fake OAuth.
- Replace the placeholder rows in `connection-config.ts` with a catalog that
  declares each provider's connect mechanism and supported flows.
- Securely store any provider credentials/tokens at rest (reuse the existing
  AES-GCM encryption used for the sync passphrase; never plaintext in Dexie).

This is an **epic**: it is phased so a useful, honest slice (connection-state
model + real disconnect + intervals.icu API-key + accurate "not supported yet"
for Strava/Wahoo) can land before any OAuth backend exists.

## Capabilities

### New Capabilities

- `athlete-connections`: per-provider connection lifecycle — the connection
  state model, real connect/disconnect semantics, the provider catalog with its
  connect mechanism (bridge / API-key / OAuth / unsupported), secure credential
  storage, and the honest UI states. Covers Garmin, Train2Go, intervals.icu,
  Strava, and Wahoo.

### Modified Capabilities

<!-- None at spec level. Existing bridge specs (garmin-bridge, train2go-bridge,
     spa-bridge-protocol, bridge-runtime-discovery) and health-data are
     referenced in Impact; their requirements are not changed by this proposal —
     the new connect/disconnect semantics live in `athlete-connections`. If the
     design surfaces a spec-level change to bridge disconnect, add a delta then. -->

## Impact

- **Code**: `packages/workout-spa-editor/src/components/organisms/AthleteConnections/`
  (`connection-config.ts`, `use-policy-toggle.ts`, the connections UI), a new
  connection-state store/repository (Dexie), and a credential store reusing
  `lib/crypto.ts`. Touches the SPA application + adapter layers only;
  `@kaiord/core` domain is unaffected.
- **New I/O port**: a `ConnectionProvider` port (connect/disconnect/status) is
  specified before any adapter (per hexagonal rules); OAuth/API-key adapters
  implement it.
- **Dependencies / infra**: Strava and Wahoo OAuth may require a new
  token-exchange surface (serverless function or hosted redirect). Flagged for
  the design; if adopted it is an infra addition, not a code-only change.
- **Persistence**: likely a new Dexie store for connection records (additive,
  index-only migration); detailed in design + specs.
- **No breaking changes** to the public `@kaiord/*` API.
