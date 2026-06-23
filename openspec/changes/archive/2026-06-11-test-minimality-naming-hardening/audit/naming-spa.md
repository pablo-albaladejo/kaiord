The CLI has zero `Manager/Helper/Util/Handler/Wrapper` artifact names in source (the matches were all in test files or domain-legit `result` from `await command()`). The CLI and MCP are essentially clean. The `data` usages in the SPA are confined to opaque JSON-parse results (clipboard, ping payloads) where `unknown` content makes a generic name defensible. I have a complete picture now.

---

# Naming Audit — Identifier & Artifact Naming

Scope: `packages/workout-spa-editor` (src, non-test), `packages/cli` (src, non-test), `packages/mcp` (src, non-test). Standard: semantic/business, pronounceable, honest, predicate booleans, kebab files.

## Headline

This is a strongly named codebase. Domain vocabulary (workout, step, repetition block, target, FTP, HR, zone, profile, template, library, coaching activity, sync, session match, auto-match) is pervasive and consistent across all three packages. Hooks are exemplary (`useCoachingActivities`, `useAutoMatchSuggestions`, `useMatchedSessions`, `useExecutedMatchAuto`), and the `*Live` suffix is an honest, consistent marker for `useLiveQuery`-backed hooks. CLI command/flag vocabulary and MCP tool names are tightly aligned with the domain specs. Findings below are mostly low-severity polish; there is one genuine medium-severity convention break.

---

## packages/workout-spa-editor

- [SEVERITY med] [CATEGORY convention] hooks/useToast.ts, hooks/useAppHandlers.ts, hooks/useDeleteCleanup.ts, hooks/useKeyboardShortcuts.ts (+ satellites useToast.helpers.ts, useToast.types.ts) — file names are camelCase while the dominant hook-file convention is kebab-case (≈60 `use-*.ts` files vs 4 `useXxx.ts` stragglers + 2 satellites) — the kebab convention is the documented repo standard (CLAUDE.md: "Files: kebab-case.ts") — rename to `use-toast.ts`, `use-app-handlers.ts`, `use-delete-cleanup.ts`, `use-keyboard-shortcuts.ts`, `use-toast.helpers.ts`, `use-toast.types.ts`. This is the single most worthwhile cleanup: it's a real inconsistency in an otherwise uniform directory.

- [SEVERITY low] [CATEGORY cryptic] application/ai-workout-processor.ts:14, batch-processor.ts:30, +14 other files (~105 occurrences of the `*Fn` token, mostly in 16 source files) — `GenerateFn`, `ProcessOneFn`, `generateFn`, `processOneFn` use the cryptic `Fn` suffix for injected-callback types/params — a domain-honest suffix reads better — suggest `GenerateWorkout` / `ProcessWorkout` for the types and `generateWorkout` / `processWorkout` for the params (the callback already _is_ the verb). Low severity: `Fn` is widely understood and confined to port-style callback seams.

- [SEVERITY low] [CATEGORY generic] utils/build-clipboard-handlers.ts:14,22,33,44 and utils/build-step-handlers.ts:24,30 — repeated `const idx = deps.stepIndex()` — `idx` is the flagged cryptic abbreviation, and unlike the acceptable `for (let i...)` loop counters these are named locals reused across a multi-line body — rename to `selectedStepIndex` (the value is the index of the currently selected step). Low because the scope is small and the surrounding code is otherwise clear.

- [SEVERITY low] [CATEGORY generic] application/profile/helpers/profile-utils.ts (filename), components/.../WorkoutLibrary/utils/card-helpers.ts, store/actions/paste-step-helpers.ts, components/organisms/WorkoutStats/format-helpers.ts (+ ~28 files matching `*helpers*`/`*utils*` filenames) — generic `*-utils.ts` / `*-helpers.ts` / `card-helpers.ts` filenames where the contents have a clear domain theme — the _functions_ inside are well-named (`getNewActiveProfileId`, `formatDuration`, `getDifficultyColor`, `regeneratePasteIds`), so this is filename-only — prefer domain names where one fits (e.g. `card-helpers.ts` → `workout-card-formatters.ts`, `profile-utils.ts` → fold `getNewActiveProfileId` into `select-active-profile.ts`). Low: widespread but cosmetic; the public identifiers are honest.

