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

The SPA SHALL derive its active locale from the persisted device preference
(`"auto" | "en" | "es"`, see `spa-user-preferences`, "Language, units and
notifications are device preferences"): an explicit value wins;
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
copy. A failure of the format converters is worded by its error class: the
SPA's import pipeline maps the class to a language-free copy key with
parameters (`ImportError.copy`), and the App renders that key in the active
locale around the converter's own detail. The detail itself is free text;
localizing it requires the converter to first emit a stable code for it, so
until then the detail stays verbatim English inside the localized wording.

#### Scenario: Known AI input-validation reason renders localized copy

- **GIVEN** the active locale is `es` and an AI generation fails with `AiParsingError.reason: "input_too_long"`
- **WHEN** the generation error is displayed
- **THEN** the SPA SHALL render the Spanish copy for that reason, interpolating the length details

#### Scenario: Converter parse error is worded around its upstream detail

- **GIVEN** the active locale is `es` and a FIT import throws `FitParsingError("bad header")` (which carries no stable code)
- **WHEN** the import error is displayed
- **THEN** the SPA SHALL render the Spanish title and wording for a parse failure, with the detail `bad header` verbatim

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

### Requirement: Athlete-visible copy comes only from the dictionaries

Every string the athlete reads in the Kaiord App SHALL be produced by the
translator from the `en` and `es` dictionaries. Two local ESLint rules SHALL
enforce this on every source file of `packages/workout-spa-editor/src`,
failing `pnpm lint`:

- `local/no-jsx-literal-text` on every component: JSX text, a string child,
  a copy attribute (`aria-label`, `title`, `placeholder`, `alt`,
  `aria-description`, `aria-roledescription`, `aria-valuetext`) or a copy
  prop of a component (`label`, `description`, `title`, `heading`,
  `message`, `subtitle`, `hint`, `confirmLabel`, `cancelLabel`), including
  either branch of a conditional or a fallback and the static part of a
  template literal;
- `local/no-literal-copy` on every file outside `application/`, `store/`,
  `types/`, `adapters/dexie/` and `i18n/`: a toast title or description, a
  state setter for an error or a message (`setError`, `setMessage`, …), a
  copy property of an object literal and every value of a label map.

Tests, stories and test helpers are out of scope. A string that is the same
in every language (a product or Platform name, a file type, a unit, a
keyboard key) SHALL be listed once in the shared allow list, and a dictionary
key (`stroke.freestyle`) is never copy.

#### Scenario: A hard-coded string in a component fails lint

- **GIVEN** a component of the App renders `<p>{open ? "Hide" : "Detail"}</p>`
- **WHEN** `pnpm lint` runs
- **THEN** it SHALL fail with `local/no-jsx-literal-text` once for each branch

#### Scenario: A hard-coded toast fails lint

- **GIVEN** a hook of the App calls `toast.error("Save failed")`
- **WHEN** `pnpm lint` runs
- **THEN** it SHALL fail with `local/no-literal-copy`

#### Scenario: A pure use case is left to the layer that words it

- **GIVEN** a use case under `application/` returns `{ ok: false, message: "No steps" }`
- **WHEN** `pnpm lint` runs
- **THEN** `local/no-literal-copy` SHALL NOT report it, and the hook or component that shows the result SHALL word it with `t(...)`
