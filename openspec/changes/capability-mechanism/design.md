## Context

ADR 0003 makes everything beyond the core path from Coaching Activity to
Workout on the watch a Capability: off by default, out of navigation and
settings until activated. The App already had one registry per kind of
surface (`NAV_ROWS`, `SETTINGS_PAGE_ROWS`, `useEditorCommands`,
`SHORTCUT_CATALOG`, `buildChatTools`, `CHAT_CAPABILITIES`), each read by its
own screens, a per-profile `userPreferences` row that rides the Drive
snapshot and the backup file, and device preferences in localStorage
(`spa-user-preferences`).

## Decisions

### D1. One catalogue that names surfaces by their registry's own ids

A Capability is one entry in `CAPABILITY_CATALOGUE`:

```ts
{
  id: "templates",
  grade?: "advanced" | "experimental",
  owns: { nav: ["library"], routes: ["/library"], settings: [], tools: [],
          inScreen: ["workout-save-as-template", "create-from-template", …] },
  adoptsExistingData?: "templates",
}
```

`inScreen` names each part of another screen the Capability owns (a button,
a tile, a setup step, a link); `<CapabilityGate surface>` and
`offers("inScreen", id)` take those ids, typed from the catalogue
(`InScreenSurfaceId`), so a typo fails typecheck and ownership lives here
only. The modules of a Capability's screens (`MODULES`) live in
`scripts/capability-surfaces.vocab.mjs`: only the guard reads them, and the
App's first load does not need them. Editor commands and keyboard shortcuts
are not a kind: no Capability owns one, and a kind with nothing in it was a
filter that decided nothing; the first Capability that owns one adds the
kind (D8).

The registries stay where they are and keep their ids; the catalogue says
which of their entries a Capability owns. Rejected: a flag per registry row
(`capability: "templates"` on a nav row, a tool, a settings row): six places
to edit per Capability, and nothing would list what one Capability is.
Rejected: moving a Capability's surfaces into a module of its own that
registers them (a plugin shape): a far larger change for the same answer, and
the glossary says to avoid "plugin" for a reason.

### D2. One read API, asked at each registry's single read point

`useCapabilities()` returns `{ status, on, isOn(id), offers(kind, id), set }`
from one provider at the App root. The provider carries a handle, not data
(contexts hold no persisted data): one live Dexie read shared by every
reader, the last answer kept, and writes through the `PersistencePort`
from `usePersistence()`. Every id is a `CapabilityId`.
`offers` is false only when an off Capability owns that surface, so a
surface no Capability owns needs nothing. Each registry is filtered once,
where it is read: `useOfferedNavDestinations` (header, More, avatar menu,
bottom bar), `CapabilityRouteGate` around the route switch,
`SettingsGroupList` and `SettingsSectionRail` (and `useSettingsSection` for
a deep link), `buildChatTools` (a required `offersTool`, threaded from
`useChatTurn`) and `chatCapabilitySections`.
A link from another screen asks with `<CapabilityGate id>` or `isOn(id)` and
builds its href with `capabilityHome(id)`.

`useCapabilities()` throws outside its provider; tests and stories turn
one on with `CapabilitiesFixture` or `renderWithProviders({ capabilities })`.

### D3. The decision is the athlete's: per profile, in a store of its own

Story 22 says "as an athlete, I want to activate a Capability": the athlete,
not the browser, grows the App, and on a second device they expect the same
App. So the decision is per profile, one `capabilityDecisions` row per
(profile, Capability), `[profileId+capabilityId]`, in the Drive snapshot
(merged per row by its `updatedAt`, so two devices deciding different
Capabilities keep both), `include` in the backup table policy, cascaded on
profile delete and re-keyed with the auto profile. Dexie v40 adds the store
and moves any `capabilities` map off the preferences row.

Rejected, after shipping it first: a `capabilities` map on the
`userPreferences` row. Every older build rewrites that row from a fixed
list of fields (and `setCalendarView` from three), so a later write there
from an older device won the sync and dropped the map: the decision was
gone, and with templates stored Templates came back on. A store of its own
is one older builds never write. The preferences writers now also keep
every field of the row they do not know, so a newer build's field survives
this one. Rejected: device preferences in localStorage, which neither sync
nor travel in a backup, so a phone would show a different App from the
laptop.

