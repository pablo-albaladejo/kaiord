## Why

The coaching dialog's intensity thumbnail (`feat/calendar-modal-zone-profile`)
draws the zone profile of the linked workout's structured KRD. A coach plan that
has not been processed with AI has no KRD, so the dialog shows no chart, even
though the coach's text often states the shape outright: "Rodaje 12' z1 RPE 2-3,
5' en Z2, 4x(30sg fuerte + 60sg z1), R: 2'".

The repo deliberately refuses to derive a zone from an activity's `effort`
rating (`session-zones.ts`), because a 1–5 rating is not a zone. This change
does not overturn that rule. It reads only what the coach wrote, maps words
through one fixed table, draws what it cannot place as a neutral gap, and
labels the result "Estimated from coach text" so it never passes for a parsed
workout.

## What Changes

- A pure, deterministic estimator `estimateZoneProfile(text)` in
  `workout-spa-editor/src/application/coaching/` returns `{ zone, seconds }`
  segments (the shape the card and dialog already draw, with `zone: null` for
  a span the text gives no zone), or an empty array when the text does not
  support an estimate.
- The coaching dialog falls back to the estimate when the linked workout has
  no structured segments (or there is no linked workout) and the description
  has loaded. The chart then carries an "Estimated from coach text" caption
  (en/es) and its `aria-label` says it is an estimate.
- Cards, the week strip and the dominant-zone border are NOT changed: an
  estimate is shown only inside the dialog, next to the text it came from.

## Design

### D1. What the estimator reads

Durations: `12'`, `30"`, `30sg`/`30s`/`30 seg`, `5 min`/`minutos`, `1h`,
`1h30`, `90 minutes`, `1/2 h`, `media hora`, `3/4 h`. A range or an
alternative (`10/12'`, `entre 10 y 12'`, `40' o 50'`) takes the lower bound.
A pace (`4'30"/km`, `4:30 min/km`, `ritmo 5'/km`) and a time point
(`a los 30'`, `cada 45'`) are not spans. Distances (`1K`,
`400m`) cannot become time without a pace (see D3).

Zones, in order of precedence on one segment:

1. Explicit zone: `Z1`–`Z5`, `zona N`, `zone N`. A range (`Z2-Z3`)
   takes the lower bound, the same convention
   `parse-coaching-duration.ts` uses for duration ranges. A progression
   between two different zones (`progresivo de Z1 a Z4`, `de Z2 a Z3`,
   `hasta`) is not a range: the zone changes within the span, so it sets
   no zone. A zone named as a ceiling (`sin pasar de Z3`) is ignored.
2. RPE: `RPE 2-3` → lower bound, mapped 1–2→Z1, 3–4→Z2, 5–6→Z3, 7–8→Z4,
   9–10→Z5.
3. Intensity words, from one fixed table (en/es) that does not depend on the
   athlete:
   - Z1: rest, recovery, jog, easy, cool-down, warm-up, descanso,
     recuperación, trote, suave, cómodo, calentamiento, vuelta a la calma, and
     the `R: 2'` set-rest notation
   - Z2: endurance, aerobic, steady, resistencia, aeróbico, continuo
   - Z3: tempo, moderate, sweet spot, marathon pace, moderado, ritmo maratón
   - Z4: threshold, hard, umbral, fuerte
   - Z5: sprint, VO2max, max, all-out, máximo

Words whose zone changes within the segment (progresivo, contrastes,
fartlek) and `% FTP` (it needs the athlete's thresholds) set no zone, and
block the word table for that segment. An
effort word is a guess the coach did not write as a zone, which is why the
whole chart is labelled as an estimate.

### D2. Repeats

`4x(a + b)`, `3x10min Z4 + 2' Z1`, and a trailing `R: 2'` (rest between
repeats, not after the last) expand into one segment per step; consecutive
same-zone segments merge, as `zoneSegments` does for a KRD. An unbracketed
repeat takes the next step as its recovery when it is shorter than the work
and is not a warm-up or cool-down. An equal-length step is recovery only when
marked: paired by `/`, `between`/`entre`, a recovery word (trote, suave, rec,
easy, jog, rest, descanso), or a zone strictly lower than the work's
(`3x10' z4 + 10' z2` alternates); an unmarked equal step, or a `/` pair whose
only zone follows the second duration (`10x1'/1' z5`), gives no estimate. A trailing `xN` repeats the steps after the last
`then`/`luego`, or the whole chunk; more than two repeated steps is
ambiguous (see D3).

### D3. Gaps are drawn, not hidden

A timed segment with no zone is kept as an unknown segment (`zone: null`) and
drawn as a neutral grey bar of its true width, so the chart always spans the
whole plan. The estimate is empty, and the chart hidden, when no segment has a
zone, when the text has no timed segment, or when any segment is measured by
distance: a distance has no width without a pace, and dropping it would
shorten the session silently.

A headline (`Rodillo 1h: …`), a first-line summary (`Rodaje suave: …` over
the lines that follow) and a `total`/`en total` anywhere are stated totals,
never segments. Coaches round them, so a stated total reconciles when it is
within max(5 min, 15% of the stated total) of the breakdown. A first line that
restates a later repeat line names the main set and is dropped. A section word
(`Calentamiento:`, `Parte principal:`) makes a line a step, never a summary;
an intensity word in a title does not.

A chart that misstates the session is worse than none, so the estimate is
also empty when the text cannot be read faithfully: a stated total past that
tolerance, a timed step or repeat nested inside another step (`including`,
`de los cuales`, `the last 20'`, `60' z2 con 4x30"`) or placed by `after`, bracketed detail in a
different zone from its span, a zone both before and after one duration
(`Z3 15' Z1 20'`), a repeat count the grammar does not consume
(`3 veces 2'`), a trailing `xN` over more than two steps, more than 300
segments, more than 6 h, more than 4000 characters, or brackets nested more
than three deep.

`ZoneProfileBar` accepts an unknown segment and paints it with a neutral role
(no raw chromatic utility); its title and the chart's aria label name it
"no zone given". Structured KRD profiles never contain one.

### D4. Where it runs

The estimator is pure and lives in `application/`, so it imports nothing
outside the domain. The dialog calls it through a small hook memoised on the
description string. Nothing is persisted: an estimate is recomputed from the
text each time and disappears once the plan is processed with AI.

## Impact

- `packages/workout-spa-editor`: new estimator + tests, dialog fallback,
  caption, two i18n keys per locale.
- Depends on `feat/calendar-modal-zone-profile` landing first (the dialog
  chart it extends).
- Spec: `spa-calendar` gains one requirement.
