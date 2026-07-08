> Status: foundation + locale-preference domain + pilot dictionaries landed and
> green (sections 1, 2, 3, 7.1/7.3/7.4, 8, 4.1). Remaining: SPA runtime wiring
> (provider/switcher), formatters, error mapping, labs live-locale rendering,
> full quality gates (sections 4.2–4.4, 5, 6, 7.2, 9).

## 1. `@kaiord/i18n` package (mechanism)

- [x] 1.1 Scaffold `packages/i18n` (`private: true`, tsconfig, tsup, vitest). CI matrix wiring deferred to task 9 (package builds/tests locally via pnpm).
- [x] 1.2 Create `src/types.ts`: `Locale = "en" | "es"`, `DEFAULT_LOCALE`, `SUPPORTED_LOCALES`, resource types, `isSupportedLocale`, `normalizeLocale`.
- [x] 1.3 Create `src/create-translator.ts`: `createTranslator({ locale, resources })` over an isolated i18next `createInstance` (synchronous `initAsync: false`), returning `{ t, locale, instance }`.
- [x] 1.4 Write `create-translator.test.ts`: active-locale resolve; missing `es` key falls back to `en`; unsupported locale → `en`; interpolation; instance isolation.
- [x] 1.5 Create `src/resource-parity.ts`: `findParityViolations(en, es)` returning missing/extra key paths per namespace; nested-namespace unit tests.

## 2. Core: stable validation error codes

- [x] 2.1 Add optional `code` to `ValidationError` in `@kaiord/core` (additive).
- [x] 2.2 `map-zod-errors.ts`: derive `code` from an explicit `params.code` (custom refinements) else the native Zod issue code; `min_gt_max` (range refinements ×4), `duration_type_mismatch`/`target_type_mismatch` (workout-step).
- [x] 2.3 Unit tests: explicit code wins over native; native fallback; code stable across message rewording; `min_gt_max` surfaced end-to-end from an inverted power range (proves Zod v4 `params` propagation).
- [x] 2.4 Changeset for `@kaiord/core` (minor, additive).

## 3. SPA: locale preference (spa-user-preferences delta)

- [x] 3.1 Extend `UserPreferences` with `locale: "auto" | "en" | "es"` (optional; absent reads as `auto`; no Dexie version bump).
- [x] 3.2 Persist `locale` through the existing `setUserPreferenceFields` partial-patch use case (added `locale` to the patch Pick + merge), which already does lazy creation, profile-existence check, injected clock, and field-merge. (No bespoke `setLocale`; the generic patch is the current idiom and preserves other fields — spec delta updated to match.)
- [x] 3.3 Add `resolveLocale(preference, navigatorLanguage)` pure helper (`auto` + `es*` → `es`, otherwise `en`; explicit value wins); unit tests.

## 4. SPA: i18n wiring

- [x] 4.1 Create `src/i18n/`: `resources.ts` (namespaces per locale from JSON), `i18n.ts` (react-i18next instance + `setActiveLocale` updating `<html lang>`).
- [ ] 4.2 Add a `useLocaleSync` hook + mount it under a provider in `App.tsx`: read the active profile's preference via `useLiveQuery`, `resolveLocale`, `setActiveLocale` on change. Test: switch re-renders consumers and updates `lang`.
- [ ] 4.3 Add the language switcher to `SettingsPanel/PreferencesTab` (Auto / English / Español) wired through `useSetUserPreferenceFields({ locale })`; UI tests.
- [ ] 4.4 e2e: pin locale explicitly in Playwright config/fixtures so existing English assertions stay deterministic.

## 5. SPA: locale-aware formatting

- [ ] 5.1 Replace hardcoded `"en-US"` with the active locale in `pages/health/trends/format-pane-value.ts`, `molecules/TemplatePickerDialog/format-date-label.ts`, `pages/DateBanner.tsx` (inject locale from the i18n context).
- [ ] 5.2 Unit tests: the three formatters honor an `es` locale and default to `en`.

## 6. SPA: upstream error mapping

- [ ] 6.1 Map converter error **classes** to dictionary keys in `import-workout-errors.ts:transformError` / `file-parser-error-builders.ts`; unknown class → upstream English message.
- [ ] 6.2 Map `ValidationError.code` to dictionary keys in `ValidationErrorList`; codeless entries → upstream message.
- [ ] 6.3 Map the two `@kaiord/ai` input-validation failures by class/code in the AI-generate flow.
- [ ] 6.4 Unit tests: known class/code → `es` copy; unknown → verbatim English; assert branching on class/code, never message text.

## 7. Pilot: `labs` namespace (en + es)

- [x] 7.1 `locales/en/labs.json` from the display map + `locales/es/labs.json` seeded from the pre-#863 `nameES` catalog (`git show d2276ad1^`); abbreviations extracted to a language-neutral `lab-abbreviations.ts`.
- [ ] 7.2 Wire the active locale through to the labs UI so names render in `es` at runtime. (Done so far: `getLabParameterDisplay(key, locale)` sources names from the dictionary and takes a locale, defaulting to `en` — non-breaking; remaining: thread the active locale into `lab-parameter-options.ts`/`lab-parameter-label.ts` and their component consumers via a hook.)
- [x] 7.3 Wire the en/es parity test (`src/i18n/resource-parity.test.ts`) over all SPA namespaces.
- [x] 7.4 Existing labs tests run under `en` (unchanged) + `es` smoke tests (Spanish name renders; abbreviation identical across locales).

## 8. Guard: R-PIIInterpolation

- [x] 8.1 Update `scripts/check-no-pii-leakage.mjs`: accept a toast first arg that is `t("literal")` / `i18n.t("literal")` (with optional interpolation params); dynamic keys and template literals remain violations; `console.*` rules unchanged.
- [x] 8.2 Update `scripts/check-no-pii-leakage.test.mjs`: accepted (`t("a.b")`, `t("a.b", { count })`, `i18n.t(...)`) and rejected (`t(key)`, ``t(`a.${x}`)``) forms.

## 9. Quality gates

- [ ] 9.1 `pnpm -r build` green (core before SPA), `pnpm -r test` 100% pass, coverage ≥80% (`@kaiord/i18n`) / ≥70% (SPA). (So far: `@kaiord/i18n` 13/13, core 489/489, PII guard 18/18, touched SPA tests green, SPA `tsc --noEmit` clean.)
- [ ] 9.2 `pnpm lint` clean across the repo (ESLint `--max-warnings=0`, tsc, Prettier, `pnpm lint:specs`, `pnpm test:scripts`); 100-line/40-line caps respected. Add `@kaiord/i18n` to the CI matrices.
- [ ] 9.3 Verify end-to-end with the running SPA: switch Auto/English/Español → labs names, date banner, and a forced import error render localized; reload persists the choice.
