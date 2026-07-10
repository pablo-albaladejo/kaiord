---
"@kaiord/workout-spa-editor": minor
---

Make light mode consistent across the whole editor. A theme-adaptive semantic
token layer (light defaults on `:root`, dark overrides under `.dark`) now backs
the `bg-surface*` utilities and new `text-ink-*`, `border-edge*`, and
`text-accent` utilities, and the redesign page families (Daily, Nutrition,
Create, Workout Detail, Athlete, Library, Chat) plus shared atoms and the
bottom navigation are migrated off the dark-only slate dialect. `color-scheme`
now follows the active theme so native controls match; the previously unmapped
`text-muted-foreground`/`bg-primary` semantic utilities resolve to real colors;
uPlot chart axes/grids react to theme changes; the mobile header collapses to a
slim bar (BottomNav owns primary navigation) and the 768px header wrap is
fixed. A new mechanical guard (`pnpm lint:theme-dialect`) pins the adaptive
dialect going forward.
