## Context

The 2026-07-08 full-repo audit (`.omc/research/i18n-foundation-explore.md`)
established: no i18n mechanism exists anywhere; SPA and landing copy is
English and mostly inline; domain packages are language-free except three
error paths whose English `message` strings the SPA renders verbatim
(converter parsing errors via `transformError` → `FileUploadStatus`, core zod
messages via `KrdValidationError` → `ValidationErrorList`, and `@kaiord/ai`
input validation → the AI-generate toast). PR #863 already produced the seed
pattern: a language-agnostic core catalog with display copy in an SPA map
(`lab-parameter-display.ts`, keyed by `LabParameter.key`, with a parity
guard). Existing seams gesture at i18n: `labelKey` in
`routing/nav-destinations.ts` and the typed converter error classes.

Constraints that shape this design: `application` layers must not import
external libs; core/converters must not gain an i18n dependency; the
R-PIIInterpolation guard requires static toast/`console.*` first args; ~100s
of tests assert English literals; the 100-line cap applies to TS files;
extensions are unbundled plain JS (out of scope here, `chrome.i18n` later).

## Goals / Non-Goals

**Goals:**

- One shared, framework-agnostic translation mechanism reusable by SPA now
  and CLI/MCP later, with English + Spanish from day one.
- A persisted, reactive SPA locale preference with sensible auto-detection.
- A contract that localizes upstream failures without moving display copy
  into core or the converters.
- Prove the pipeline end-to-end on one namespace (`labs`) before the bulk
  migration.

**Non-Goals:**

- Migrating the remaining SPA namespaces, the landing, CLI/MCP output, or the
  extensions (each is a follow-up proposal building on this foundation).
- Translating LLM-facing text (MCP tool descriptions, AI prompts).
- Locale-specific content beyond strings (images, units policy).

## Decisions

### D1 — i18next + react-i18next (not lingui, react-intl, paraglide, or hand-rolled)

i18next is the mature default for a Vite/React 19 SPA: namespaces, plural
rules, interpolation, and typed keys via module augmentation, with no
transitive dependencies (~20 kB gzipped with react-i18next).

- **Why not @lingui/paraglide (compile-time):** both need build-plugin/macro
  steps in the Vite chain; the repo culture favors explicit code over macro
  magic, and compile-time extraction helps most at a scale of locales we do
  not have (2).
- **Why not react-intl:** heavier API surface for the same capability set.
- **Why not hand-rolled:** at 500–800 strings with plurals and interpolation,
  reimplementing plural rules and lazy loading is scope without payoff. The
  factory seam (D2) keeps a later swap possible.

### D2 — A private `@kaiord/i18n` package owns the mechanism

`createTranslator({ locale, resources })` wraps an isolated i18next instance
(`createInstance`, no global singleton) and returns a plain `t` function.
The package also exports `Locale`, the dictionary types, and key conventions.
React never appears in it — the SPA layers react-i18next on top; CLI/MCP will
call the factory directly (locale from `--locale`/`KAIORD_LOCALE`/`LANG`).

- **Why a package and not SPA-local code:** the whole point of the foundation
  is that CLI/MCP/landing tooling share dictionary format and conventions.
- **Why private:** avoids the 5-file publishable-package CI/CD checklist and
  npm surface; can be published later if ever useful externally.

### D3 — English is source-of-truth, default render, and end of the fallback chain

Keys resolve `<active locale> → en`; a missing `es` key renders the English
value (and fails the parity test, D6 — the chain is a runtime safety net, not
a license to ship holes). Unsupported detected locales resolve to `en`.
This keeps every existing English-literal assertion valid — unit and e2e
suites run under `en` unchanged, and e2e pins the locale explicitly.

### D4 — Locale preference lives in `UserPreferences` as `"auto" | "en" | "es"`

Persisted through the existing `setUserPreferenceFields` partial-patch use
case (lazy row creation on first mutation, injected clock, field-merge that
preserves other preferences), read reactively via `useLiveQuery`. `"auto"`
(the default) resolves via `navigator.language`
(`es*` → `es`, anything else → `en`) so Spanish-system users get Spanish on
first visit without touching settings. On change: `i18n.changeLanguage` +
`<html lang>` update, no reload.

