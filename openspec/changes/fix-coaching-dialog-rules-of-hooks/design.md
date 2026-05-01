## Context

The SPA editor exposes a coaching-source registry through React Context. Each registered source is a **factory hook** (`CoachingSourceFactory = (profileId, days) => CoachingSource`), documented in `packages/workout-spa-editor/src/types/coaching-source.ts`. Two consumers materialize sources today:

1. `useCoachingActivities(days)` — calls every factory at the **body** of the hook (rules-of-hooks compliant) and exposes `byDay`, `expandActivity`, `syncSources`. This is the calendar's entry point.
2. `useCoachingDialog(activity, onClose)` — calls every factory inside a `useEffect` callback **and** inside `Array.map`, which violates the Rules of Hooks. This is the bug.

When `useTrain2GoSource` (a real factory) runs in that illegal context, its first hook call (`useTrain2GoStore()`) throws React error #321 and the route's `RouteErrorBoundary` shows the white screen.

Multiple defense layers were silent because the `react-hooks` ESLint plugin is installed but never registered, both unit tests for the dialog mock the registry away, no integration test wires the real bootstrap, and `RouteErrorBoundary` reports a crash event with only the route path — too coarse for triage.

## Goals / Non-Goals

**Goals:**

- Stop the crash on the user's flow (clicking a Train2Go-loaded workout).
- Eliminate the structural cause (the dialog should not consume the registry directly).
- Activate the mechanical guard (`react-hooks/rules-of-hooks`) that the repo already pulled in but never wired.
- Establish a smoke-render test pattern that is robust against the "mock-the-contract-away" failure mode that hid this bug.
- Improve `RouteErrorBoundary` payload so future render crashes are diagnosable from telemetry.

**Non-Goals:**

- Playwright E2E for the T2G click path (requires fixturing the bridge — separate change).
- Wiring a non-noop analytics adapter in production (product decision).
- Refactoring `useCoachingActivities` or other consumers — only the dialog path is in scope.
- Fixing pre-existing Rules-of-Hooks violations elsewhere in the SPA. If activating the lint rule reveals violations, they are fixed inside this change as boy-scout cleanup; we do NOT proactively audit other paths.

## Decisions

### D1. Lift `expandActivity` to the caller (the dialog stops using the registry)

**Affects layer:** Frontend / React composition only. No domain or port impact.

The dialog mounts as a child of the calendar page, which already calls `useCoachingActivities(days)` and obtains an `expandActivity(activity)` callback (defined at `packages/workout-spa-editor/src/hooks/use-coaching-activities.ts:51-58`). We extend the callback contract so the dialog can use it directly:

- `expandActivity(activity: CoachingActivity)` — finds the matching source (by `id`) among the materialized sources and calls `source.expand(activeProfileId, activity.date)`. The current implementation already does this; no logic changes.
- `CoachingActivityDialog` props gain `expandActivity?: (activity: CoachingActivity) => void` (or required, see D6). The dialog passes it to `useCoachingDialog` instead of calling the registry.
- `useCoachingDialog(activity, onClose, expandActivity)` no longer imports `useCoachingSourceFactories` or knows about sources. Its effect just calls `expandActivity(activity)` when description is missing.

**Rationale:** Single source of truth. The calendar is the only place that materializes sources (one `useLiveQuery` subscription per source). The dialog becomes a leaf consumer of an opaque callback — simpler, decoupled, untestable for hook-composition errors because there are no hooks to compose.

**Alternatives considered:**

- _(A) Move the `factories.map` from `useEffect` to the body of `useCoachingDialog`._ Cheapest to write but instantiates sources twice in the render tree (once via the calendar, once via the dialog). Each materialization fires its own `useLiveQuery` against Dexie. Wasteful and leaves the dialog coupled to the registry — the kind of coupling that re-introduces the same class of bug if a future maintainer "optimizes" by moving things back into an effect.
- _(C) Introduce a `useExpandCoachingActivity` helper._ Adds a third public hook. The callback approach achieves the same separation with less surface area.

Decision: **B (callback)**.

### D2. Activate `eslint-plugin-react-hooks` globally

**Affects layer:** Repo tooling. `eslint.config.js` at the repo root.

Add `reactHooks` (from `eslint-plugin-react-hooks`, already in `packages/workout-spa-editor/package.json`) to the existing flat config under the SPA-files block. Initial rule levels:

- `react-hooks/rules-of-hooks`: `error` (would have caught this bug; non-controversial).
- `react-hooks/exhaustive-deps`: `error` (the SPA already follows this convention informally; if any pre-existing violation surfaces, fix or scope it).

