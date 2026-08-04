# Design · Rebrand V2 Health and Nutrition

Layer: presentation only (`packages/workout-spa-editor/src/components`,
`src/i18n`) plus four additive `@theme` lines in `src/index.css`. No port, no
use case, no adapter, no schema.

## D1 · Why the danger role needed a Tailwind mapping rather than an arbitrary value

`styles/brand-tokens.css` declares `--danger`, `--danger-text`, `--danger-bg`
and `--danger-border` in **both** role blocks, so the tokens already adapt per
theme. What was missing was the `@theme` mapping that turns a role into a
Tailwind utility — the same mapping `--color-accent`, `--color-edge*` and
`--color-ink-*` already have.

Two alternatives were rejected:

- **Arbitrary values** (`text-[color:var(--danger-text)]`) at each of the five
  destructive call sites. Correct at runtime, but it re-establishes the raw
  dialect the theme guard exists to remove, and it cannot be grepped as a role
  consumer.
- **A new token.** Nothing is missing from the role layer; adding one would
  violate the tokens file's own instruction that a missing name is added to
  both role blocks, not invented at the component.

The mapping is therefore additive and mechanical, and the `--danger*` roles
stay reserved for destructive controls (branding delta, last scenario) — not
for marking a lab value bad.

## D2 · Resolving the stroke ladder at call time, not at module load

`chart-theme.ts` already reads `--ink-muted` and `--edge` from
`document.documentElement` on every `themedAxis()` call, precisely so a
`.dark` toggle is picked up without a rebuild of the module. The series ladder
follows the same shape: `series-strokes.ts` calls `readThemeColor` per
`getSeriesStrokes()` invocation, and every options builder is already inside a
`useMemo` keyed on `resolvedTheme`, so a theme flip rebuilds the options and
re-reads the ladder.

`readCssVar` was private to `chart-theme.ts`. It is exported as
`readThemeColor` rather than duplicated, so there stays exactly one
SSR/non-DOM fallback path.

**The ladder is three steps, not four.** The obvious fourth rung is
`--text-disabled` (exposed as `--edge-strong`), and it does not clear the bar:
on the light theme it resolves to n-400 `#b6b6b6`, which is **2.1:1** on the
card surface — under the 3:1 floor WCAG 1.4.11 sets for a graphical object. A
lone series drawn on it would be the only thing on the canvas and unreadable.
The three rungs that ship clear 4.7:1 in both themes:

| Rung           | Light (on `--bg-surface`) | Dark (on `--bg-surface`) |
| -------------- | ------------------------- | ------------------------ |
| `--ink-strong` | `#303030` · 11.6:1        | `#ffffff` · 18:1         |
| `--ink-body`   | `#5b5b5b` · 6.6:1         | `#d4d4d4` · 11:1         |
| `--ink-muted`  | `#747474` · 4.7:1         | `#909090` · 5.2:1        |

So a surface with more series than rungs needs a second channel, and each of
the three consumers already has one: the health hub's fourth metric (`steps`)
wraps onto rung 0 with a dash; the nutrition chart's six series are six
distinct (rung, dash) pairs across four scales; the lab chart's outliers take
rung 0 against the line's rung 1 _and_ carry point marks and their own legend
label.

Fallbacks mirror the `:root` (light) values of the ink roles, matching the
convention `chart-theme.ts` documents for its own two fallbacks — which were
themselves stale (`#64748b` / `#e2e8f0`, the pre-foundation slate) and are
corrected to the values the roles actually resolve to.

## D3 · Where the sub-route strip lives

The strip is rendered by `HealthPageHeader`, which all six pages already use.
The alternative — adding `<HealthSubRouteLinks />` to each of the six page
bodies — repeats the same JSX six times and lets a seventh page forget it.

Three constraints shaped it:

- **One heading per route.** The strip is a `<nav>` of `<Link>`s; it adds no
  heading, so the `[data-route-heading]` contract (one element, focused on
  mount) is untouched. It renders _after_ the `<h1>` in DOM order for the same
  reason.
