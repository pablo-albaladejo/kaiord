> Completed: 2026-10-11

# Proposal: A Spanish, phone-sized and polished SPA, with a guard on untranslated text

## Why

The 2026-10-10 journeys audit found surfaces that still spoke English to a
Spanish athlete, mobile controls that covered each other, and a few rough
edges in export, nutrition and trends:

- Calendar day headings and the daily week strip formatted dates by hand in
  English (F-02); the energy-balance card, the goal dialog, the wellness
  dialog, the profile manager and "Manual Entry" were partly untranslated
  (F-35, F-39, F-46b). Nothing stopped the next English literal.
- On a phone the "+" button covered "Biblioteca" (F-44), the first run pushed
  "Nuevo entreno" and the week below the fold (F-46), and the header took two
  rows (F-47). At 768 px the chat button covered Sunday's "+ Add".
- The Inter font was requested under the old `/editor/` base and failed
  (F-03). Downloading a workout needed two controls (F-15) and wrote accented
  letters as underscores (F-16). "Save preset" turned off right after adding
  an entry (F-38). A trends chart spanned only the days with data, not the
  window asked for (F-36). A swim step card showed pace per km.

## What Changes

- Dates are formatted with `Intl` in the active locale; the listed surfaces
  are translated. An ESLint rule fails on JSX text that is not a translation
  in the directories this work translated.
- Mobile: the "+" button sits clear of the bottom nav, the first run is
  compact, "Nuevo entreno" and the week fit the first screen, the header is
  one row of at most 64 px, and the chat button reserves space below the
  calendar's last row.
- The font is served under the deploy base; a script checks every absolute
  CSS `url()` of a build resolves to a file it ships.
- One control downloads a workout in the chosen format, and the toast names
  the file ("Descargado como …"); filenames transliterate accents (NFD).
- "Save preset" stays available for the entry just added.
- A trends chart's x axis spans the requested window.
- A swim step card shows pace per 100 m (or 100 yd).
- F-18 (library card "0 m"): the WP0 baseline did not reproduce it beyond the
  zero TSS that PR5 already hides, so no redesign is made.
- F-39 (goal dialog start-weight prefill): not reproducible; a regression
  test pins the prefill.

## Impact

- `@kaiord/workout-spa-editor` only. No schema or Dexie change.
- `verify:prod --only i18n-scan,mobile,trends` asserts the findings against a
  build; the `check-css-asset-urls` step runs in CI and in the site deploy.