The plugin is loaded only for the SPA package files block. Backend packages (core, fit, tcx, zwo, etc.) do not run React; not registering it there avoids parser noise.

**Rationale:** This is the single mechanical change with the highest ROI. The plugin is installed; the lift is "import + plugin slot + rules". Mechanical guards beat AI review for deterministic invariants — this is a textbook case.

**Risk:** Activating the rule may reveal pre-existing violations in other dialogs/pages. Decision rule for findings:

- If trivial (rename callback param, add missing dep): fix inside this change.
- If structural (refactor required): suppress with `// eslint-disable-next-line` + open a follow-up issue. Document each suppression in the PR description.

### D3. Naming convention: `useFactory` for hook-collection map callbacks

**Affects layer:** Frontend code style.

Anywhere we map over a collection of hooks (today: `useCoachingSourceFactories()`), the callback parameter MUST be named `useFactory`, not `f`. This makes every hook invocation `useFactory(...)` — the linter detects hook calls by the `use*` identifier prefix, so naming the parameter correctly preserves rule-of-hooks coverage even when the indirection level grows.

The existing correct call site in `use-coaching-activities.ts:38-40` already follows this convention. The bug site (`use-coaching-dialog.ts:42`) used `f` — which would not have been flagged by the linter even if the plugin had been wired. After D1 the dialog stops mapping, so the convention applies primarily to `use-coaching-activities.ts` (already compliant) and any future consumer.

This is documented in `design-principles` and not enforced by a separate script (the rules-of-hooks plugin is the enforcement; the naming is the contract that makes the plugin effective).

### D4. Smoke-render test through the real bootstrap

**Affects layer:** Frontend testing.

Add `CoachingActivityDialog.bootstrap.test.tsx` (or analogous filename) that:

- Imports the real `CoachingRegistryBootstrap` from `coaching-registry-bootstrap.tsx` (NOT mocked).
- Provides the persistence context with `createInMemoryPersistence()`.
- Renders `<CoachingActivityDialog activity={baseActivity} onClose={vi.fn()} expandActivity={vi.fn()} />`.
- Asserts: `expect(container).not.toBeEmptyDOMElement()` (no throw, dialog rendered).

The point is not to assert the dialog's behavior — the existing tests already do that. The point is to **execute the real factory hooks** in a test environment so any future Rules-of-Hooks regression in `useTrain2GoSource` (or any sibling factory) blows up at `pnpm -r test`, not in the user's browser.

**Why a separate file:** Keeps the existing mocked tests intact (they validate dialog logic with controlled inputs). The bootstrap test validates **integration**.

**Why not parametrize:** The mocking strategy is incompatible with the real bootstrap. Mixing them in one file invites accidental cross-contamination via `vi.mock` hoisting.

**Pattern reuse:** The same pattern (smoke-render through real bootstrap) applies to any future dialog/page that consumes a registry of factory hooks. The spec captures this as a generic requirement.

### D5. Enrich `RouteErrorBoundary` analytics payload — with explicit PII scrubbing

**Affects layer:** Frontend / observability + privacy.

Today: `analytics.event("route-error", { route: window.location.pathname })`. Useless for triage — counts crashes per route but tells you nothing about the failure mode.

After this change: `analytics.event("route-error", { route, name, message, componentStack })` where every string field is first **scrubbed** through a shared `scrubAnalyticsString(input: string): string` helper, then truncated.

**Threat model.** The default analytics adapter is `noop`, but `analytics-port` already ships a Cloudflare beacon adapter — once wired in production, every render error is sent to a third-party endpoint. `error.message` and `componentStack` are NOT PII-free in this codebase. Concrete leakage vectors I identified by reading the code:

- Domain conversion errors include user-supplied workout `title` (e.g., `useCoachingConvert` may throw `new Error(\`Activity not found: \${activityId}\`)`—`activityId = profileId:source:sourceId`, which contains the profile UUID).
- Adapter errors from `JSON.parse(userInput)` include the offending excerpt verbatim.
- Zod validation errors quote the parsed input value, which can include linked-account `externalUserName` and `externalUserId`.
- Garmin / Train2Go transport errors may surface `Bearer <token>` strings.
- Email patterns can appear in error messages from auth flows.

The repo already enforces an analogous boundary for user-facing strings via `scripts/check-no-pii-leakage.mjs` (covers `toast.*` and `console.*`). Sending `error.message` to a third-party analytics endpoint without scrubbing violates the _spirit_ of that guard for a different sink. We close the parallel hole.

**`scrubAnalyticsString` design.** Pure function in `packages/workout-spa-editor/src/lib/scrub-analytics-string.ts`. Order of operations:

