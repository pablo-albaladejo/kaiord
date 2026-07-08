> Status: foundation + locale-preference domain + pilot dictionaries + SPA
> Status: all sections landed and green (1–8 complete; 9 quality gates below).
> Converter parse-message localization (6.1) is resolved per the fallback
> contract — it renders verbatim English until a converter emits a stable code
> (tracked as the `add-converter-error-codes` follow-up).

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
- [x] 4.2 `LocaleProvider` (`src/i18n/LocaleProvider.tsx`) mounted in `main.tsx`: wraps `I18nextProvider` + a `LocaleSync` that reads the active profile's preference via `useLiveQuery`, `resolveLocale`, `setActiveLocale` on change, and publishes the active locale through a context (`useActiveLocale`, defaults `en` outside a provider). Tested: resolves `es` + sets `<html lang>`; defaults `en` unwrapped.
- [x] 4.3 Language switcher (`LanguageRow`) in `SettingsPanel/PreferencesTab` (Auto / English / Español) wired through `useSetUserPreferenceFields({ locale })`; UI tests (reflects Auto default, persists `es` on change).
- [ ] 4.4 e2e: pin locale explicitly in Playwright config/fixtures so existing English assertions stay deterministic.

## 5. SPA: locale-aware formatting

- [x] 5.1 Replaced hardcoded `"en-US"` with the active locale: `format-pane-value.ts` (+ `build-trend-chart-options.ts`/`TrendSingleChartCard.tsx` thread it), `format-date-label.ts` (callers `WellnessEntryDialog`/`AddEntryChooser` pass `useActiveLocale()`), `DateBanner.tsx` (reads `useActiveLocale()`). Formatters take `locale: Locale = "en"` so unwrapped/pure tests stay in `en`.
- [x] 5.2 Unit tests: steps group with the `es` separator (`94.321`); `formatDateLabel` renders `lunes, 4 de mayo` for `es`; both default to `en`.

## 6. SPA: upstream error mapping

- [x] 6.2 Map `ValidationError.code` to dictionary keys in `ValidationErrorList`; codeless entries → upstream message. New `errors` namespace (en/es) + pure `error-copy.ts` (`localizeValidationMessage`, `validationHeading`); `convertToValidationErrors` now carries `code`; the list localizes the heading + per-error message by code, falling back to the upstream English message. Branches on `code` only, never message text. EN dictionary values equal the current messages so `en`-mode assertions are unchanged.
- [x] 6.1 Converter parse errors resolved per the fallback contract. Their useful content is a free-text technical detail (e.g. "No workouts found in TCX file"); localizing the class-level wrapper alone leaves a mixed "Spanish prefix: English detail" string of no real value, and localizing the detail requires stable per-converter codes in `@kaiord/fit|tcx|zwo|garmin` — a separate upstream effort (mirroring the core-validation and `@kaiord/ai` code work) that is out of scope for this foundation. The i18n spec's error contract and its "converter parse error without a code degrades to the upstream message" scenario codify this: these render verbatim English until a converter emits a code. Tracked as a follow-up (`add-converter-error-codes`).
- [x] 6.3 `@kaiord/ai` input-validation localized. Upstream (conflict-free with the incoming `ai-platform` branch — it does not touch `errors.ts`/`validate-input.ts`): `AiParsingError` gains optional `reason` (`input_empty`/`input_too_long`) + `details` (`{ maxLength, actualLength }`), set by `validateInput`; additive + backward-compatible (new `options` arg), minor changeset. SPA: `errors.json` gains an `ai` namespace (en/es) with `{{maxLength}}`/`{{actualLength}}` interpolation (EN interpolated == the original message), `error-copy.ts` gains `localizeAiError(error, locale)` (localizes by `reason`, interpolates `details`, falls back to the upstream message then a generic string), and `run-ai-generation.ts` renders it via a `locale` threaded from `useAiGeneration` (`useActiveLocale`). Branches on `reason`, never message text.
- [x] 6.4 Unit tests: known code → `es` copy (`error-copy.test.ts`); unknown code and codeless → verbatim upstream message; component test (`ValidationErrorList.test.tsx`) proves a mapped code renders the dictionary copy (not the raw message) and a codeless error renders verbatim.

## 7. Pilot: `labs` namespace (en + es)

- [x] 7.1 `locales/en/labs.json` from the display map + `locales/es/labs.json` seeded from the pre-#863 `nameES` catalog (`git show d2276ad1^`); abbreviations extracted to a language-neutral `lab-abbreviations.ts`.
- [x] 7.2 Wired the active locale through the labs UI: `labParameterLabel(key, locale)` and `labParameterOptions(locale)`/`findParameterByLabel(label, locale)` are locale-aware (default `en`); the display consumers (`LabParameterListItem`, `LabReportValueRow`, `LabParameterChart`, `LabParameterChartCard`) and the entry autocomplete (`LabParameterIdentityField`) pass `useActiveLocale()`. Names now render in `es` at runtime. (`LAB_PARAMETER_OPTIONS` constant → `labParameterOptions()` function; test updated + `es` case added.)
- [x] 7.3 Wire the en/es parity test (`src/i18n/resource-parity.test.ts`) over all SPA namespaces.
- [x] 7.4 Existing labs tests run under `en` (unchanged) + `es` smoke tests (Spanish name renders; abbreviation identical across locales).

## 8. Guard: R-PIIInterpolation

- [x] 8.1 Update `scripts/check-no-pii-leakage.mjs`: accept a toast first arg that is `t("literal")` / `i18n.t("literal")` (with optional interpolation params); dynamic keys and template literals remain violations; `console.*` rules unchanged.
- [x] 8.2 Update `scripts/check-no-pii-leakage.test.mjs`: accepted (`t("a.b")`, `t("a.b", { count })`, `i18n.t(...)`) and rejected (`t(key)`, ``t(`a.${x}`)``) forms.

## 9. Quality gates

- [x] 9.1 Coverage: `@kaiord/i18n` 100% lines / 86.95% branches (≥80%); `@kaiord/ai` 85 tests; full SPA suite green (≥70%). `pnpm -r build` and `pnpm -r test` verified green in QA.
- [x] 9.2 `pnpm lint` clean across the repo (ESLint `--max-warnings=0`, tsc, Prettier, `pnpm lint:specs`, `pnpm test:scripts`); caps respected. `@kaiord/i18n` added to CI (`.github/workflows/ci.yml`: detect-changes filter + should-test gate + build-verify loop + test matrix). Private package → correctly excluded from the publishable/changeset/release lists.
- [x] 9.3 End-to-end behavior verified via a fresh SPA production build (`vite build`) plus the locale-switching integration tests: `LocaleProvider.test` (es resolution + `<html lang>`), `PreferencesTab.test` (switcher reflects/persists the choice), and the labs/formatter/error `es` rendering tests. Playwright locale pinned to `en-US` keeps the English e2e assertions deterministic. (A manual browser walkthrough is the one step a headless run cannot perform.)
