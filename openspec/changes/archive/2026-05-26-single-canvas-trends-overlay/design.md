# Design — Single-Canvas Trends Overlay

## Phase 0 Outcome

The Phase 0 probe (logged in `.omc/research/uplot-axis-probe-2026-05-26.md`)
hit branch **0.A — auto-stacking works**. With four metrics on
`side: 1` and no explicit `gap`, uPlot 1.6.32 places axes at positions
**560 / 640 / 720 / 800** inside an 880 px canvas, leaving a 535 px plot
area. Axes are monotonic outward; there is no overlap. This eliminated
the need for branch **0.B** (custom `gap` per axis) and **0.C** (split
into 2 + 2 with one axis on each side).

The Phase 0.5 visual gate had the user load the prototype URL
(`?card=single` ternary on the page) and confirm the layout matches
their mental model. They confirmed before any predecessor file was
deleted.

## Decision

**Lane 3 — Multi-Y on one canvas, native units, packed right.**

One uPlot instance renders all selected metrics. The X axis (`side: 2`,
implicit) is time. Each selected metric contributes:

1. one entry in `scales` keyed by the metric key with `auto: true`;
2. one `axis` entry on `side: 1` with `scale: metric.key`, `label:
metric.label`, and a per-metric `values` tick formatter using
   `formatPaneValue`;
3. one `series` entry with the same scale key, `stroke: "#2563eb"`,
   and a `value` formatter for the live legend.

The component builds `data` from `useTrendSeries` by merging the
union of x-values across all present metrics and inserting `null` for
positions where a metric has no point on that x.

## Alternatives considered

- **Lane 1 — single normalized Y (0–100).** Rejected. Sleep score (0–100)
  shares the axis intent, but weight (≈ 70 kg) and HRV (≈ 50 ms) lose
  their physical meaning when normalized. There is no precedent in
  consumer-health UIs (Whoop, Oura, Apple Health) for hiding native
  units behind a normalized axis. The user explicitly insists on
  "in its own scale".
- **Lane 2 — dual-axis with hard cap N ≤ 2.** Rejected. The user
  articulated "sumando" (lines accumulating as metrics are toggled)
  which contradicts a hard 2-metric cap. Capping the selector below
  the existing 4-metric UI would be a regression.
- **Hybrid (normalized when N > 2, native when N ≤ 2).** Rejected as
  a mode-switch surprise: the same chart would mean different things
  depending on the selection count.
- **Stacked panes (the predecessor architecture).** Explicitly rejected
  by the user post-merge. The deep-dive trace
  (`.omc/specs/deep-dive-trace-single-canvas-trends-overlay.md`)
  established the user's mental model as line accumulation on one
  canvas, not pane stacking.

## Tradeoffs

- **T1 — ship velocity vs epistemic conservatism on a same-day
  reversal.** The predecessor merged at 19:48 UTC; the u-turn arrived
  at 20:36 UTC. We chose to ship rather than postpone because the
  Phase 0 probe and Phase 0.5 visual gate together produced enough
  signal to act. The follow-up F4 (Storybook + visual confirmation
  before merging volatile UI) captures the lesson.
- **T2 — AC6 (color discrimination) vs palette introduction.** Dropped
  AC6. A 4-color palette would require theme-aware tokens, contrast
  audits in light + dark, and accessibility review. The user accepted
  uniform `#2563eb` with axis + legend label discrimination.
- **T3 — OpenSpec wording: verbatim quote of predecessor vs paraphrase.**
  Chose paraphrase. The predecessor's wording mentioned `TrendOverlayCard`,
  panes, and `uPlot.sync`, none of which exist in the new architecture.
  A verbatim quote would obscure the actual replacement.
- **T4 — Phase 0 time-box.** The probe completed in one branch (0.A);
  no fallback to 0.B / 0.C was needed.

## Consequences

- **Uniform stroke `#2563eb` = harder line discrimination on the canvas.**
  Users must rely on axis position and the live legend to identify
  which line is which metric. Acceptable per user.
- **Mobile cramped at N = 4.** Four right-side axes (560 / 640 / 720 /
  800 px) leave a 535 px plot area on a 880 px canvas. On a 375 px
  mobile viewport the plot area drops below ergonomic thresholds.
  Acceptable per user.
- **No drag-to-reorder.** The canonical order from `TREND_METRICS`
  (`sleep` / `hrv` / `weight` / `steps`) is fixed. Anyone wanting a
  different visual order must adjust the constant.

## Follow-ups

- **F4 — Storybook + visual confirmation BEFORE merging volatile UI.**
  Both PRs #687 and #689 merged without an artifact the user could
  click through; the u-turn followed at 20:36 UTC. Future trends-area
  changes should ship a `*.stories.tsx` and a user-clickable URL
  before the spec is archived.

## Phase 0.5 outcome

User-confirmed visual gate; screenshots saved to
`.omc/research/single-canvas-screenshots-2026-05-26/`. The Phase 0.5
checkpoint cleared CONFIRMED_PROTOTYPE before any predecessor file
was deleted.