- **Alternative — default `"en"`:** predictable, but wrong for the app's
  actual audience (Spanish-speaking athletes); rejected.
- **Alternative — localStorage:** would bypass the per-profile preferences
  aggregate and its sync story; rejected.

### D5 — Failures localize by class/code; message text is never matched

Core `ValidationError` gains an optional, stable, language-free
`code` (e.g. `min_gt_max`, `duration_type_mismatch`, `required`), produced by
`map-zod-errors.ts` from zod issue codes and by the custom refinements
explicitly. The SPA maps: converter error **class** → key (classes already
exist: `FitParsingError`, `TcxParsingError`, …), validation error **code** →
key. Unknown class/code → render the upstream English `message` verbatim, so
new upstream errors degrade to today's behavior instead of breaking. This
extends `failure-semantics`' existing rule (CLI exit codes keyed on class,
never message substrings) to the SPA, and keeps core free of display copy.

### D6 — Namespaced JSON resources, typed keys, parity-tested

Per-namespace, per-locale JSON (`locales/{en,es}/<ns>.json`) bundled
statically at first (lazy loading is a later optimization, not a requirement).
Typed keys via `i18next.d.ts` module augmentation over the `en` resources.
A unit test asserts key parity between `en` and `es` for every namespace
(supersedes the ad-hoc `LAB_PARAMETER_DISPLAY_KEYS` guard for the pilot).
JSON is outside the 100-line TS cap; TS-side modules stay small.

### D7 — The PII guard learns exactly one new shape

`check-no-pii-leakage.mjs` (R-PIIInterpolation) currently requires toast /
`console.*` first args to be static literals or SCREAMING_SNAKE constants. It
will additionally accept a call expression whose callee is `t` (or `i18n.t`)
**and** whose first argument is a string literal — `t("errors.saveFailed")`.
Interpolation values (`t(key, { count })`) stay out of the guarded position;
dynamic keys (`t(someVar)`) remain violations. `console.*` rules are
unchanged. The guard's tests cover accepted/rejected forms.

### D8 — Pilot: the `labs` namespace

`lab-parameter-display.ts` is already dictionary-shaped and just lost its
Spanish (PR #863) — the `es` catalog is seeded from the pre-#863 `nameES`
values in git history (`d2276ad1^`). Clinical abbreviations (`GLU`, `HbA1c`)
are language-neutral and stay in one shared map. The pilot exercises the full
pipeline: package factory → react wiring → preference → switcher → parity
test → guard interplay, on a bounded, already-reviewed string set.

## Risks / Trade-offs

- **Bundle size (+~20 kB gz)** → acceptable for the SPA; landing is NOT wired
  to i18next (its follow-up uses build-time substitution, zero runtime).
- **`es` catalog drift** → parity unit test fails the build on missing/extra
  keys; the runtime chain only covers the gap between merge and detection.
- **Guard loosening (D7)** → the accepted shape is deliberately narrow
  (literal-key `t()` call only); dynamic keys stay violations, so the PII
  posture is unchanged.
- **Mixed-language UI during migration** → namespaces migrate wholesale
  (follow-up proposal), and untranslated areas render consistent English via
  D3 — never key names.
- **Suspense/init timing** → resources are bundled statically; `initAsync:
false` synchronous init avoids a flash of keys; no async loading in v1.

## Migration Plan

Additive throughout: `code` is optional on `ValidationError` (minor bump +
changeset for `@kaiord/core`); the SPA keeps rendering English by default;
only the pilot namespace's components switch to `t()`. Rollback = unwire the
provider and revert the pilot components; no data migration (the preferences
row tolerates an absent `locale` field — it reads as `"auto"`).

## Open Questions

- None blocking for this change. Program-level questions (MCP tool
  descriptions EN-only, docs site scope, landing phone-mock policy) are
  deferred to their respective follow-up proposals.
