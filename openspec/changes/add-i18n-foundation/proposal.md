## Why

Every user-facing surface of kaiord ships English-only, hardcoded copy: the SPA
(~500–800 distinct strings), the landing (~100–130), the CLI, the MCP server,
and the three browser extensions. A full-repo audit (2026-07-08,
`.omc/research/i18n-foundation-explore.md`) confirmed the domain packages are
language-decoupled — the one structural leak (Spanish `nameES` lab names in
core) was already fixed in PR #863 — but three error paths still surface
upstream English verbatim in the SPA (converter parsing errors, core zod
validation messages, `@kaiord/ai` input validation), and three SPA formatters
hardcode `en-US`. There is no i18n mechanism anywhere in the monorepo.

The owner wants English and Spanish across all surfaces. That program needs a
foundation first: a shared mechanism, key conventions, a locale preference, and
a contract that lets core and the converters stay language-free while surfaces
translate their failures.

## What Changes

- Add **`@kaiord/i18n`** (new, `private: true`): a framework-agnostic
  translator factory wrapping i18next, plus the shared `Locale` type
  (`"en" | "es"`), dictionary shape, and key conventions. Consumed by the SPA
  now; CLI/MCP reuse it in a follow-up proposal.
- Wire the SPA to **react-i18next** with English as source-of-truth and
  fallback locale, and Spanish as the first translation target. Namespaced
  JSON resources; typed keys.
- Add a **locale preference** (`"auto" | "en" | "es"`, default `"auto"`) to
  the `spa-user-preferences` aggregate, with a `setLocale` use case following
  the existing calendar-density pattern, a switcher in
  `SettingsPanel/PreferencesTab`, and `navigator.language` resolution for
  `auto`. `<html lang>` tracks the active locale.
- Establish the **error translation contract**: core `ValidationError` entries
  gain a stable, language-free `code`; the SPA localizes failures by error
  class/code (never message text), falling back to the upstream English
  message for unknown codes. Converter typed error classes are mapped the same
  way in `transformError`/`file-parser-error-builders`.
- **Fix the three hardcoded `en-US` formatter sites**
  (`health/trends/format-pane-value.ts`, `TemplatePickerDialog/format-date-label.ts`,
  `pages/DateBanner.tsx`) to use the active locale.
- **Migrate a pilot namespace — `labs`**: the English lab-parameter display map
  (`lab-parameter-display.ts`) becomes the `labs` dictionary in `en` + `es`
  (Spanish names recovered from the pre-#863 `nameES` catalog in git history),
  with a key-parity test between locales.
- **Update the R-PIIInterpolation guard** (`scripts/check-no-pii-leakage.mjs`)
  to accept a translation call with a static key (`t("literal.key")`) as a
  valid toast first argument, preserving its intent (no interpolated PII).

Out of scope (follow-up proposals, in order): full SPA dictionary migration,
landing per-locale build, CLI/MCP dictionaries, extension `_locales`, docs
site. This change makes them mechanical.

## Capabilities

### New Capabilities

- `i18n`: Supported locales and fallback chain, dictionary format and key
  conventions, the framework-agnostic translator factory, SPA locale
  resolution and switching, locale-aware formatting, the upstream error
  translation contract, and the pilot `labs` namespace.

### Modified Capabilities

- `spa-user-preferences`: the `UserPreferences` aggregate gains a `locale`
  field with a `setLocale` use case, lazy row creation, and reactive reads.
- `failure-semantics`: validation errors carry stable machine codes so
  presentation layers localize by code, never by message text — extending the
  existing "never message substrings" rule from CLI exit codes to the SPA.
- `hexagonal-arch`: the `Package Dependencies` table gains the new
  `@kaiord/i18n` package (no workspace deps) and lists it as an allowed
  dependency of `@kaiord/workout-spa-editor`.

## Impact

- **Packages**: `@kaiord/i18n` (new, private), `@kaiord/core` (additive:
  `code` on `ValidationError` — minor version, changeset required),
  `@kaiord/workout-spa-editor` (wiring, preference, pilot namespace, error
  mapping, formatters), `scripts/` (PII guard).
- **Hexagonal layers**: core `domain`/`types` (error codes only — no i18n
  dependency enters core, converters, or any `application` layer); SPA
  `application` (locale use cases), `hooks`/`components` (provider, switcher,
  consumers). The i18n runtime lives strictly at the presentation edge.
- **New dependencies**: `i18next` (+ `react-i18next` in the SPA), justified in
  `design.md` D1/D2 (~20 kB gzipped combined; zero deps of their own).
- **No breaking changes**: `code` is optional-additive on the public API;
  English remains the default rendered locale, so the hundreds of existing
  unit/e2e assertions on English literals stay valid. e2e pins locale
  explicitly.
- **CI**: new package added to the test/build matrices; it is NOT added to the
  publishable/changeset-linked lists (private).
- **Tests**: unit tests for the translator factory, locale resolution,
  error-code mapping, formatter locale-awareness, en/es key parity; UI tests
  for the switcher; all following `should …` + AAA conventions; coverage 80%
  (new package) / 70% (SPA).
