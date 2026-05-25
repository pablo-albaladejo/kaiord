---
"@kaiord/workout-spa-editor": minor
---

Unify training and wellness in the calendar (TrainingPeaks model). Removes the Training/Health/Settings primary tab bar (`PrimaryNav`) — the header already exposes Calendar/Library/New/Settings, and a new "Trends" header entry opens the wellness hub. Each calendar day cell now shows a muted per-day wellness band (sleep, HRV, weight, steps) read via a single per-week live query, visually distinct from training cards; each badge drills down to its per-metric page. The Health dashboard is rebuilt into a uPlot-backed trends hub with metric multi-select and 30/90/365-day range selection (lazy-loaded, code-split off the calendar bundle). The four per-metric health pages are retained as drill-down detail.