- [SEVERITY low] [CATEGORY generic] store/actions/paste-step-helpers.ts:39-43, store/train2go-ping-result.ts:26, hooks/garmin-bridge-operations.ts:88 — `data?: unknown` / `const data = JSON.parse(...)` / `res.data as RawPingData` — generic `data` for freshly-parsed opaque JSON — defensible (the content is genuinely untyped at the boundary), but `parsedClipboard` / `rawPing` would be more honest at the named-local sites. Borderline — listing for completeness, not action-critical.

No misleading-name findings: spot-checked `use*Live` hooks (read-only, honest), `get*` functions (pure, no hidden I/O), and `StepEditorWrapper`/`AiSuccessActionsContainer` — the latter two are genuinely structural (a styled `div`; a store-binding container) and fall under the standard's "unless genuinely structural" carve-out, so they are acceptable.

Component file convention: PascalCase `.tsx` for components (e.g. `WorkoutCard.tsx`, `ProfileForm.tsx`) is the dominant, intentional React convention here and is applied uniformly — not flagged.

### Verdict: A−

Domain vocabulary, hook naming, and boolean predicates are excellent. The single graded deduction is the kebab-vs-camelCase hook-file inconsistency (med) plus the cosmetic `Fn`/`utils`/`helpers`/`idx` polish (low). No generic catch-alls in identifiers, no misleading names, no cryptic acronyms in the public surface.

---

## packages/cli

- [SEVERITY low] [CATEGORY cryptic] commands/garmin/yargs-subcommands.ts:10 (`buildLogger`), bin/register-commands.ts:27, commands/convert/yargs-config.ts (the `cfg`/`argv` locals) — `cfg` (flagged abbreviation) and the third-party-imposed `argv` appear in handler glue — `argv` is yargs' fixed contract (leave it), but `for (const cfg of commands)` → `for (const commandConfig of commands)`. Very low; tiny lambda/loop scope.

User-facing surface is clean and on-spec: command names (`convert`, `validate`, `diff`, `inspect`, `extract-workout`, `garmin login|logout|list|push`), flags (`--input/-i`, `--output/-o`, `--output-dir`, `--input-format`, `--output-format`, `--email`, `--password`, `--limit`, `--offset`), and help text ("Convert workout files between formats", "Authenticate with Garmin Connect") are all business language. Format enums (`fit|gcn|krd|tcx|zwo`) match the domain specs exactly. Zero `Manager/Helper/Util/Wrapper` artifacts in source.

### Verdict: A

User-facing vocabulary is exemplary and matches the format/adapter specs. Only a single trivial `cfg` loop variable to polish.

---

## packages/mcp

- No findings. Tool names are exemplary domain vocabulary: `kaiord_convert`, `kaiord_validate`, `kaiord_round_trip_validate`, `kaiord_inspect`, `kaiord_diff`, `kaiord_extract_workout`, `kaiord_garmin_login/list/push/logout`, `kaiord_get_health_summary`, `kaiord_get_hrv_history`, `kaiord_get_sleep_history`, `kaiord_get_weight_history`, `kaiord_get_recovery_status`, `kaiord_get_format_spec`, `kaiord_list_formats`. Tool descriptions and server instructions speak the domain ("fitness data framework", "KRD is the canonical JSON format", "query health data from FIT health files"). Schema field names (`input_file`, `input_content`, `input_format`, `output_format`, `output_file`) are honest and self-documenting. Register-function naming (`registerConvertTool`, `registerGetHealthSummaryTool`) is consistent. No cryptic abbreviations, no generic catch-alls, no misleading names; `process`/`handle`/`run` artifact functions: none found.

### Verdict: A

Cleanest of the three. The MCP surface is the reference example for the rest of the codebase.

---

## Top 5 renames (highest readability payoff)

