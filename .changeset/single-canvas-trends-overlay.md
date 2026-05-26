---
"@kaiord/workout-spa-editor": minor
---

Trends Hub now renders a single uPlot canvas with N native-unit Y axes packed on the right edge, replacing the stacked-panes architecture (the just-merged PRs #687 + #689). Lines accumulate on the same canvas as metrics are toggled; native units preserved per metric; no drag-to-reorder; no multi-instance sync. Uniform stroke `#2563eb` — line discrimination by axis label + legend label. Mobile layout accepted cramped at N=4. See `openspec/changes/single-canvas-trends-overlay/`.