Known limit: a device on a build older than v40 cannot import a v40
snapshot (as with every schema version); it carries the store through a
merge it pushes, and never writes it.

### D4. Existing athletes keep Templates: data means on until they decide

With no decision recorded, a Capability that declares `adoptsExistingData`
reads as on when its table holds a row for the athlete (any row when the
table is not per profile, as `templates` is not). An explicit decision always
wins, so deactivating stays deactivated with the templates still there. This
is a reading, not a migration: it also covers a backup file from an older
version restored into a new browser, and a device still on an older version
that syncs templates in, neither of which a one-time upgrade function would
see. Rejected: a Dexie upgrade that writes `templates: true` for every
existing profile (misses those two paths). Rejected: on for every existing
athlete regardless of data (shows Templates to athletes who never used them).

Consequence: `templates` is one table for the whole browser, so a second
athlete created later on a browser that holds templates reads Templates as on
until they decide. That matches what the Library showed them before.

### D5. An off route lands on the Day, after the decision is known

`CapabilityRouteGate` (beside `CapabilityGate` in `components/atoms/`)
redirects (with `replace`) any route an off Capability owns to the Day
(`DAILY_PATH`), matching the location as the router does: wouter decodes
it and matches case-insensitively with an optional trailing slash; the
query and a stray hash are dropped. While the athlete's decisions are still loading it renders
the route spinner: redirecting then would bounce a deep link of a Capability
that is on. A settings section an off Capability owns reads as unknown (the
index), after the same wait.

### D6. The guard is a root check over the AST

`check-capability-surfaces.mjs` reads the catalogue from its TypeScript AST
(no copy to drift) and scans every production source file:
R-CapabilityModuleThroughReadApi (a file outside a Capability importing one
of its `modules` imports the read API; the lazy route table is exempt only
while the route switch sits inside `CapabilityRouteGate`),
R-CapabilityRouteLiteral (a Capability's route, or an owned settings path,
is spelled only in the catalogue), R-CapabilityRegistryGate (a surface
registry is named only where it is defined, by its gate readers, each
asking the read API or handed its answer by a declared file that does, and
by declared lookups with a reason) and R-CapabilityDecisionThroughReadApi
(a file reading the decisions, `application/` included, resolves them
through the read API). Only a value import of the read API counts: a
type-only import asks nothing. A declared module, reader or lookup that is
missing, or no longer names its registry, fails, as does a catalogue that
parses to nothing. Known gap: a file that imports the read API for one
surface and reaches another without asking passes.

### D7. ADR 0003: no new destination, visible state or confirmation dialog

Settings, Capabilities is a section of the one settings place, not a
navigation destination. A switch is not a Workout state. Turning a
Capability off deletes nothing, so it asks nothing first: the switch is its
own undo ("decide and offer undo"). The record needs no change.

ADR 0003's consequence that "a guard enforces" a change to the record for a
new destination, visible state or confirmation dialog does not hold yet: no
such guard exists; ticket #1668 adds it.

### D8. How the next Capabilities are added

Each is one catalogue entry plus its `capabilities.items.<id>` strings:

- #1666, the Authority matrix: `{ id: "authority-matrix", grade: "advanced",
owns: { settings: [...], tools: ["set_data_route"], ... }, modules: [the
matrix screens] }`. Its Tool disappears from the model and from "what can I
  do" with no code change.
- #1664: `labs` (`nav: ["labs"]`, `routes: ["/health/labs"]`,
  `adoptsExistingData: "labReports"`), `nutrition` (`nav: ["nutrition"]`,
  `routes: ["/nutrition"]`, `tools: ["log_intake", "query_energy_balance"]`,
  `adoptsExistingData: "intakeEntries"`), `trends` (`nav: ["trends"]`,
  `routes: ["/health"]`), the assistant (`nav: ["chat"]`, `routes: ["/chat"]`),
  each Platform beyond the core path (its Connections section and Tools), and
  WHOOP with `grade: "experimental"`. A per-profile adopting table is counted
  for the active athlete only, by its `profileId` index.

A new kind of surface (say, a Connections card) is the one case that touches
the mechanism: a new `CapabilitySurfaceKind`, its registry filtered once
where it is read, and a registry row in `capability-surfaces.vocab.mjs`.
