# Rebrand V2 · Athlete

## Why

The Athlete page is where the numbers that drive every generated workout and
every pushed target live, and it is the screen that says least about them.

- **FTP 268 W is rendered exactly like FTP 268 W typed by hand seven months
  ago.** The page shows a value and nothing else. A number without an origin is
  a supposition (principle 1), and the data to fix this already exists:
  `LinkedCoachingAccount.lastSyncedZonesSnapshot` records the threshold scalars
  of the last successful sync together with its `syncedAt`.
- **The `auto` toggle is dead.** `ThresholdCard` holds it in
  `useState(true)`, renders "Auto zones" / "Manual zones" beside it, and writes
  nowhere. Meanwhile the real switch that governs whether a source may overwrite
  a threshold — the `(training-zones, import, auto)` `IntegrationPolicy` that
  `hasEnabledAutoImportZonesPolicy` reads — has no control anywhere on this
  page.
- **A source can disagree with the profile in silence.** When a sync leaves a
  snapshot value that differs from what the profile holds, nothing on the page
  says so. The user's zones stay derived from the older number with no way to
  see or take the newer one.
- **The reason sits below what it justifies.** "These zones power AI workout
  generation and every target you push to Garmin" is the motive for the whole
  card; it renders under the map (principle 8).
- **`AvatarRing` paints two literal hexes** (`#0284c7`, `#a855f7`) — the retired
  accent blue and accent purple, hard-coded past the token layer, in the one
  place on the page that could carry the athlete's own intensity ramp.
- **`ZoneMap` prints its labels inside the bars** at `text-black/55`, which is
  2:1 on Z1 and Z5, and encodes intensity in hue alone — remove the colour and
  the ramp stops reading.
- Per #1121, the components this screen is built from still paint the raw
  Tailwind dialect: `Card` alone is `bg-white … dark:bg-gray-800` under 19 call
  sites.

## What Changes

- **Every threshold carries its provenance and its age.** A new
  `lib/athlete/threshold-provenance.ts` matches the profile's current value for
  a field against the snapshot value a linked account last wrote: equal means it
  came from that source at `syncedAt`; anything else means it was typed by hand.
  Rendered as "Train2Go · 4d ago" or "By hand".
- **Provenance has two states, not three.** The green / grey / amber dot
  vocabulary collapses to: nothing when the number is fresh, and a
  `triangle-alert` icon plus `--text` when it is older than the staleness window
  (principle 2). A hand-typed value is only ever _dated_ — and therefore only
  ever able to raise attention — when `profile.updatedAt` proves the whole
  profile has not been touched since. The page never invents a date it cannot
  bound, so it never warns falsely.
- **A source that disagrees is surfaced where the number is.** When a linked
  account's snapshot holds a different value from the profile's, a neutral-marked
  row states it — "Train2Go recorded 191 bpm on 12 July · Kaiord is still using
  186 bpm" — and its primary action is the fix: **Use 191** (principle 4), with
  **Keep 186** dismissing it for the session.
- **The `auto` toggle gets its real meaning**, stated in one line: "Let a
  connected source update these numbers · Off means nothing overwrites a number
  you typed yourself." It reads and writes the `mode` of the profile's
  `(training-zones, import)` policies. With no such policy the row does not
  render — there is no mechanism for it to govern.
- **`AvatarRing` becomes the zone ramp.** `conic-gradient(--zone-1 … --zone-5)`.
  The athlete's ring is their intensity, and the last two literal hexes on the
  screen are gone.
- **`ZoneMap` encodes intensity twice** — width is the zone's range, height is
  its intensity — and its labels move **below** the bars.
- **FTP stops being accent-coloured.** The `accent` prop leaves `Metric`
  entirely: this page was its only consumer, and a prop that paints a number
  like a link is a regression waiting to happen.
- **The reason moves above the map**, in an elevated panel that names the
  threshold it derives from: "Derived from FTP 268 W. These five bands are what
  the AI writes workouts against and what your watch receives as targets."
- **Slate/gray → roles in every file this change touches** (#1121): `Card`,
  `Segmented`, `SectionHead`, `Metric`, `AvatarRing`, `ZoneMap`, and the whole
  `AthletePage` tree. Type weights drop to 400/500/600, radii to the V2 scale
  (card 16, control 8, field 12), figures take
  `tabular-nums slashed-zero`.

Deliberately NOT shipped: per-field provenance timestamps. Recording _when each
number was typed_ needs a write-path change in the zone editor and the sync
reconciler plus a stored shape; this change derives everything it claims from
state that already exists and stays silent where that state cannot support a
claim. Also out: the attention count on the Connections link (it belongs to
`spa-connections-page` and its hooks).

## Capabilities

### New Capabilities

- `spa-athlete-profile`: the Athlete page's contract — threshold provenance
  derivation and its two-state attention rule, the source-disagreement row and
  its fix-shaped CTA, the auto-import control's binding to the integration
  policy, and the zone-map encoding.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain
  package, no adapter package, no dependency added.
- **Schema**: none. No Zod schema, no Dexie table and no Dexie version changes —
  provenance is derived at render time from `lastSyncedZonesSnapshot` and
  `profile.updatedAt`, both of which have existed since v9.
- **Application layer**: `UpdateProfileInput` gains `maxHeartRate`, so the
  disagreement row's **Use 191** can write the field it is about. Sport
  thresholds already have `updateSportThresholds`.
- **Shared components touched** (other screen waves consume these):
  `atoms/Card` (base classes → roles, radius 20 → 16), `atoms/Segmented`
  (active fill → `--control`, radii → V2), `molecules/SectionHead` (weights,
  action colour), `molecules/Metric` (`accent` prop removed),
  `molecules/AvatarRing`, `organisms/ZoneMap`. `ZoneMap`, `AvatarRing` and
  `Metric` have no consumer outside this page today.
- **`atoms/Icon/status-icon.ts`** is new: `alert` (TriangleAlert) and `info`.
  They sit beside `ICON_MAP` rather than in it because that file is at its
  `max-lines` cap and belongs to the header wave; the naming convention is the
  same and the two maps fold together whenever that file is next restructured.
- **i18n**: the `athlete` namespace grows provenance, reconciliation, auto-import
  and zone-reason copy in `en` and `es`. No new namespace.
- **e2e**: no test id and no URL changed; no visual baseline covers this page
  (the only two baselines are the coaching sidebar).
- **No changeset**: the SPA is private and outside the changeset-bot
  `PUBLISHABLE` set.
