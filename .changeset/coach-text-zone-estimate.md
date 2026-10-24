---
"@kaiord/workout-spa-editor": patch
---

The coaching dialog now estimates a zone profile from the coach's text when the plan has no structured workout to draw. The chart is captioned "Estimated from coach text", spans the coach's whole plan, and draws any span with no readable zone as a neutral grey bar. Text the estimator cannot read faithfully (distances, totals that do not reconcile, nested sub-steps) shows no chart.