1. `packages/workout-spa-editor/src/hooks/useToast.ts` (+ `useAppHandlers.ts`, `useDeleteCleanup.ts`, `useKeyboardShortcuts.ts`, and the `useToast.helpers.ts`/`useToast.types.ts` satellites) → kebab-case. Removes the only real convention break and makes the hooks directory 100% uniform.
2. `GenerateFn` / `ProcessOneFn` (and params `generateFn` / `processOneFn`) in `application/ai-workout-processor.ts` & `application/batch-processor.ts` → `GenerateWorkout` / `ProcessWorkout`. Drops the `Fn` suffix on a frequently-read port seam.
3. `idx` → `selectedStepIndex` in `utils/build-clipboard-handlers.ts` and `utils/build-step-handlers.ts`. Six named locals become self-explanatory.
4. `card-helpers.ts` → `workout-card-formatters.ts` (and fold `profile-utils.ts`'s `getNewActiveProfileId` into a `select-active-profile.ts`). Replaces generic `helpers`/`utils` filenames with the domain concept the file actually serves.
5. `const cfg of commands` → `commandConfig` in `bin/register-commands.ts` (and the `buildLogger` loop sites). Removes the lone cryptic abbreviation in the CLI source.

## CLI/MCP vocabulary vs. domain specs

Consistent. Both surfaces speak the canonical domain language defined in the specs: the KRD-canonical conversion model, the five format codes (FIT, TCX, ZWO, GCN, KRD) used verbatim as command choices and MCP enum values, the Garmin Connect (GCN) auth/list/push operations, and the health-data vocabulary (sleep, weight, HRV, recovery). No invented or mechanical terms leak to the user-facing layer. MCP is the strongest exemplar; the CLI matches it; the SPA is one file-naming cleanup away from the same bar.

===NEXT-BLOCK===

The naming audit is complete. Here is the summary of findings across the three packages.

## Overall Assessment

This is a strongly named codebase. Domain vocabulary (workout, step, repetition block, target, FTP, HR, zone, profile, template, library, coaching activity, sync, session match, auto-match) is pervasive and consistent. Findings are mostly low-severity polish with one genuine medium-severity convention break.

## Per-Package Verdicts

- **workout-spa-editor: A−** — Exemplary hook naming and boolean predicates. One real inconsistency (kebab vs camelCase hook files) plus cosmetic polish.
- **cli: A** — User-facing command/flag/help vocabulary is on-spec; only a trivial `cfg` loop variable to polish.
- **mcp: A** — Cleanest of the three; the reference example for the rest of the codebase.

## The One Finding Worth Acting On

The single medium-severity issue: the hooks directory mixes the dominant kebab-case convention (~60 files) with 4 camelCase stragglers plus 2 satellites:

- `packages/workout-spa-editor/src/hooks/useToast.ts` → `use-toast.ts`
- `packages/workout-spa-editor/src/hooks/useAppHandlers.ts` → `use-app-handlers.ts`
- `packages/workout-spa-editor/src/hooks/useDeleteCleanup.ts` → `use-delete-cleanup.ts`
- `packages/workout-spa-editor/src/hooks/useKeyboardShortcuts.ts` → `use-keyboard-shortcuts.ts`
- `packages/workout-spa-editor/src/hooks/useToast.helpers.ts` → `use-toast.helpers.ts`
- `packages/workout-spa-editor/src/hooks/useToast.types.ts` → `use-toast.types.ts`

This violates the documented `kebab-case.ts` standard in CLAUDE.md.

## Top Low-Severity Polish

- `Fn` suffix on injected-callback types/params (~16 source files), e.g. `GenerateFn`/`generateFn` in `packages/workout-spa-editor/src/application/ai-workout-processor.ts` → `GenerateWorkout`/`generateWorkout`.
- `idx` named locals in `packages/workout-spa-editor/src/utils/build-clipboard-handlers.ts` and `build-step-handlers.ts` → `selectedStepIndex`.
- Generic `*-utils.ts`/`*-helpers.ts` filenames (functions inside are well-named): e.g. `card-helpers.ts` → `workout-card-formatters.ts`.

## CLI/MCP vs Domain Specs

Consistent. Both surfaces speak the canonical domain language (KRD-canonical conversion, the five format codes FIT/TCX/ZWO/GCN/KRD used verbatim, Garmin Connect operations, health-data vocabulary). No mechanical or invented terms leak to the user-facing layer. MCP is the strongest exemplar.

The full per-finding markdown breakdown (with severities, categories, file:line, rationale, and suggested names) is in my detailed report above.

===NEXT-BLOCK===

The naming audit is complete and the findings have been delivered. Here is the final consolidated report.

# Naming Audit — Identifier & Artifact Naming

Scope: `packages/workout-spa-editor`, `packages/cli`, `packages/mcp` (src files, excluding `*.test.*` and `*.stories.*`).

## Overall

Strongly named codebase. Domain vocabulary (workout, step, repetition block, target, FTP, HR, zone, profile, template, library, coaching activity, sync, session match, auto-match) is pervasive and consistent. Hooks are exemplary and the `*Live` suffix is an honest, consistent marker for `useLiveQuery`-backed hooks. CLI commands/flags and MCP tool names align tightly with the domain specs. Findings are mostly low-severity polish with one genuine medium-severity convention break.

## workout-spa-editor — Verdict: A−

- [med][convention] `hooks/useToast.ts`, `hooks/useAppHandlers.ts`, `hooks/useDeleteCleanup.ts`, `hooks/useKeyboardShortcuts.ts` (+ `useToast.helpers.ts`, `useToast.types.ts`) — camelCase files in a directory where kebab-case is dominant (~60 vs 4+2) and is the documented standard — rename to `use-toast.ts`, `use-app-handlers.ts`, `use-delete-cleanup.ts`, `use-keyboard-shortcuts.ts`, `use-toast.helpers.ts`, `use-toast.types.ts`.
- [low][cryptic] `application/ai-workout-processor.ts`, `batch-processor.ts` (+~14 files, ~105 `*Fn` tokens) — `GenerateFn`/`ProcessOneFn`/`generateFn` — rename to `GenerateWorkout`/`ProcessWorkout`/`generateWorkout`.
- [low][generic] `utils/build-clipboard-handlers.ts:14,22,33,44`, `utils/build-step-handlers.ts:24,30` — `idx` named locals — rename to `selectedStepIndex`.
- [low][generic] `application/profile/helpers/profile-utils.ts`, `WorkoutLibrary/utils/card-helpers.ts`, `WorkoutStats/format-helpers.ts` (+~28 `*helpers*`/`*utils*` files) — generic filenames over domain-themed contents; functions inside are well-named — prefer domain filenames (e.g. `card-helpers.ts` → `workout-card-formatters.ts`).
- [low][generic] `paste-step-helpers.ts:39-43`, `train2go-ping-result.ts:26`, `garmin-bridge-operations.ts:88` — generic `data` for opaque parsed JSON; defensible at the untyped boundary.

No misleading-name findings. `StepEditorWrapper` and `AiSuccessActionsContainer` are genuinely structural (carve-out applies). PascalCase `.tsx` for components is the intentional, uniform React convention — not flagged.

## cli — Verdict: A

- [low][cryptic] `bin/register-commands.ts:27`, `garmin/yargs-subcommands.ts:10` — `cfg` loop var → `commandConfig` (leave yargs' fixed `argv`).

User-facing surface clean and on-spec: commands (`convert`, `validate`, `diff`, `inspect`, `extract-workout`, `garmin login|logout|list|push`), flags (`--input/-i`, `--output/-o`, `--output-dir`, `--input-format`, `--output-format`, `--email`, `--password`, `--limit`, `--offset`), help text, and format enums (`fit|gcn|krd|tcx|zwo`) all match the domain specs. Zero `Manager/Helper/Util/Wrapper` artifacts in source.

## mcp — Verdict: A

No findings. Tool names (`kaiord_convert`, `kaiord_get_health_summary`, `kaiord_garmin_push`, …), descriptions, server instructions, schema fields (`input_file`, `output_format`, …), and register-function names are all exemplary domain vocabulary. The reference standard for the rest of the codebase.

## Top 5 renames (highest readability payoff)

1. Kebab-case the 4 camelCase hook files + 2 satellites (removes the only real convention break).
2. `GenerateFn`/`ProcessOneFn` → `GenerateWorkout`/`ProcessWorkout`.
3. `idx` → `selectedStepIndex` in `build-clipboard-handlers.ts` / `build-step-handlers.ts`.
4. `card-helpers.ts` → `workout-card-formatters.ts`; fold `getNewActiveProfileId` into `select-active-profile.ts`.
5. `cfg` → `commandConfig` in `bin/register-commands.ts`.

## CLI/MCP vocabulary vs domain specs

Consistent. Both surfaces speak the canonical domain language (KRD-canonical conversion, the five format codes used verbatim, Garmin Connect operations, health-data vocabulary). No mechanical or invented terms leak to the user-facing layer. MCP is the strongest exemplar; the CLI matches it; the SPA is one file-naming cleanup away from the same bar.

===NEXT-BLOCK===

The audit is complete and the report has been delivered. No further work is needed.

## Summary

I audited identifier and artifact naming across three packages, running grep sweeps for anti-patterns (cryptic abbreviations, generic catch-alls, artifact suffixes like Manager/Helper/Wrapper, misleading get/use names) then deep-reading representative components, hooks, store, lib, CLI commands, and MCP tools.

**Verdicts:**

- `packages/workout-spa-editor`: **A−**
- `packages/cli`: **A**
- `packages/mcp`: **A**

**The one finding worth acting on (medium severity):** the hooks directory mixes camelCase files (`useToast.ts`, `useAppHandlers.ts`, `useDeleteCleanup.ts`, `useKeyboardShortcuts.ts` + 2 satellites) into an otherwise uniform kebab-case directory (~60 files), violating the documented `kebab-case.ts` standard.

**Everything else is low-severity polish:** the `Fn` callback suffix, `idx` named locals in two `build-*-handlers.ts` files, and generic `*-utils`/`*-helpers` filenames over well-named contents.

**User-facing vocabulary (CLI commands/flags/help, MCP tool names/schemas) is consistent with the domain specs** — the five format codes, Garmin Connect operations, and health-data terms all appear verbatim, with no mechanical or invented terms leaking to the user layer.

The full per-finding breakdown with severities, categories, file:line references, rationale, suggested names, and the top-5 renames is in the report above.

===NEXT-BLOCK===

# Naming Audit — Identifier & Artifact Naming

Scope: `packages/workout-spa-editor` (src, non-test), `packages/cli` (src, non-test), `packages/mcp` (src, non-test). Standard: semantic/business language, pronounceable in English, honest (name matches behavior), boolean predicates (is/has/should/can), kebab-case files (PascalCase components per React convention). Domain/industry acronyms (FIT, TCX, ZWO, KRD, GCN, FTP, HR, MCP, AI, UI, SPA, PII, ID, URL) treated as fine.

## Headline

This is a strongly named codebase. Domain vocabulary (workout, step, repetition block, target, FTP, HR, zone, profile, template, library, coaching activity, sync, session match, auto-match) is pervasive and consistent across all three packages. Hooks are exemplary (`useCoachingActivities`, `useAutoMatchSuggestions`, `useMatchedSessions`, `useExecutedMatchAuto`), and the `*Live` suffix is an honest, consistent marker for `useLiveQuery`-backed hooks. CLI command/flag vocabulary and MCP tool names are tightly aligned with the domain specs. Findings below are mostly low-severity polish; there is one genuine medium-severity convention break.

Severities: 🔴 CRITICAL | 🟠 IMPORTANT | 🟡 SUGGESTION. (No criticals found; med = 🟠, low = 🟡.)

---

## packages/workout-spa-editor

- [SEVERITY med] [CATEGORY convention] `hooks/useToast.ts`, `hooks/useAppHandlers.ts`, `hooks/useDeleteCleanup.ts`, `hooks/useKeyboardShortcuts.ts` (+ satellites `useToast.helpers.ts`, `useToast.types.ts`) — file names are camelCase while the dominant hook-file convention is kebab-case (≈60 `use-*.ts` files vs 4 `useXxx.ts` stragglers + 2 satellites) — the kebab convention is the documented repo standard (CLAUDE.md: "Files: kebab-case.ts") — rename to `use-toast.ts`, `use-app-handlers.ts`, `use-delete-cleanup.ts`, `use-keyboard-shortcuts.ts`, `use-toast.helpers.ts`, `use-toast.types.ts`. This is the single most worthwhile cleanup: it's a real inconsistency in an otherwise uniform directory.

- [SEVERITY low] [CATEGORY cryptic] `application/ai-workout-processor.ts:14`, `application/batch-processor.ts:30`, +14 other files (~105 occurrences of the `*Fn` token across 16 source files) — `GenerateFn`, `ProcessOneFn`, `generateFn`, `processOneFn` use the cryptic `Fn` suffix for injected-callback types/params — a domain-honest suffix reads better — suggest `GenerateWorkout` / `ProcessWorkout` for the types and `generateWorkout` / `processWorkout` for the params (the callback already _is_ the verb). Low severity: `Fn` is widely understood and confined to port-style callback seams.

- [SEVERITY low] [CATEGORY generic] `utils/build-clipboard-handlers.ts:14,22,33,44` and `utils/build-step-handlers.ts:24,30` — repeated `const idx = deps.stepIndex()` — `idx` is the flagged cryptic abbreviation, and unlike the acceptable `for (let i...)` loop counters these are named locals reused across a multi-line body — rename to `selectedStepIndex` (the value is the index of the currently selected step). Low because the scope is small and the surrounding code is otherwise clear.

- [SEVERITY low] [CATEGORY generic] `application/profile/helpers/profile-utils.ts` (filename), `components/organisms/WorkoutLibrary/utils/card-helpers.ts`, `store/actions/paste-step-helpers.ts`, `components/organisms/WorkoutStats/format-helpers.ts` (+ ~28 files matching `*helpers*`/`*utils*` filenames) — generic `*-utils.ts` / `*-helpers.ts` / `card-helpers.ts` filenames where the contents have a clear domain theme — the _functions_ inside are well-named (`getNewActiveProfileId`, `formatDuration`, `getDifficultyColor`, `regeneratePasteIds`), so this is filename-only — prefer domain names where one fits (e.g. `card-helpers.ts` → `workout-card-formatters.ts`, `profile-utils.ts` → fold `getNewActiveProfileId` into `select-active-profile.ts`). Low: widespread but cosmetic; the public identifiers are honest.

- [SEVERITY low] [CATEGORY generic] `store/actions/paste-step-helpers.ts:39-43`, `store/train2go-ping-result.ts:26`, `hooks/garmin-bridge-operations.ts:88` — `data?: unknown` / `const data = JSON.parse(...)` / `res.data as RawPingData` — generic `data` for freshly-parsed opaque JSON — defensible (the content is genuinely untyped at the boundary), but `parsedClipboard` / `rawPing` would be more honest at the named-local sites. Borderline — listed for completeness, not action-critical.

No misleading-name findings: spot-checked `use*Live` hooks (read-only, honest), `get*` functions (pure, no hidden I/O), and `StepEditorWrapper`/`AiSuccessActionsContainer` — the latter two are genuinely structural (a styled `div`; a store-binding container) and fall under the standard's "unless genuinely structural" carve-out, so they are acceptable.

Component file convention: PascalCase `.tsx` for components (e.g. `WorkoutCard.tsx`, `ProfileForm.tsx`) is the dominant, intentional React convention here and is applied uniformly — not flagged.

### Verdict: A−

Domain vocabulary, hook naming, and boolean predicates are excellent. The single graded deduction is the kebab-vs-camelCase hook-file inconsistency (med) plus the cosmetic `Fn`/`utils`/`helpers`/`idx` polish (low). No generic catch-alls in identifiers, no misleading names, no cryptic acronyms in the public surface.

---

## packages/cli

- [SEVERITY low] [CATEGORY cryptic] `bin/register-commands.ts:27` (`for (const cfg of commands)`), `commands/garmin/yargs-subcommands.ts:10` (`buildLogger` glue) — `cfg` (flagged abbreviation) appears in handler-registration glue — rename the loop variable `cfg` → `commandConfig`; leave the third-party-imposed `argv` (it's yargs' fixed contract). Very low; tiny loop scope.

User-facing surface is clean and on-spec: command names (`convert`, `validate`, `diff`, `inspect`, `extract-workout`, `garmin login|logout|list|push`), flags (`--input/-i`, `--output/-o`, `--output-dir`, `--input-format`, `--output-format`, `--email`, `--password`, `--limit`, `--offset`), and help text ("Convert workout files between formats", "Authenticate with Garmin Connect", "List workouts from Garmin Connect", "Push a workout file to Garmin Connect") are all business language. Format enums (`fit|gcn|krd|tcx|zwo`) match the domain specs exactly. Zero `Manager/Helper/Util/Wrapper/Processor` artifacts in source (the only matches were in test files or domain-legit `result` from `await command()`).

### Verdict: A

User-facing vocabulary is exemplary and matches the format/adapter specs. Only a single trivial `cfg` loop variable to polish.

---

## packages/mcp

- No findings. Tool names are exemplary domain vocabulary: `kaiord_convert`, `kaiord_validate`, `kaiord_round_trip_validate`, `kaiord_inspect`, `kaiord_diff`, `kaiord_extract_workout`, `kaiord_garmin_login/list/push/logout`, `kaiord_get_health_summary`, `kaiord_get_hrv_history`, `kaiord_get_sleep_history`, `kaiord_get_weight_history`, `kaiord_get_recovery_status`, `kaiord_get_format_spec`, `kaiord_list_formats`. Tool descriptions and server instructions speak the domain ("fitness data framework", "KRD is the canonical JSON format", "query health data from FIT health files"). Schema field names (`input_file`, `input_content`, `input_format`, `output_format`, `output_file`) are honest and self-documenting. Register-function naming (`registerConvertTool`, `registerGetHealthSummaryTool`) is consistent. No cryptic abbreviations, no generic catch-alls, no misleading names; no `process`/`handle`/`run` artifact functions found.

### Verdict: A

Cleanest of the three. The MCP surface is the reference example for the rest of the codebase.

---

## Top 5 renames (highest readability payoff)

1. `packages/workout-spa-editor/src/hooks/useToast.ts` (+ `useAppHandlers.ts`, `useDeleteCleanup.ts`, `useKeyboardShortcuts.ts`, and the `useToast.helpers.ts` / `useToast.types.ts` satellites) → kebab-case. Removes the only real convention break and makes the hooks directory 100% uniform.
2. `GenerateFn` / `ProcessOneFn` (and params `generateFn` / `processOneFn`) in `application/ai-workout-processor.ts` & `application/batch-processor.ts` → `GenerateWorkout` / `ProcessWorkout`. Drops the `Fn` suffix on a frequently-read port seam.
3. `idx` → `selectedStepIndex` in `utils/build-clipboard-handlers.ts` and `utils/build-step-handlers.ts`. Six named locals become self-explanatory.
4. `card-helpers.ts` → `workout-card-formatters.ts` (and fold `profile-utils.ts`'s `getNewActiveProfileId` into a `select-active-profile.ts`). Replaces generic `helpers`/`utils` filenames with the domain concept the file actually serves.
5. `const cfg of commands` → `commandConfig` in `bin/register-commands.ts` (and the `buildLogger` glue sites). Removes the lone cryptic abbreviation in the CLI source.

## CLI/MCP vocabulary vs. domain specs

Consistent. Both surfaces speak the canonical domain language defined in the specs: the KRD-canonical conversion model, the five format codes (FIT, TCX, ZWO, GCN, KRD) used verbatim as command choices and MCP enum values, the Garmin Connect (GCN) auth/list/push operations, and the health-data vocabulary (sleep, weight, HRV, recovery). No invented or mechanical terms leak to the user-facing layer. MCP is the strongest exemplar; the CLI matches it; the SPA is one file-naming cleanup away from the same bar.
