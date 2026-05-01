## ADDED Requirements

### Requirement: React Rules-of-Hooks lint gate

The `eslint-plugin-react-hooks` plugin SHALL be registered in the repo-root `eslint.config.js` for the `packages/workout-spa-editor/**/*.{ts,tsx}` files block, with:

- `react-hooks/rules-of-hooks` set to `error`.
- `react-hooks/exhaustive-deps` set to `error`.

The SPA-pages files block (`packages/workout-spa-editor/**/pages/**/*.tsx`) inherits the plugin via the flat-config cascade — no separate registration is required for that block.

This gate is enforced by `pnpm lint` (specifically by the ESLint step within it) — distinct from the static-source `pnpm test:scripts` checks that enforce most other gates in this capability. CI MUST fail when either rule produces any error in the SPA editor sources. Pre-existing violations exposed by activating the plugin MUST be fixed (zero-tolerance policy from `CLAUDE.md`); a temporary `eslint-disable-next-line` is permitted only when paired with a TODO comment referencing an open issue.

#### Scenario: rules-of-hooks blocks a hook call inside useEffect

- **WHEN** SPA editor source contains a hook call inside a `useEffect` callback (e.g., `useEffect(() => { useFactory(...) })`)
- **THEN** `pnpm lint` exits non-zero with a `react-hooks/rules-of-hooks` error

#### Scenario: rules-of-hooks blocks a hook call inside Array.map placed inside a non-hook scope

