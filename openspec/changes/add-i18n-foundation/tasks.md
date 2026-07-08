> Status: foundation + locale-preference domain + pilot dictionaries + SPA
> runtime wiring (provider, switcher, formatters, labs live-locale) + validation
> and AI-input error localization landed and green (sections 1, 2, 3, 4.1–4.3, 5,
> 6.2/6.3/6.4, 7, 8). Remaining: e2e locale pin (4.4), converter parse-message
> localization (6.1), full quality gates (9).

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
- [ ] 6.1 Converter parse errors (follow-up): the KRD-validation path (`KrdValidationError` → `ValidationErrorList`) is localized via 6.2. The composed converter _parse_ messages (`FitParsingError`/`TcxParsingError`/… → "Failed to parse X file: <detail>") remain English — mapping the class to a generic localized string drops the upstream technical detail and would rewrite the message-asserting import tests; per the contract's fallback rule (unknown/unmapped → upstream English message) this is the designed graceful degradation.
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

- [ ] 9.1 `pnpm -r build` green (core before SPA), `pnpm -r test` 100% pass, coverage ≥80% (`@kaiord/i18n`) / ≥70% (SPA). (So far: `@kaiord/i18n` 13/13, core 489/489, PII guard 18/18, touched SPA tests green, SPA `tsc --noEmit` clean.)
- [ ] 9.2 `pnpm lint` clean across the repo (ESLint `--max-warnings=0`, tsc, Prettier, `pnpm lint:specs`, `pnpm test:scripts`); 100-line/40-line caps respected. Add `@kaiord/i18n` to the CI matrices.
- [ ] 9.3 Verify end-to-end with the running SPA: switch Auto/English/Español → labs names, date banner, and a forced import error render localized; reload persists the choice.
