# Tasks

## 1. SPA converter route

- [x] 1.1 `routing/convert-params.ts` (+ tests): `from`/`to` validation,
      `garmin` alias, `krd` not a source, same format rejected.
- [x] 1.2 `ConvertPage` (lazy) with local state, `workout-imported` and
      `workout-exported` events, a format picker for invalid parameters.
- [x] 1.3 `/convert` in `AppRoutes.tsx` behind `guard`, `route-segments.json`,
      EN/ES strings, `FORBIDDEN_LAZY_SOURCES`.
- [x] 1.4 e2e: cold visit, isolation from the open workout and Dexie, picker.

## 2. Docs

- [x] 2.1 Scope callout and deep links on the 12 converter pages and the
      index; "Workouts vs. activities" section.
- [x] 2.2 Three athlete guides in EN and ES; `es/index.md`. Zwift-to-Garmin
      guide deferred to #1279.
- [x] 2.3 `es` locale, `i18nRouting: false`, athlete sidebar, hreflang from
      `HREFLANG_PAIRS`.
- [x] 2.4 Guards: switcher anchors (and their presence on every docs page) in
      `check-site-links`, `<html lang>` and hreflang in the dist test, no
      `CONFIRMAR` in the dist, pairs on disk, Spanish cspell.

## 3. Landing

- [x] 3.1 Guides block with `data-es-href`, ES strings, `llms.txt`.
