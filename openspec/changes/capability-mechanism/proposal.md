## Why

Everything in the Kaiord App is switched on from first load, so a new athlete
meets eleven destinations before their first Workout (#1670, stories 20 to 23;
ADR 0003 "Capabilities off by default"). Labs, nutrition, trends, Templates,
the assistant and every Platform beyond the core path should stay out of sight
until the athlete activates them, and activating or deactivating one must
never lose data. There is no mechanism for that today: each screen decides on
its own what to show. This change builds one mechanism and proves it on
Templates (#1659), so the next Capabilities (#1666, the Authority matrix;
#1664, labs, nutrition, trends, the assistant, the Platforms and WHOOP) are
one declaration each.

## What Changes

- **One catalogue of Capabilities** (`lib/capabilities/capability-catalogue.ts`):
  each entry names, by the id its registry already uses, the navigation
  destinations, routes, settings sections and assistant Tools it owns, the
  parts of other screens it owns (`inScreen`), an optional `advanced` or `experimental` grade, and optionally a Dexie
  table whose rows mean the athlete already used it.
- **One read API** (`useCapabilities()`, `<CapabilityGate>`): `isOn(id)` and
  `offers(kind, id)`. Navigation (header bar, More menu, avatar menu, bottom
  bar), the route switch, the settings index and rail, the assistant's Tools and its "what can I do" list, the setup checklist and
  every link into a Capability from another screen read it.
- **Off leaves no trace**: an off Capability is absent from navigation and
  settings, its routes redirect to the Day (`/daily`), its Tools are not offered to the model, and nothing
  links to it.
- **The athlete's decision** lives in a store of its own
  (`capabilityDecisions`, Dexie v40, one row per athlete and Capability), so
  it survives reload, syncs between their devices with Drive, travels in a
  backup file, and no older build rewriting the preferences row can erase it.
- **Settings, Capabilities** is the one place to turn one on or off, in one
  step. A switch is its own undo; nothing asks first.
- **Templates is the first Capability**: the Library destination and route,
  "Keep in library", the "Template" tile when creating, the setup step for it.
  An athlete with templates and no decision reads as on, so the update hides
  nothing they made.
- **A guard** (`check-capability-surfaces.mjs`, `pnpm lint:capability-surfaces`)
  fails when a file reaches a Capability's module, spells its route or reads a
  surface registry without going through the read API.

## Capabilities

### New Capabilities

- `spa-capabilities`: the catalogue, the read API, where the decision lives,
  the off-leaves-no-trace rule, Settings, Capabilities, Templates as the
  first, the guard.

### Modified Capabilities

None.

## Impact

- `@kaiord/workout-spa-editor` (private): the catalogue, the provider and
  read API, the route gate, the nav, settings, chat tools and setup checklist
  wiring, the `capabilityDecisions` store (Dexie v40), the `settings` dictionaries (English and Spanish), a new
  e2e spec, existing e2e specs of the Library turn Templates on first.
- `scripts/`: the guard, its vocab, its test; `package.json` `lint`.
- GLOSSARY.md: the athlete-facing word for Capability in each language.
