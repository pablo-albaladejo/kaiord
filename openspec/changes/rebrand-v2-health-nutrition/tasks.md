# Tasks

## 1. Token plumbing

- [x] 1.1 Map `--danger`, `--danger-text`, `--danger-bg` and `--danger-border`
      into `@theme` in `packages/workout-spa-editor/src/index.css` as
      `--color-danger*`, next to `--color-accent`. See design.md D1.
- [x] 1.2 Export `chart-theme.ts`'s private `readCssVar` as `readThemeColor`
      and restate the module comment: series strokes now resolve from roles
      too, so the "explicit hex constants on purpose" note is no longer true.
- [x] 1.3 Correct that module's two DOM-less fallbacks, which still carried the
      pre-foundation slate (`#64748b` / `#e2e8f0`) while claiming to mirror
      `:root`; update `chart-theme.test.ts` with them.
- [x] 1.4 Add `charts/uplot-base/series-strokes.ts`: an ordered **three**-step
      neutral ladder over the ink roles with `:root` fallbacks, exposed as
      `getSeriesStrokes()`, `seriesStroke(index)` and `SERIES_STROKE_STEPS`.
      Three and not four — see design.md D2 for the contrast table.
- [x] 1.5 Unit-test the ladder: distinct steps, order preserved, wrap, DOM-less
      fallback path, and that no step resolves to a chromatic value.

## 2. Charts stop using hue

- [x] 2.1 `health/trends/build-trend-chart-options.ts`: drop `STROKE =
    "#2563eb"`; each metric takes its own fixed ladder step (plus a dash when
      it wraps), so a metric's stroke does not shift as others are toggled.
- [x] 2.2 `health/labs/charts/build-lab-chart-options.ts`: drop the blue line,
      the red outlier and the three `rgba(37, 99, 235, …)` reference values.
      Line and outliers take two ladder steps (outliers additionally carry
      size-8 points and their own legend label).
- [x] 2.3 Extract the reference region's canvas colours into
      `charts/reference-band-style.ts`, derived from `--edge` via `color-mix`
      (the `--glass-bg` idiom) — `build-lab-chart-options.ts` was over its
      80-line cap otherwise.
- [x] 2.4 Localise the lab chart's `"Out of range"` series label — it reaches
      the legend, so it cannot stay a literal.
- [x] 2.5 `Nutrition/trends/energy-trend-metrics.ts`: six literal hues → six
      distinct (ladder step, dash) pairs, keeping the existing dash patterns as
      the second axis of discrimination.
- [x] 2.6 `charts/uplot-base/build-sparkline.ts`: `#2563eb` default → the
      ladder, resolved at call time; `Sparkline` gains `useTheme()` so a
      `.dark` flip rebuilds it.
- [x] 2.7 Update `build-trend-chart-options.test.ts` and
      `build-lab-chart-options.test.ts` for the new strokes, and pin the rules
      that matter: distinct steps, stroke stability across toggling, the dash
      on the wrapped series, and that no stroke is chromatic.

## 3. Health trends hub

- [x] 3.1 `TrendMetricSelector`: chips carry a lightness swatch matching their
      series (dashed swatch for the dashed series) and drop
      `border-blue-500 bg-blue-50 text-blue-700`.
- [x] 3.2 `TrendRangeSelector`: selected range is the filled control pair
      (`bg-accent text-surface`) inside a field-radius rail.
- [x] 3.3 `TREND_METRICS` gains `strokeStep`/`dash`; `TREND_RANGES` labels move
      to i18n keys, and the chart's axis/legend labels are localized in
      `TrendSingleChartCard` rather than baked into the constant.
- [x] 3.4 `TrendSingleChartCard`: card to `border-edge-soft bg-surface`, plus
      the V2 caption explaining lightness-not-hue under the canvas.

## 4. Health pages to the role dialect

- [x] 4.1 `HealthPageHeader`: roles, and render the sub-route strip.
- [x] 4.2 `health-sub-routes.ts`: the six-route table (per-metric hrefs still
      sourced from `WELLNESS_BADGE_ROUTES`) plus trailing-slash-tolerant exact
      matching. See design.md D3.
- [x] 4.3 `HealthSubRouteLinks`: six routes, `aria-current="page"` on the
      current one; `HealthDashboardPage` drops its own copy of the strip.
- [x] 4.4 `HealthSleepPage` + `SleepNightRow`: roles, plus the V2 row — date,
      proportional duration bar, duration, source badge.
- [x] 4.5 `format-sleep-duration.ts` + test: `totalDurationSeconds` → hours and
      minutes, and the bar percentage against a full night.
