# Rebrand V2 · Health and Nutrition

## Why

`/health/*` is the corner of the SPA the token work never reached. Its 33
component files paint with raw Tailwind — `border-gray-200`, `text-gray-600`,
`bg-blue-50`, `bg-amber-100`, `border-red-300` — so the surfaces stay
slate-blue while the chrome around them is on the achromatic V2 palette
(#1121). Three of those raw hues are worse than merely off-palette:

| Raw hue                                                      | What it collides with                  |
| ------------------------------------------------------------ | -------------------------------------- |
| `#2563eb` chart stroke (×3 files)                            | 5° from `--zone-2` — "easy endurance"  |
| `#dc2626` lab outlier points                                 | ~0° from `--zone-5` — "maximal effort" |
| `amber-*` lab draft banner, `#fbbf24` over-target macro ring | `--zone-4` — "threshold"               |

A health chart is not a training zone, so a health series painted in a zone
hue asserts an intensity it has no way to mean. The five hues are reserved
(README "Colour semantics"): **chart series are told apart by lightness and
label, not hue.**

The same rule removes the two colours the palette deliberately has no token
for. There is no success and no warning role — a lab value outside its range
and a macro ring over target were saying so in amber/green/red, which is both
off-palette and, at `amber-100`/`green-100`, a 2:1 signal. Principles 2 and 6:
say nothing when all is well, and when something needs the user, name it with
an icon and a word.

Separately, `HealthSubRouteLinks` lists four of the six routes the Health Hub
has. `/health/labs` and the `/health` trends dashboard are reachable only by
typing the URL or by clicking a calendar wellness badge — a page with no
in-app entry point.

## What Changes

- **Every `/health/*` file moves to the role dialect.** 33 files; the raw
  `bg|text|border|divide-slate|gray-N` utilities in them go to `bg-surface*`,
  `text-ink-*`, `border-edge*`, `text-accent`. The same pass covers the five
  `pages/Nutrition/*` files still carrying raw utilities.

- **`--danger*` is exposed to Tailwind.** The role layer has had
  `--danger`, `--danger-text`, `--danger-bg` and `--danger-border` since the
  foundation, but no `@theme` entry, so destructive affordances (lab report
  delete confirmation, intake/preset row removal) had to reach for
  `red-300`/`red-700`/`red-400`. Four `--color-danger*` lines in
  `src/index.css` close that gap. No new token — only the Tailwind mapping of
  tokens that already exist in both role blocks.

- **Chart series are re-cut on lightness.** A shared three-step neutral ladder
  (`--ink-strong` → `--ink-body` → `--ink-muted`, resolved live so it follows
  `.dark`) replaces the literal hues in `build-trend-chart-options.ts`,
  `build-lab-chart-options.ts`, `energy-trend-metrics.ts` and
  `build-sparkline.ts`. Three and not four because the next ink role down is
  2.1:1 on the light card — under WCAG 1.4.11's floor for a graphical object —
  so a series that wraps takes a dash instead. The trends metric chips carry
  the same rung and dash as their series, so the legend and the canvas agree.

- **Out-of-range says it with an icon and a word.** `LAB_FLAG_STYLES` loses
  its green/amber/red classes: `low`/`high` render an alert glyph plus the
  translated flag on `--text`, `in`/`unknown` render as muted text. The row
  border shifts a lightness step instead of turning red. The AI-draft banner
  drops amber for the elevated-surface + glyph treatment the V2 uses.

- **The macro rings read without colour.** One ink arc on a neutral track for
  all four macros; the one that is over target sinks its track a step and says
  `⚠ Fat · over` in its label. `--ring-track` (already declared for
  `ReadinessRing`) is the track.

- **All six health routes become reachable.** `HealthSubRouteLinks` becomes a
  six-tab strip (Trends · Sleep · Recovery · Weight · Activity · Labs)
  rendered by `HealthPageHeader`, so it is present on every `/health/*` page
  and marks the current one with `aria-current="page"`.

- **The V2's explanatory copy lands**, via i18n in `en` and `es`: why the
  chart uses lightness, what Weight feeds, what the three Activity figures
  feed (with an "Open Nutrition" link), and why Labs carries an entry date
  rather than a bridge name. Sleep rows gain the V2's proportional duration
  bar and duration figure, derived from `totalDurationSeconds`.

**Deliberately NOT shipped**, because no state backs the claim: the V2's two
attention banners ("HRV and Sleep have no data since 25 July", "Nothing has
reported HRV for 3 days") and the struck-through fallback source name with the
date it started. Both need a per-data-type "stopped reporting at" transition
timestamp, which nothing in the SPA records — the same gap the Connections
proposal named. `HealthSourceBadge` keeps its `↩` fallback marker, which _is_
backed.

Out of scope: `Daily/**` (wave A owns it) even though it shares
`HealthSourceBadge`; the Health V2's weight sparkline card; the Nutrition V2's
inline "usuals" quick-log row.

## Capabilities

### Modified Capabilities

- `branding`: adds the data-series colour policy — what the five zone hues are
  reserved for, how a non-zone series is distinguished instead, and the rule
  that a state needing the user is named rather than tinted.
- `spa-routing`: the Health Hub is six routes, not five, and every one of them
  is reachable from a strip present on all of them.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only, plus four
  additive lines in `src/index.css`. No domain, application-port or adapter
  change; no dependency added; no Dexie version bump.
- **Shared code touched**:
  - `charts/uplot-base/chart-theme.ts` exports its private `readCssVar` as
    `readThemeColor` so `series-strokes.ts` resolves role tokens the same way,
    and its two DOM-less fallbacks are corrected from the pre-foundation slate
    (`#64748b` / `#e2e8f0`) to the values `--ink-muted` / `--edge` now resolve
    to. `themedAxis` behaviour is otherwise unchanged.
  - `charts/uplot-base/Sparkline.tsx` gains `useTheme()` so its default stroke
    follows the ladder across a `.dark` flip, matching what
    `LabParameterChart` and `TrendSingleChartCard` already do. That makes a
    `ThemeProvider` a mount requirement for it; its only consumer is the lab
    list, whose test is wrapped accordingly.
  - `atoms/Icon/index.ts` re-exports the new `ALERT_ICON` (see design.md D6 —
    `icon-map.ts` itself is untouched, deliberately).
- **i18n**: no new namespace. Keys added to `health`, `labs-ui` and
  `nutrition` in both locales; `resource-parity.test.ts` covers them.
- **e2e / test ids**: none renamed. `health-sub-route-links` keeps its
  identity and grows from four links to six.
- **Foreseeable merge conflicts with sibling waves**: `src/index.css`
  (`@theme` block), the `en`/`es` locale JSONs, and `atoms/Icon/index.ts` if
  another wave also needs an alert glyph.
- **No** changeset — the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set.
