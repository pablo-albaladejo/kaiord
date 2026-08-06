---
"@kaiord/workout-spa-editor": patch
---

Move workout creation from the header to each route's own action row. The nav registry grows a `page` surface (reachable from the route, not the shell): the header drops its New workout entry and special-casing, and a shared `CreateWorkoutCta` (the `cta` magenta variant, hidden below `md` where the create FAB already covers it) lands on the calendar nav row, the Daily header and the Library filters — each carrying its route's origin so closing the editor returns where creation started. The editor's Send to Garmin and the chat composer's Send switch to the `cta` variant as their surfaces' primary actions; Athlete, Settings and Health deliberately get no magenta.