1. Replace any UUID v4 / v5 substring (`/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi`) with `<uuid>`.
2. Replace any `Bearer\s+\S+` substring with `Bearer <token>`.
3. Replace any Unicode-aware email-shaped substring with `<email>` (canonical regex per `analytics-port` spec rule 3: `/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu`). The `\p{L}` Unicode-category coverage catches Spanish (`usuario@correo.es`), CJK (`用户@example.cn`), and CJK-TLD (`用户@example.中国`) addresses. Word-boundary anchors (`\b`) are intentionally omitted because `\b` is ASCII-only and breaks on non-Latin character boundaries.
4. Replace any 32+ hex-character run (heuristic for API keys) with `<hex>`.
5. Replace any 40+ base64url-character run (`/[A-Za-z0-9_-]{40,}/g`) with `<token>`. This catches raw JWTs, OAuth refresh tokens, and other base64url-encoded secrets that appear in error messages without a `Bearer` prefix (e.g., `"401 Unauthorized: token eyJhbGciOi..."`). Step 5 runs AFTER step 2 so a `Bearer <jwt>` is fully replaced as a single Bearer-token unit, avoiding double-scrub.
6. Truncate (parameter: `maxLen`).

**Out of scope for the scrubber.** IPv4/IPv6 addresses, international phone numbers, and filesystem pathnames (e.g., `/Users/<name>/...`) are NOT covered. The Cloudflare beacon adapter is not yet wired in production; this gap is revisited when it is. The scrubber's posture is "false-positive bias is the safe default": broader regexes catch more, even at the cost of over-scrubbing benign substrings like long alphanumeric workout-title fragments without word breaks, or UUIDs missing hyphens (which look like raw hex/base64url runs).

The scrubber is **applied to all three string fields** (`route`, `message`, `componentStack`) — not just `message`. The `route` field is scrubbed because routes like `/workout/<uuid>` leak workout identifiers; after scrubbing it becomes `/workout/<uuid>` with the literal placeholder, useful for grouping by route shape.

**Truncation lengths.** `message`: 500 chars (post-scrub). `componentStack`: 1000 chars (post-scrub). The bound is enforced after scrubbing so the placeholders are not chopped mid-token.

**Why not hash instead of scrub?** Hashing destroys triage value — you can't grep "what kind of error is happening" from a hash. Scrubbing preserves the shape ("UUID-not-found" → "<uuid> not found") while removing the PII payload. Mirrors how the existing toast/console guard works (allowed shape, forbidden interpolation).

**Why not DEV-gate the rich payload?** Crashes that escape to `RouteErrorBoundary` are precisely the bugs that don't reproduce locally — DEV-gating would defeat the purpose. Scrubbing lets us keep the triage data in production safely.

**Architecture exfiltration via `componentStack`.** Kaiord is open-source (per `CLAUDE.md`); the React component tree is public information in the repo. Forwarding component names is not a confidentiality concern. We still strip path-shaped substrings via the hex-run rule and via natural truncation.

**Reuse of the existing `try/catch`.** The boundary's `try { ... } catch { /* analytics must not cause secondary failure */ }` wrapper is preserved. A failure in `scrubAnalyticsString` (regex misbehavior) is caught here, falling back to no event rather than crashing the fallback UI.

### D6. `expandActivity` is a required prop, not optional

**Affects layer:** Frontend / API.

`CoachingActivityDialog`'s new `expandActivity` prop is **required**. Optional would let a future caller forget to wire it, in which case the dialog silently never auto-loads descriptions. We prefer a TypeScript error at the call site over a silent regression.

The single existing caller (`CalendarPage` or wherever the dialog is mounted today — verify in tasks.md) already has access to `expandActivity` via `useCoachingActivities`.

### D7. Boundary rule: dialog must not import the registry

**Affects layer:** Frontend / module boundaries.

The architectural intent of D1 is enforced as a static rule: `useCoachingDialog`, `CoachingActivityDialog`, and `CoachingActivityDialogContent` MUST NOT import any symbol from:

- `src/contexts/coaching-registry-context*`
- `src/types/coaching-source*` (except the type `CoachingActivity`, which is the data shape they consume)

Enforced by adding `no-restricted-imports` entries to the SPA-files block of `eslint.config.js` scoped to those three paths. This is **mechanical**: the next person who tries to "shortcut" by re-importing the registry into the dialog gets a CI failure, not a code-review request.

### D8. `RouteErrorBoundary` remains a class component

**Affects layer:** Frontend / convention exception.

