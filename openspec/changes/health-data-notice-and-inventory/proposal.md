## Why

Health data leaves the athlete's device for their Provider with no notice:
the assistant reads sleep, weight, HRV and meals, a generation carries the
heart-rate zones, and a lab document goes whole. ADR 0003 says the App asks
first only before something irreversible outside the device and the first
time health data goes to a Provider (#1670, stories 62 and 63). The athlete
also cannot see, in one place, every destination their data can reach.

## What Changes

- **One registry of data flows** (`application/data-flows/`): every kind of
  data and every destination it can reach (each Provider, each Platform
  through its extension, intervals.icu, Google Drive, Umami), with what each
  path sends and what it does when the athlete says no.
- **The first-time notice.** Before health data would first go to a
  Provider, the App stops and names the kinds of data and the Provider. The
  athlete chooses: send this time, always allow this Provider, or don't
  send. A standing answer is kept per Provider on this device and is never
  asked again; a Provider not yet answered for asks for itself.
- **"Don't send", per path.** The assistant answers without the health
  tools' data and without its earlier answers that used health data; a
  generation goes without the heart-rate thresholds and zones; a lab
  document is not sent.
- **The inventory** in Settings, Privacy: generated from the registry, with
  whether each destination is set up for this athlete now, and the standing
  answer per Provider, which can be changed there.
- **Guards.** A test fails when a file reaches a destination the registry
  does not declare, when the App's content security policy allows an origin
  no destination owns, when an extension can be sent a kind of data no flow
  names, and when a chat tool is not classified as reading health or not.
- **Claims.** The inventory's and the notice's sentences are registered
  (`claims/data-flows.json`), English and Spanish.
- A pending answer is unsaved work: an update does not reload over it.

## Capabilities

### New Capabilities

- `data-flow-inventory`: the registry, the first-time notice, the per-path
  "don't send", the inventory and its guards.

## Impact

- `@kaiord/workout-spa-editor` (private): new `application/data-flows/`,
  `lib/health-sharing-*`, the notice dialog, the Privacy section, the chat
  turn runner, `generateWorkoutKrd`, the lab extraction, a `dataFlows`
  dictionary namespace in English and Spanish, one new e2e spec.
- `claims/data-flows.json`; the privacy policy's Data Collection section.
- No Dexie schema change: the answer lives in this browser's localStorage,
  like the device preferences, and never rides the Drive snapshot.
