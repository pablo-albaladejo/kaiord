---
"@kaiord/workout-spa-editor": patch
---

The calendar, daily, goal, wellness and profile surfaces speak the active locale, with dates formatted by `Intl`, and lint fails on untranslated JSX text there. On a phone the "+" and chat buttons no longer cover navigation or content, the header is one row and the first run keeps "New workout" and the week on screen. The Inter font loads under `/app/`. A workout downloads from one control under a readable filename, "Save preset" stays available after adding an entry, trends span the requested window and a swim step shows pace per 100 m.
