## ADDED Requirements

### Requirement: Supported locales and fallback chain

The i18n mechanism SHALL support the locales `en` and `es`, with English as
the source-of-truth catalog and the terminal element of the fallback chain.
A key missing from the active locale SHALL render the `en` value. A detected
or requested locale outside the supported set SHALL resolve to `en`. Raw key
names SHALL never be rendered to the user.

#### Scenario: Spanish key resolves in Spanish

- **GIVEN** the active locale is `es` and the key exists in the `es` catalog
- **WHEN** the key is translated
- **THEN** the Spanish value SHALL be rendered

#### Scenario: Missing Spanish key falls back to English

- **GIVEN** the active locale is `es` and the key exists only in the `en` catalog
- **WHEN** the key is translated
- **THEN** the English value SHALL be rendered, never the raw key name

#### Scenario: Unsupported locale resolves to English

- **WHEN** a translator is created for an unsupported locale (e.g. `fr`)
- **THEN** keys SHALL resolve against the `en` catalog

### Requirement: Dictionary format, key conventions, and locale parity

Dictionaries SHALL be per-namespace, per-locale JSON resources
(`locales/{en,es}/<namespace>.json`) with camelCase, dot-separated keys.
English is the source catalog: every key SHALL originate in `en`. A unit test
SHALL enforce key parity between `en` and `es` for every namespace — a missing
or extra key in either locale SHALL fail the test suite.

#### Scenario: Parity violation fails the build

- **GIVEN** a key present in `locales/en/labs.json` but absent from `locales/es/labs.json`
- **WHEN** the parity test runs
- **THEN** it SHALL fail, reporting the namespace and the offending key path

#### Scenario: Matching catalogs pass parity

- **GIVEN** `en` and `es` catalogs with identical key sets in every namespace
- **WHEN** the parity test runs
- **THEN** it SHALL pass

### Requirement: Framework-agnostic translator factory

`@kaiord/i18n` SHALL export a `createTranslator({ locale, resources })`
factory that returns a translation function supporting interpolation
parameters. The package SHALL NOT depend on React or any UI framework, and
SHALL NOT be imported by `@kaiord/core`, the format converters, or any
`application` layer. Each factory call SHALL produce an isolated instance
(no shared global state).

#### Scenario: Node consumer translates without React

- **GIVEN** a Node.js consumer (e.g. a future CLI integration)
- **WHEN** it calls `createTranslator({ locale: "es", resources })`
- **THEN** it SHALL receive a working translation function with no React dependency involved

#### Scenario: Interpolation renders parameters

- **GIVEN** an `en` catalog entry `"greeting": "Hello {{name}}"`
- **WHEN** `t("greeting", { name: "Ana" })` is called
- **THEN** it SHALL render `Hello Ana`

#### Scenario: Instances are isolated

- **GIVEN** two translators created for `en` and `es`
- **WHEN** both translate the same key
- **THEN** each SHALL resolve against its own locale without affecting the other

### Requirement: SPA locale resolution and live switching

The SPA SHALL derive its active locale from the persisted preference
(`"auto" | "en" | "es"`, see `spa-user-preferences`): an explicit value wins;
`"auto"` SHALL resolve via `navigator.language` (`es*` → `es`, anything else
→ `en`). Changing the preference SHALL take effect immediately — re-rendering
translated copy and updating `<html lang>` — without a page reload.

#### Scenario: Auto on a Spanish system renders Spanish

- **GIVEN** the preference is `"auto"` and `navigator.language` is `es-ES`
- **WHEN** the SPA renders
- **THEN** the active locale SHALL be `es` and `<html lang>` SHALL be `es`

#### Scenario: Explicit preference overrides the system locale

- **GIVEN** the preference is `"en"` and `navigator.language` is `es-ES`
- **WHEN** the SPA renders
- **THEN** the active locale SHALL be `en`

#### Scenario: Switching in Preferences applies without reload

- **GIVEN** the SPA is rendered in `en`
- **WHEN** the user selects Español in the Preferences language switcher
- **THEN** visible translated copy SHALL re-render in Spanish and `<html lang>` SHALL become `es` without a page reload, and the choice SHALL persist across sessions

### Requirement: Locale-aware formatting

SPA date and number formatting SHALL use the active locale. Hardcoded locale
tags (e.g. `"en-US"`) SHALL NOT appear in SPA formatter call sites.

#### Scenario: Dates format per active locale

- **GIVEN** the active locale is `es`
- **WHEN** the date banner formats a date
- **THEN** it SHALL render Spanish month/weekday names via `Intl` with the active locale

#### Scenario: Hardcoded locale tag is a violation

- **WHEN** an SPA formatter passes a literal locale tag such as `"en-US"` to `Intl` or `toLocale*`
- **THEN** the change SHALL be rejected in review/tests; the active locale MUST be injected instead

### Requirement: Upstream error translation contract

The SPA SHALL localize failures originating in `@kaiord/*` packages by a
stable code — a `ValidationError.code` or an `AiParsingError.reason` — never
by matching message text. When no mapping exists for a code, the SPA SHALL
render the upstream English `message` verbatim. Core, the converters, and
`@kaiord/ai` SHALL NOT gain any i18n dependency or locale-specific display
copy. Localizing an upstream failure whose useful content is a free-text
technical detail (e.g. the format converters' parse messages) requires that
package to first emit a stable code for the detail; until then such failures
fall under the verbatim-English rule above.

#### Scenario: Known AI input-validation reason renders localized copy

- **GIVEN** the active locale is `es` and an AI generation fails with `AiParsingError.reason: "input_too_long"`
- **WHEN** the generation error is displayed
- **THEN** the SPA SHALL render the Spanish copy for that reason, interpolating the length details

#### Scenario: Converter parse error without a code degrades to the upstream message

- **GIVEN** the active locale is `es` and a TCX import throws `TcxParsingError` (which carries no stable code)
- **WHEN** the import error is displayed
- **THEN** the SPA SHALL render the upstream English `message` verbatim, per the fallback rule

#### Scenario: Known validation code renders localized copy

- **GIVEN** the active locale is `es` and a `ValidationError` entry carries `code: "min_gt_max"`
- **WHEN** the validation error list renders the entry
- **THEN** the Spanish copy for `min_gt_max` SHALL be rendered

#### Scenario: Unknown code degrades to the upstream message

- **GIVEN** a `ValidationError` entry whose `code` (or class) has no SPA mapping
- **WHEN** the error is displayed
- **THEN** the upstream English `message` SHALL be rendered verbatim

#### Scenario: Message-text matching is a violation

- **WHEN** SPA code branches on a substring of an upstream `error.message` to pick display copy
- **THEN** the change SHALL be rejected; branching MUST use the error class or `code`

### Requirement: Pilot `labs` namespace localized

The lab-parameter display names SHALL be served from the `labs` dictionary in
both `en` and `es` (Spanish names seeded from the pre-#863 `nameES` catalog).
Clinical abbreviations (e.g. `GLU`, `HbA1c`) SHALL remain language-neutral
and identical across locales.

#### Scenario: Lab parameter name renders in Spanish

- **GIVEN** the active locale is `es`
- **WHEN** the labs feature renders the parameter with key `glucose`
- **THEN** it SHALL display "Glucosa (ayunas)" with the unchanged abbreviation `GLU`

#### Scenario: Abbreviations do not vary by locale

- **GIVEN** any supported locale
- **WHEN** a lab parameter label is rendered
- **THEN** the abbreviation SHALL be identical to the `en` rendering
