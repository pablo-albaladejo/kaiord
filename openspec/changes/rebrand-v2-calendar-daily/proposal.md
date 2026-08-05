# Rebrand V2 · Calendar, Daily and the empty states

## Why

The foundation change (#1117) replaced the palette and left the screens alone.
Three of them are the app's front door, and each carries a defect the new
palette makes worse rather than better:

1. **The calendar card border says the wrong thing.** It encodes the workout's
   _lifecycle_ (`raw`/`stale` → amber, `ready`/`pushed` → emerald), so the one
   4 px graphical channel on every card is spent on a fact the card already
   states in words, and spends it in two hues that no longer exist in the
   palette. The redesign gives that channel to the session's **dominant
   training zone** — the only thing on the card that colour can carry and text
   cannot — and leaves a session with no structure uncoloured, so
   "Process all with AI" is literally what gives a card its colour.

2. **`CalendarEmptyBanners` renders nothing on a true first run.** Every one of
   its five children is gated on data existing: `EmptyWeekState` needs
   `hasAnyWorkouts`, the AI banner needs `rawCount > 0`, the bridges banner
   needs `hasReadyWorkouts`, and both batch surfaces need a raw count. With an
   empty database all five predicates are false, so the emptiest possible state
   is the one that says least. A new user sees seven empty day cells and no
   statement of what has to be true for them to fill.

3. **The banners that do fire name a missing component, not a consequence.**
   "No AI provider configured" is a fact about Kaiord's settings; "2 sessions
   arrived as prose and are stuck that way — your watch can't receive prose" is
   a fact about the user's week. Six banners could stack on one calendar; the
   redesign reduces the steady state to one week-scoped action.

Alongside these, the calendar had no week-level answer to "where does this week
stand", the Daily dashboard put readiness above the session the day is actually
about, and `--core-live` — the product's single live accent, shipped in #1117 —
had no derivation to read.

## What Changes

### Calendar (`/calendar/:weekId`)

- **The lateral border carries the dominant zone.** `CardShell` takes
  `border-l-<zone|edge>`; the whole-card border stays neutral instead of being
  repainted by the same token. A session with no classifiable structure — a raw
  import, a coach plan that has not been expanded — keeps the neutral edge.
- **A zone-profile bar under each structured card's title**, 14 px in grid and
  20 px in list: the session's shape over time, not its aggregate. It is a new
  shared molecule (`ZoneProfileBar`) with a parameterised height, so the
  Library wave can mount the same component at 10 px.
- **The lifecycle becomes a word in a chip** (`Raw`, `Ready`, `Pushed`, …) or,
  on a matched session, the compliance percentage. The coloured glyph column
  (`⚠️` amber, `★` green) is retired: it duplicated the border and used the two
  hues the palette removed.
- **A week status bar** — done-and-matched / ready-not-pushed / needs-structure
  in three neutral steps, with the counts as text, hidden entirely when all
  three are zero (principle 2).
- **Six stacked banners collapse to one week-scoped action.** The raw-workout
  batch banner and the no-AI-key banner become mutually exclusive statements
  about the same fact, so the steady state renders at most one.

### Daily (`/daily`)

- **Today's session moves above readiness and energy.** The screen is named for
  a day; the day's session is what it is about.
- **`TrendsCard` folds into a link row** rather than a card competing with the
  cards that carry data.
- The `WeekStrip` keeps its glyph/size/opacity encoding and loses its
  `sky-*` literals; `HealthSourceBadge` keeps its provenance and its `↩`
  fallback marker and loses its raw greys.

### Empty states

- **`CalendarEmptyBanners` renders on a true first run.** `hasAnyWorkouts ===
false` now selects a first-run guide instead of selecting nothing: one
  ordered list of the three things that have to be true, each naming what stays
  broken while it is not, plus the escape hatch that needs none of them.
- **The three dependency banners are rewritten to name their consequence**, per
  principle 6, with the copy from the V2 screens.

### `--core-live` (closes #1118)

- The week's dominant zone is derived from the same classifier the cards use
  and set on the header mark's wrapper. A week with no classifiable session
  sets nothing, and the mark's core inherits ink — which is the correct
  rendering for an empty week, with no JavaScript branch.

### Repainting (#1121, this wave's share)

Every file this change touches moves its `slate-*` / `gray-*` utilities onto
role tokens.

## What is deliberately NOT built

- **A zone profile for a coach plan that has no KRD.** `CoachingActivity`
  carries a normalised `effort` 1–5 and no steps. Effort is an RPE, not a
  zone, and a bar drawn from it would be an invention. Unexpanded plans keep
  the neutral edge and the existing effort dots. This is the same rule as the
  raw session, stated once.
- **A new zone classifier.** `classifyTargetZone` / `timeInZone` already exist
  and are used by Workout Detail, Create Workout and Library. This change adds
  the two derivations that were missing — an ordered segment list and a
  dominant zone — beside them, and changes neither.
- **Zone data for range / `percent_max` / distance-based targets.**
  `classifyTargetZone` returns null for a `range` target on every metric and
  for `percent_max` heart rate, and `calculateStepDuration` returns null for a
  distance step. Those sessions get no bar and a neutral edge rather than a
  guessed one. Widening the classifier is a separate change with its own
  round-trip risk.
- **The `AutoMatchBanner`.** It is a decision surface (accept/reject a match),
  not a status banner, and it is already gated on a suggestion existing.
- **The 3-verb cut (Send · Keep · Download).** It is global and belongs with
  the editor.

## Capabilities

### Modified Capabilities

- `spa-calendar`: the meaning of the card's lateral border, the zone-profile
  bar, the week status bar, the one-action rule for week-scoped banners, and
  the first-run guide that replaces rendering nothing.
- `branding`: `--core-live` gains its derivation — the dominant zone of the
  displayed week — and the rule for the empty week is stated as a requirement
  rather than as a comment.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  port or adapter-package change; no dependency added; no Dexie version bump;
  no schema change.
- **Shared components touched**: `CardShell` (every calendar card variant plus
  Library and Workout Detail read it), `status-tokens`, `renderDayCards`.
  `ZoneProfileBar` is new and additive.
- **New `lib/workout-review` exports**: `zoneSegments`, `dominantZone`,
  `ZoneSegment`. `timeInZone` and `classifyTargetZone` are unchanged.
- **i18n**: new `calendar` groups (`lifecycle`, `weekStatus`, `firstRun`,
  `emptyWeek`, `noAiProvider`, `noBridges`) and one new `coaching.effortOf`
  key, in `en` and `es`; `daily.trends.subtitle` is dropped with the card it
  belonged to. `useTranslate` is a dictionary lookup, not i18next, so counted
  strings carry `_one` / `_other` and callers select through a new
  `i18n/plural-key.ts` rather than each picking its own rule.
  `resource-parity.test.ts` covers both locales.
- **Behaviour change**: a first run now renders a guide where it rendered
  nothing. No test id is removed; `empty-week-state`, `no-ai-provider-state`,
  `no-bridges-state` and `batch-processing-banner` keep their identities.
- **No changeset** — the SPA is private and outside the changeset-bot
  `PUBLISHABLE` set.