- [x] 4.6 `HealthRecoveryPage`, `HrvHistoryList`, `TodayStressList`: roles;
      `font-mono` (a retired token's utility) → `tabular-nums slashed-zero`.
- [x] 4.7 `HealthWeightPage`: roles, `bg-blue-50` body-composition card to the
      elevated surface, plus the V2 caption on what the weight feeds.
- [x] 4.8 `HealthActivityPage`: roles, the V2 caption and the "Open Nutrition"
      link.
- [x] 4.9 `HealthSourceBadge`: roles; the `↩` fallback marker is unchanged
      (principle 1).
- [x] 4.10 Extend `HealthSubRouteLinks.test.tsx`: six links, `aria-current`
      exactly once, the trailing-slash case, and that the hub is not marked
      current on a sub-route.

## 5. Labs

- [x] 5.1 `lab-flag-display.ts`: `className` becomes an ink level, add
      `showsGlyph`. See design.md D5.
- [x] 5.2 `LabFlagBadge`: render the glyph for `low`/`high`, muted text
      otherwise; no fill, no coloured border.
- [x] 5.3 `atoms/Icon/alert-icon.ts` + its `index.ts` re-export: the one
      "needs you" glyph, beside `ICON_MAP` rather than in it. See design.md D6.
- [x] 5.4 `LabParameterListItem` / `LabReportValueRow`: out-of-range emphasis
      moves from `border-red-300` to a lightness step; selection ring to
      `ring-accent`.
- [x] 5.5 `LabAiDraftBanner`: amber → elevated surface + alert glyph.
- [x] 5.6 `LabEntryPage`, `LabEntryForm`, `LabHistorySection`,
      `LabImportSection`, `LabLatestValues*`, `LabParameter*`, `LabReport*`,
      `WhoopImportButton`, `LabDashboardSection`, `LabParameterChart*`: roles.
- [x] 5.7 Destructive controls (`LabReportRow` confirm, `LabParameterRow`
      remove, `LabImportSection` cancel) to `--danger*` utilities.
- [x] 5.8 i18n the strings hardcoded in `LabLatestValuesList` and
      `LabLatestValuesSection`, plus the V2's typed-not-synced caption.
- [x] 5.9 Update `lab-flag-display.test.ts` for the new style shape and pin
      that no flag carries a hue.

## 6. Nutrition

- [x] 6.1 `MacroRing`: one ink arc for every macro; over target sinks the
      track a step and the label gains glyph + word. See design.md D4.
- [x] 6.2 The over label copy via i18n in both locales.
- [x] 6.3 `IntakeLoggerForm`: `bg-blue-600 text-white` → the control pair;
      `text-red-400` error → `text-danger-text`.
- [x] 6.4 `IntakeEntryRow` / `PresetRow`: `hover:text-red-400` →
      `hover:text-danger-text`.
- [x] 6.5 `EnergyRollupSummary`: emerald/amber net tones → a lightness step;
      the word already carries deficit vs surplus.

## 7. i18n

- [x] 7.1 `health.json` (en + es): `nav.trends`, `nav.labs`, `trends.range.*`,
      the trends caption, the sleep duration format, the weight and activity
      captions, `activity.openNutrition`.
- [x] 7.2 `labs-ui.json` (en + es): `latest.*`, the chart's out-of-range series
      label, `entry.typedNote`.
- [x] 7.3 `nutrition.json` (en + es): `macros.over`.

## 8. Verification

- [x] 8.1 `pnpm -r build` → exit 0.
- [x] 8.2 `tsc -b` on the SPA → exit 0.
- [x] 8.3 `eslint src` → 0 errors, 0 warnings; `prettier --check src e2e` clean.
- [x] 8.4 Every mechanical guard: theme-dialect, mkt-boundary, icons-distinct,
      architecture, no-library-dual-mount, no-unconditional-skip,
      discovery-clock-reset, allowlists-empty, session-match-id-shape,
      ai-sdk-containment, mapper/converter, archive×3, specs, specs-inventory,
      package-deps, scripts-orphans, build-portable, workflow-timeouts,
      overrides-stale, husky-no-bypass, ci-fanout, `test:scripts` (817 pass).
- [x] 8.5 `pnpm lint:specs` → 66 passed.
- [x] 8.6 Health, Nutrition, charts and Icon suites: 50 files / 250 tests pass.
- [x] 8.7 Grep both scopes: zero raw palette utilities, zero retired tokens,
      and the only remaining hexes are the documented DOM-less fallbacks.

> Not done here, and why: the two V2 attention banners and the struck-through
> fallback source name need a "stopped reporting at" timestamp the SPA does not
> record (proposal, design.md D7). `routes.test.tsx > /today` is flaky on a
> loaded machine — reproduced on an unmodified tree, mechanism reported to the
> wave lead — and belongs to whoever owns that test, not to this change.