- **The current route is state, not a destination.** The active link keeps its
  `href` (so it is still a link) and carries `aria-current="page"`; it is not
  swapped for a `<span>`, which would move focus order between routes.
- **No content import.** The strip links by URL only, satisfying the
  no-dual-mount invariant the way the calendar wellness band does.

Route matching normalises a single trailing slash, mirroring `health-routes.tsx`
so `/health/` marks Trends rather than nothing. Trends must match exactly —
a `startsWith` test would mark it current on every sub-route.

## D4 · What the "over" state on a macro ring is allowed to say

`macro-rings-view-model.ts` already computes `over` and already clamps
`fraction` to `[0, 1]`, so a full arc is ambiguous between "exactly at target"
and "over". The V2 resolves that by sinking the _track_ one lightness step on
the over ring (`--edge-strong` instead of `--ring-track`) and putting the
statement in the label: glyph + `<macro> · over`. Reading order therefore is
label-first, which is the only channel that survives greyscale, low vision and
the four-ring row being scanned at 58 px.

The view model is unchanged — this is entirely a rendering decision, and the
existing `macro-rings-view-model.test.ts` assertions on `over` still hold.

## D5 · Lab flags: what happens to `LAB_FLAG_STYLES`

The map keeps its shape (`Record<LabFlag, LabFlagStyle>`) and its
`isOutOfRange` companion so `LabParameterListItem` and `LabReportValueRow`
need no logic change. What changes is the value: `className` stops carrying a
fill and becomes the ink level, and a `showsGlyph` flag says whether the badge
draws the alert icon. `low`/`high` get the glyph; `in`/`unknown` do not.

The `label` field is retained: `lab-flag-display.test.ts` pins it non-empty,
and it is the English fallback for a caller with no `t`. `LabFlagBadge`
continues to render `t('flag.<flag>')`, so the visible copy stays localised.

## D6 · Why the alert glyph is not in `ICON_MAP`

The V2 says a state that needs the user is an icon plus a phrase, so three
surfaces here need one glyph: the lab flag, the AI-draft banner, and the
over-target macro ring. The natural home is `ICON_MAP.alert`.

`icon-map.ts` is at exactly its 80-code-line cap, and one more icon needs two
lines (the `lucide-react` specifier and the map entry). The options were to
split that map — a hot shared file seven other screen waves are also editing —
or to put the glyph beside it. It goes beside it, as `atoms/Icon/alert-icon.ts`
exporting `ALERT_ICON`, the same shape `sport-icon-name.ts` already uses: a new
file cannot conflict textually with another wave's `ICON_MAP` entry, whereas
both a split and a new entry would.

The trade is that the glyph is referenced directly instead of through the
`IconName` union. That union exists so a _name_ can be threaded through data
(nav destinations, segmented options); this glyph is never chosen by name, so
it loses nothing. If a later wave does add `ICON_MAP.alert`, `ALERT_ICON`
should fold into it and this file should go.

## D7 · The two V2 banners that are not shipped

Health V2 opens Trends and Recovery with an attention card:

> HRV and Sleep have no data since 25 July · WHOOP was the priority source for
> both and its session expired 3 days ago. Garmin is covering Sleep; nothing
> covers HRV.

Every clause needs state the SPA does not hold: the date a source stopped
reporting a given data type, and the date the fallback took over. Health
records carry `sourceBridgeId` per row and the resolver carries a boolean
`usedFallback` — enough to say _which_ source a row came from and _that_ it
was a fallback, which `HealthSourceBadge` already does. It is not enough to
say _since when_, and a banner that guesses the date is worse than no banner
(principle 6: the error names its consequence, which means it has to be true).

Same reason for the struck-through `WHOOP → Garmin` source cell in the V2's
sleep list. The `↩` marker ships; the transition date does not.
