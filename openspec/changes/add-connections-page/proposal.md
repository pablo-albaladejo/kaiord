## Why

A user who wants to know whether Kaiord is receiving their data has to visit
three surfaces and reconcile them by hand. Athlete → Connections lists brands
and can disconnect them. Settings → Extensions lists three of the five browser
bridges, with no session detail and no link back to the brand. Settings → Data
Hub renders the routing matrix — with every bridge column permanently headed
"Not connected" above cells the same table draws as active.

That last contradiction is not a display bug. `connect(providerId, "bridge", …)`
is called from nowhere in the app: the only `"bridge"` call site on the
connection provider is the disconnect at `ConnectedRow.tsx`. So a bridge's
`connections` row can only ever be `"disconnected"` or absent, the matrix
header's `status === "connected"` rule is unsatisfiable, and — the other half of
the same hole — nothing ever _reads_ the record, so pressing Disconnect changes
no pixel anywhere.

Wave 0b built a unified per-bridge connection model and then left it dormant:
it has zero production consumers, and `use-store-hydration` deliberately does
not start it. This change gives it its first consumer and, in doing so, makes
the stored connection record load-bearing.

## What Changes

- **A Connections section at `/settings/connections`**, mounted in the Settings
  shell like any other section. The three legacy surfaces are untouched; Wave 4
  retires them.
- **One card per registry integration**, ordered connected → attention →
  available → manual → unsupported, each addressable as
  `connection-card-<id>`. The browser bridge is reported _inside_ its source's
  card rather than in a separate list.
- **One definition of "connected"**, shared by the cards, the Data Hub column
  headers and the Data Hub cells: a bridge is connected iff its extension is
  discovered AND its connection record is not `"disconnected"`. A missing
  record means "never disconnected".
- **Reconnect writes the record** that undoes a disconnect — the first caller
  of a provider `connect` that has existed unused since #714.
- **"Sync now" per source**, wired to the same runner the calendar's
  once-per-mount effect uses, with an in-flight guard and a cooldown.
- **The connection store is started** by `use-store-hydration` now that a
  surface renders its output.
- **A new `connections` i18n namespace** in `en` and `es`.

Deliberately NOT shipped, because no state backs them: "token expired" (no
prober distinguishes expired from never-issued), "primary for N types" (the
default multi-source mode is `union`, which has no winner), "stopped syncing N
days ago" (no transition timestamp exists anywhere), a "Notify me" waitlist
(nothing records interest), and a Connect control for an extension that is not
installed (a web page cannot install one).

Out of scope: the per-data-type routing rows (Wave 2a), the stats row and
consequence banner (Wave 3), and retiring Extensions / Data Hub / the Athlete
connections list (Wave 4).

## Capabilities

### New Capabilities

- `spa-connections-page`: the unified Connections section — its card model,
  the shared connected-source rule, the status vocabulary and what each state
  is permitted to claim, capability chips derived from cabled routes, on-demand
  per-source import, and the honest-copy constraint that binds all of them.

### Modified Capabilities

- `athlete-connections`: the connection record becomes a read signal rather
  than a write-only one, and the bridge rule is stated as
  discovery-AND-not-disconnected rather than "shown as `disconnected` when no
  record exists".

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application-port or adapter-package change; no dependency added.
- **Routing**: none. `/settings/:section?` already resolves any registered
  section; `connections` joins `SettingsTab`, `TAB_ORDER` and `TAB_VIEWS`.
- **Shared code touched**: `DataHubMatrixSignals.isBridgeOnline` is renamed to
  `isBridgeConnected` and now folds in the connection record. Both producers
  (`use-data-hub-matrix`, `build-data-route-signals`) are updated; the chat
  `get_data_routes` tool reads the same signals and inherits the fix.
- **Behaviour change**: a bridge the user disconnected now reads as not
  connected in the Data Hub matrix as well as on the new page. Every bridge
  nobody disconnected is unaffected — no migration.
- **i18n**: one new namespace (`connections`) in both locales, plus
  `settings.tabs.connections`. `resource-parity.test.ts` covers both.
- **e2e**: no test id and no URL changed. `settings-row-connections` keeps its
  identity and now navigates to `/settings/connections`.
- **No** schema or Dexie version bump, no public-API impact, no changeset (the
  SPA is private and excluded from the changeset-bot PUBLISHABLE set).
