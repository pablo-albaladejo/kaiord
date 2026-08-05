# Design · Library, Workout detail, Create workout, Chat

Decisions that are not obvious from the proposal, with the reasoning that
selected them.

## D1 · The zone profile strip is `ZoneDist`, not a new component

The wave brief called for a shared "ZoneProfileBar with a parameterisable
height". `molecules/ZoneDist` already _is_ that component:

```ts
export type ZoneDistProps = HTMLAttributes<HTMLDivElement> & {
  dist: number[];
  height?: number;
  className?: string;
};
```

It maps `dist[i] > 0` to a `flex: value` segment coloured by `zoneBgClass(i+1)`,
skipping empty zones — exactly the design's strip. Adding a second component
with the same props under a different name would create a duplicate to
deduplicate later, and a rename is a strictly smaller merge than a deletion.

So this change adds **no** new bar component: every call site is
`<ZoneDist dist={…} height={10} />`. If the Calendar wave lands a
`ZoneProfileBar`, converging is a symbol rename at four call sites, with no prop
translation, because the API is already the one it was asked to define.

`ZoneDist` itself is untouched. `rounded-full` on a 10 px bar gives the 5 px cap
radius the design draws at that height, and its `gap-[2px]` matches.

## D2 · Dominant zone vs hardest zone are two different questions

Both are derived from the same `dist: number[]` (five fractions summing to 1, or
all zero when nothing is classifiable), and they answer different questions:

- **Dominant** = `argmax(dist)`. "What is this session mostly?" It drives the
  4 px lateral border, because the border is a session's identity at a glance in
  a list — an endurance ride with one 30-second sprint is an endurance ride.
- **Hardest** = the highest index with `dist[i] > 0`. "How hard does this get?"
  It drives the named summary metric, because that is the question the metric
  asks.

Ties in `argmax` resolve to the **lower** zone. A 50/50 split between Z2 and Z4
is an endurance session with a hard block in it, not a threshold session;
claiming the higher zone would overstate every mixed workout in the library.

Both return `null` when the distribution is all zeros, and every caller renders
_nothing_ rather than a placeholder. A session with no classifiable structure
has no zone, and a neutral bar is a claim that it does.

## D3 · Threshold provenance claims only what the profile stores

The handoff's example line is "Targets from FTP 268 W · Garmin, 4 days ago".
The repo cannot produce the middle term: `sportThresholdsSchema` is
`{lthr?, ftp?, thresholdPace?, paceUnit?}` — there is no source field and no
per-field timestamp anywhere in the profile, and `syncZones` writes threshold
values through `writeThreshold` without recording where they came from.

Rather than invent a source or drop the principle, the line states the three
things that _are_ true:

1. **Which threshold**, by the sport's own name. Cycling writes against FTP,
   running against threshold pace, swimming against CSS pace.
   `thresholdCandidates(sport, thresholds, maxHeartRate, units)[0]` already
   returns exactly that ordered primary — it is the same derivation the Athlete
   screen shows, so the two surfaces cannot drift.
2. **Its value and unit**, formatted by the same helper.
3. **When the profile last changed**, through the existing
   `formatRelativeTime(date, now, locale)` → `common:relativeTime.*` keys.

`profile.updatedAt` is honestly labelled as the profile's own timestamp, not the
threshold's: the copy is "from your athlete profile · updated 4 days ago", never
"FTP updated 4 days ago". When the sport has no primary threshold set, the whole
line is omitted — a targets line with no target is worse than none.

`now` is injected into the builder rather than read inline, following
`formatRelativeTime`'s own contract, so the unit tests need no fake timers.

## D4 · The proposal card's "before" differs by surface, and is optional

`SessionProposalCard` takes metrics shaped `{ value, was?, label }` and renders
`was` as a second line under the figure. Both producers fill it from real data:

- **Chat.** `doCreateWorkout` returns `{workoutId, date}` and writes a new
  record with a fresh uuid; it replaces nothing. The "before" is therefore the
  session that was already on that date — found by scanning the `workouts` table
  for the same `profileId + date` with a different id, taking the one created
  most recently before the proposal. When the date was empty, `was` is absent on
  every metric and the card renders as a plain summary. This is why the copy
  says the proposal lands next to that session rather than replacing it.
- **Coaching draft.** The activity carries `duration` (the coach's own string)
  and `workload` (the platform-native metric, preserved verbatim). Those are the
  before values against the structured draft's derived duration and TSS.

`was` is optional, not defaulted to a dash: an absent comparison is silence
(principle 2), not a rendered "no data".

## D5 · Zone names live in the `zones` namespace, once

The swatch-and-word rule needs five words in every locale. `zone-models.ts`
holds them as a hardcoded English `ZONE_NAMES` tuple feeding the Athlete zone
map, which is not translatable and is not this wave's file to restructure.

The five names go into `zones.json` as `zoneName.z1`…`z5` — the namespace that
already owns zone vocabulary — and the three screens that name a zone read them
from there. One copy, two locales, no per-namespace duplication. Reconciling
`ZONE_NAMES` onto the same keys is left to whichever wave next touches the zone
map.

## D6 · What the chat transcript repaint fixes

`ChatMessageList` painted the user bubble `bg-sky-600 text-white` and the
search-focused message `ring-2 ring-yellow-300`. Both are literal hues on a
palette that has none to spare: sky-600 sits inside the Z2 arc, so a user's own
message was drawn in the colour that means easy endurance, and yellow-300 sits
inside Z4's. The focus ring is worse than a collision — the palette deliberately
has no warning colour, so a yellow ring reads as a state the transcript is not
in. They become `bg-accent text-surface` and a neutral `ring-edge-strong`.