- **WHEN** SPA editor source contains a hook call inside `Array.prototype.map` whose enclosing context is NOT a React function-component or custom-hook body — e.g., `useEffect(() => { items.map((useFooBar) => useFooBar()); }, [])` placed inside an effect body
- **THEN** `pnpm lint` exits non-zero with a `react-hooks/rules-of-hooks` error (the plugin detects the call by the `use*` identifier prefix; this scenario covers the plugin's *scope* detection, while the misnamed-parameter case is covered by the separate "Hook-collection map parameter naming guard" requirement)

#### Scenario: Plugin is loaded by the SPA files block of eslint.config.js

- **WHEN** the resolved ESLint configuration is inspected via `pnpm exec eslint --print-config packages/workout-spa-editor/src/main.tsx | jq '.plugins | keys'`
- **THEN** the output array contains `"react-hooks"`, and the resolved `rules` object contains both `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` at level `"error"`

### Requirement: Hook-collection map parameter naming guard

A static-source guard `scripts/check-hook-collection-map-naming.mjs` SHALL run in CI under `pnpm test:scripts` and fail when any `*.{ts,tsx}` file under `packages/workout-spa-editor/src/**` contains an `Array.prototype.map` call whose callback is an arrow-function matching the following single trigger pattern (combining two syntactic conditions):

- the callback body invokes the parameter as a function (i.e., `<param>(...)` appears syntactically inside the body), AND
- the parameter name does NOT start with `use` (case-sensitive prefix — `update`, `unused`, etc. are NOT accepted; only the literal `use` prefix passes).

The trigger pattern depends only on the callback's syntactic shape, not on receiver identity (`factories`, `useCoachingSourceFactories()`, or any other expression are all in scope). Whether the receiver is `factories`, `useCoachingSourceFactories()`, or any other expression is irrelevant — any callable callback parameter is a potential hook call site, and naming it with the `use*` prefix is what allows `react-hooks/rules-of-hooks` to detect rule violations downstream. This rule exists because that plugin detects hook calls **by identifier prefix** — a parameter named `f` or `factory` is silently accepted even when it points to a real React hook. The naming guard closes the gap so the lint plugin can do its job.

The guard scopes itself to the full SPA `src/**` tree (broader than the PII guard's `{components,hooks,lib}/**` scope) because Rules-of-Hooks applies everywhere, not just to user-facing-string call sites.

The script SHALL have a co-located unit test (`scripts/check-hook-collection-map-naming.test.mjs`) covering at least:

- A positive case (compliant `factories.map((useFactory) => useFactory(...))` passes).
- A negative case (`factories.map((f) => f(...))` fails with a clear message naming the file, line, and bad parameter).
- A negative case for a non-`use*` prefix that still has a `u` prefix (e.g., `update`, `unused`) to verify the check is strict on the `use` prefix and not just the letter `u`.
- A no-op case (a `.map` whose callback body does NOT invoke the parameter as a function — e.g., `.map((x) => x.id)` — passes regardless of name).
- A non-receiver-bound case: `[fn1, fn2].map((g) => g())` MUST fail (callback parameter is invoked, name does not start with `use`); `[1, 2, 3].map((n) => n + 1)` MUST pass (parameter not invoked as a function).

#### Scenario: Misnamed parameter fails the guard

- **WHEN** `packages/workout-spa-editor/src/components/SomeComponent.tsx` contains `factories.map((f) => f(profileId, days))`
- **THEN** `pnpm test:scripts` exits non-zero with a message naming the file, line number, and the rejected parameter `f`

#### Scenario: Compliant parameter passes the guard

- **WHEN** `packages/workout-spa-editor/src/hooks/use-coaching-activities.ts` contains `factories.map((useFactory) => useFactory(activeProfileId, days))`
- **THEN** `pnpm test:scripts` does not flag this site

#### Scenario: Non-invoking map call is exempt

- **WHEN** a file contains `factories.map((f) => f.id)` (parameter is destructured, not invoked as a function)
- **THEN** the guard does not flag this site

### Requirement: Registry-bootstrap smoke-render test

For each SPA editor component that **directly** consumes `useCoachingSourceFactories` (or any future analogous registry of factory hooks), the SPA test suite SHALL include at least one "smoke-render" test that:

- Imports and uses the **real** registry bootstrap (e.g., `CoachingRegistryBootstrap` from `coaching-registry-bootstrap.tsx`) — NOT a mock of `useCoachingSourceFactories`.
- Imports and uses the **real** factories that the production bootstrap registers, so every factory's hook composition runs in the test environment.
- Provides every required runtime context the bootstrap and its factories transitively need (today, at minimum: `PersistenceProvider` with `createInMemoryPersistence()`).
- Mounts the component AND co-mounts a `TestProbe` that calls `useCoachingActivities([0])` (or whatever hook materializes the factories at runtime) inside the same provider tree. This forces every registered factory hook to actually execute in the test, so a Rules-of-Hooks regression introduced INSIDE a factory body (not just at the dialog boundary) is caught at `pnpm -r test`. Without the probe, the dialog's post-fix decoupling from the registry would render the smoke test diagnostically inert for factory-internal regressions.
- Asserts that rendering does not throw and the component is present in the DOM. Because the dialog is rendered into a body-level Radix portal, the assertion MUST target either the testid (`coaching-activity-dialog`) via `screen.getByTestId(...)` or `document.body`, NOT the test render's local `container`.
- Additionally asserts the bootstrap registered at least one factory (non-vacuous registration). Today, this means asserting `useCoachingActivities([0]).syncSources.length >= 1` (or a sentinel-factory check). Without this assertion, a regression that empties the bootstrap's factory list would pass the smoke test trivially.

The in-scope component set today is exactly `{ CoachingActivityDialog }`. Any component ADDED in the future that directly consumes `useCoachingSourceFactories` SHALL ship with its own smoke-render test in the same PR.

The purpose of this requirement is to make Rules-of-Hooks regressions and registry-composition failures surface at `pnpm -r test`, not at runtime in the user's browser. Mocking `useCoachingSourceFactories` (or the registry context) is permitted in **other** tests for that component — but at least one smoke-render test per registry-consuming component MUST exercise the real bootstrap.

#### Scenario: CoachingActivityDialog has a bootstrap-real smoke test

- **WHEN** the SPA test suite runs `pnpm test` in `packages/workout-spa-editor`
- **THEN** at least one test mounts `CoachingActivityDialog` through the real `CoachingRegistryBootstrap` (with no `vi.mock` on `coaching-registry-context`) and asserts the render does not throw and the dialog DOM (queried via `screen.getByTestId("coaching-activity-dialog")`) is present

#### Scenario: Bootstrap-real smoke test catches a hook regression in factory internals

- **GIVEN** a developer introduces a hook call inside a `useEffect` or inside `Array.map` in `useTrain2GoSource` (or any other factory registered by `CoachingRegistryBootstrap`)
- **WHEN** `pnpm test` runs
- **THEN** the smoke-render test fails because the `TestProbe` invokes `useCoachingActivities([0])` inside the same provider tree, which transitively calls every factory at hook top-level — the Rules-of-Hooks violation surfaces as React error #321 at render time, before merge

#### Scenario: no-restricted-imports rejects re-coupling of the dialog to the registry at lint time

- **GIVEN** a developer re-imports `useCoachingSourceFactories` (or any other registry-context export) into one of the three dialog files in violation of the rule from "Dialog must not import the coaching-source registry"
- **WHEN** `pnpm lint` runs
- **THEN** the regression is caught at lint time with a `no-restricted-imports` error before any test runs

#### Scenario: Smoke test catches an emptied bootstrap factory list

- **GIVEN** a regression where `CoachingRegistryBootstrap` registers an empty factory list (e.g., the `useTrain2GoSource` registration is accidentally removed)
- **WHEN** `pnpm test` runs the bootstrap smoke test
- **THEN** the test fails because the non-vacuous-registration assertion (factories ≥ 1) is violated, even though render-time would otherwise pass cleanly

### Requirement: Dialog must not import the coaching-source registry

Files matching `packages/workout-spa-editor/src/components/molecules/CoachingCard/{CoachingActivityDialog,CoachingActivityDialogContent,use-coaching-dialog}.{ts,tsx}` MUST NOT import any symbol from `../../contexts/coaching-registry-context*` or from `../../types/coaching-source*` (other than the `CoachingActivity` type which is the data shape they consume). This is enforced by `no-restricted-imports` (or `@typescript-eslint/no-restricted-imports`) in `eslint.config.js`, scoped to the dialog files.

This rule is the static expression of the architectural invariant from D1 of this change's design: the dialog is a leaf consumer of an opaque `expandActivity` callback, and the registry is materialized exactly once per render tree by the dialog's mounting host (the calendar via `useCoachingActivities`).

#### Scenario: Importing the registry context from the dialog files is rejected

- **WHEN** any of the three dialog source files attempts `import { useCoachingSourceFactories } from "../../contexts/coaching-registry-context"`
- **THEN** `pnpm lint` exits non-zero with a `no-restricted-imports` error naming the forbidden import path

#### Scenario: Importing the CoachingActivity type from the dialog files is allowed

- **WHEN** the dialog imports `import type { CoachingActivity } from "../../types/coaching-activity"`
- **THEN** `pnpm lint` passes (the rejection list excludes data-shape types and only restricts registry / source-port modules)

### Requirement: analytics.event first-argument hygiene

The static-source guard `scripts/check-no-pii-leakage.mjs` SHALL be extended to recognize a fourth dispatch shape: `analytics.event(<eventName>, <payload>)` (and its destructured / re-bound equivalents) anywhere under `packages/workout-spa-editor/src/{components,hooks,lib}/**`. The first argument (`<eventName>`) MUST satisfy the same shape rule already enforced for `toast.*` and `console.*`: bare string literal, OR bare top-level `SCREAMING_SNAKE_CASE` identifier whose value is directly a bare string literal.

This rule extends the existing PII guard from user-facing string sinks (toast, console) to a third-party telemetry sink (analytics). The motivation is identical: structurally forbid interpolation so user-typed content cannot leak via event names. The payload object passed as the second argument is OUT of scope for this rule — payload-level PII is governed by the per-event spec (e.g., the `route-error` payload's `scrubAnalyticsString` requirement under `analytics-port`).

#### Scenario: analytics.event with template-literal first arg is rejected

- **WHEN** any covered file contains `analytics.event(\`workout-${id}-saved\`, {})`
- **THEN** `pnpm test:scripts` exits non-zero with a clear message naming the file, line, and the rejected interpolation form

#### Scenario: analytics.event with bare string literal passes

- **WHEN** any covered file contains `analytics.event("workout-saved", { id })`
- **THEN** `pnpm test:scripts` passes (the second-argument payload is governed by per-event specs, not this guard)

#### Scenario: Destructured analytics.event is covered

- **WHEN** a file contains `const { event } = useAnalytics(); event(\`x-${y}\`, {});`
- **THEN** `pnpm test:scripts` exits non-zero (the destructure tracking already implemented for `toast` and `console` MUST cover `analytics` too)