`CLAUDE.md` prefers functions over classes. React error boundaries have no functional equivalent (`getDerivedStateFromError` and `componentDidCatch` are class-only lifecycles). `RouteErrorBoundary` therefore remains a `class Component` and this is documented as the single sanctioned exception for the SPA editor.

### D9. Mechanical guard for `useFactory` naming

**Affects layer:** Repo tooling.

A new script `scripts/check-hook-collection-map-naming.mjs` SHALL ship under `scripts/` (alongside the existing PII / zustand-writethrough guards). It scans `packages/workout-spa-editor/src/**/*.{ts,tsx}` (the full SPA tree, broader than the PII guard's `{components,hooks,lib}/**` scope, because Rules-of-Hooks applies everywhere).

**Single detection rule (no receiver heuristics).** The script flags any `<expr>.map(<param> => <body>)` shape where `<param>` is invoked as a function inside `<body>` (i.e., `<param>(...)` appears syntactically) AND `<param>`'s name does NOT start with `use`. The single sufficient condition "callback parameter is invoked as a function" is deterministic and avoids false positives on unrelated maps (`[1,2,3].map((x) => x.toString())` does not trigger because `x` is not invoked as a function). Receiver identity (whether `<expr>` is `factories`, `useCoachingSourceFactories()`, or anything else) is intentionally NOT part of the rule — any callable parameter is a potential hook call site.

The script is wired into `pnpm test:scripts` (existing CI step) and has its own co-located `*.test.mjs` per repo convention.

Why a script vs. an ESLint rule: the SPA repo's `react-hooks/rules-of-hooks` plugin already detects hook calls **by identifier prefix** — the gap is that nothing flags **misnamed** parameters in the first place. A focused script captures this single invariant deterministically, with a unit test, without adding a new ESLint plugin to maintain. Aligns with the user's `mechanical_over_ai` preference.

## Risks / Trade-offs

- **Activating `rules-of-hooks` reveals pre-existing violations** → Mitigation: run lint locally before pushing; for trivial findings fix in-PR, for structural ones open follow-up issues with `eslint-disable-next-line` + TODO comment. Bounds scope so this change doesn't balloon.
- **Smoke-render test relies on the real bootstrap, which depends on bridge-discovery and Dexie** → `bridge-discovery.ts` uses only `window` APIs (message events + `setTimeout`), both available in jsdom. `bridge-transport.ts` is the only file that touches `chrome.runtime`, and it is NOT reached from the render path (only from `sync` / `expand` / `connect` callbacks, which the smoke test does not invoke). Persistence runs against `createInMemoryPersistence()`. Provider stack required for the smoke test: `PersistenceProvider` (mandatory — `useTrain2GoSource` calls `usePersistence`), plus `CoachingRegistryBootstrap` (which provides the registry context). `useAnalytics()` defaults to `createNoopAnalytics()` via `createContext` default, so `AnalyticsProvider` is optional. The Zustand `useTrain2GoStore` does not need a provider.
- **`scrubAnalyticsString` is regex-based — over-scrub or under-scrub possible** → Mitigation: the script has a co-located unit test covering the four classes (UUID, Bearer, email, hex run) with positive cases (substring scrubbed) and negative cases (similar-but-non-matching strings preserved). The placeholders (`<uuid>`, `<token>`, `<email>`, `<hex>`) are stable so they survive grep-based triage. False positives (over-scrub) are acceptable; false negatives (under-scrub) are not.
- **Required `expandActivity` prop is technically a breaking change to the dialog's component API** → No external consumers (SPA-private package, `private: true`, not in `.changeset/config.json#linked`). No changeset, no version bump. All in-repo callers updated in this change.
- **`react-hooks/rules-of-hooks` only sees hook calls when the identifier starts with `use*`** → Mitigation D9: dedicated mechanical guard `scripts/check-hook-collection-map-naming.mjs` enforces the `useFactory` naming on `factories.map(callback)` patterns. Plugin + script together close the loop.
- **`no-restricted-imports` rule (D7) may need adjustment if a new dialog legitimately needs `CoachingActivity` type** → The rule allows `CoachingActivity` as a type-only import. Other registry symbols are forbidden in dialog files. Reviewable per addition.

## Migration Plan

Not applicable — internal change within a private package, no public API or data model impact.

## Open Questions

1. Should `react-hooks/exhaustive-deps` be `error` or `warn` initially? Decision: `error` and fix any findings inside this change. Resolved during implementation if cost balloons.
2. Do we want to extend the smoke-render pattern to other registry-consuming components in the SPA inside this change, or only establish it for the dialog and let follow-ups apply it? Decision: only the dialog is in-scope; the spec captures the requirement so follow-ups have a contract to satisfy.
