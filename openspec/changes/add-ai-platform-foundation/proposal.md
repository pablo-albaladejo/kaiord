# Proposal: AI platform foundation (Wave 1)

## Why

`@kaiord/ai` is today a thin engine (`createTextToWorkout`, `createChatAgent`)
while half of the AI plumbing lives scattered inside the SPA: the provider
factory (`lib/provider-factory.ts`), the generated model catalog and its
generator/freshness machinery, the purpose→model resolution
(`application/ai/resolve-model-for-purpose.ts`), the chat system prompt, the
generation user-prompt builder, and the prompt-injection fences. Every new AI
capability (lab extraction V2, localized prompts, new agents) re-invents this
plumbing, and there is no single home where observability, cost accounting, or
eval coverage can attach later.

This change executes **Wave 1** of the approved AI-platform program (design
reviewed by an independent critic pass; plan recorded outside the repo): the
low-risk, high-dedup moves. Wave 2 (agent runtime, telemetry port, tool
contract, eval harness) is intentionally deferred until the lab-extractor
program starts, so its real requirements shape the runtime.

## What Changes

- **Changesets ungroup (chore)**: `@kaiord/ai` leaves the 13-package `linked`
  group in `.changeset/config.json` so its release cadence (and its eventual
  deprecation major) no longer ripples the format adapters' version line.
- **Dead prompt code removal (SPA)**: delete `SYSTEM_PROMPT_TEMPLATE` and
  `buildSystemPrompt` from `application/ai-prompts.ts` together with their
  test cases (production-dead: no non-test importer). `buildUserPrompt`,
  `PROMPT_VERSION`, and the Spanish abbreviation dictionary stay.
- **New `@kaiord/ai/providers` subpath**: moves the provider model factory
  (browser header becomes a `{ browser?: boolean }` option instead of
  hardcoded), the provider/credential/binding/purpose types, the
  purpose→model resolution, and the ENTIRE model-catalog machinery
  (generator + extractor + freshness test + generated output +
  `getDefaultModel`). `@ai-sdk/anthropic|openai|google` become optional peer
  dependencies of `@kaiord/ai` (with `peerDependenciesMeta`) and
  devDependencies for its own typecheck.
- **New `@kaiord/ai/prompts` subpath**: a versioned prompt registry (no
  locale axis yet — the i18n program adds it) that becomes the single owner
  of: the `parse-workout.md` system prompt, the SPA chat system prompt
  (`CHAT_PROMPT_VERSION`), the generation user-prompt builder
  (`buildUserPrompt` + `PROMPT_VERSION` + Spanish dictionary), and the
  untrusted-data fence utility. Assembled prompt text stays byte-identical
  (snapshot-guarded); version values stay `1.0.0` so persisted
  `aiMeta.promptVersion` semantics are untouched.
- **New mechanical guard**: no `@ai-sdk/*` import outside `packages/ai/**`
  (mirrors the existing check-scripts pattern), feasible because the catalog
  machinery moves.
- **SPA rewiring**: imports switch to `@kaiord/ai/providers|prompts`; the
  load-bearing vite stub aliases (`@ai-sdk/gateway`, `zod/v3`) and the SPA's
  `@ai-sdk/*` package deps REMAIN (documented as intentional).
- **No breaking changes**: all existing `@kaiord/ai` root exports keep
  working; everything ships as an additive minor. A single deprecation major
  is scheduled at the end of the overall program, not in this change.

## Capabilities

### New Capabilities

- `ai-providers`: `@kaiord/ai/providers` as the single owner of provider
  model instantiation, the SDK-sourced model catalog and its generation
  machinery, purpose→model resolution, optional-peer packaging, and the
  `@ai-sdk/*` containment guard.
- `ai-prompts`: `@kaiord/ai/prompts` as the single owner of versioned prompt
  definitions, template variable substitution, and the untrusted-data fence
  utility, with byte-identical migration of the four existing prompt assets.

### Modified Capabilities

- `spa-ai-model-selection`: the "SDK-sourced model catalog" and "Centralized
  per-purpose model resolution" requirements change OWNERSHIP (catalog
  machinery and resolver now live in and are imported from
  `@kaiord/ai/providers`); user-facing behavior, fallback order, and the
  freshness CI guard are unchanged.
- `hexagonal-arch`: the package-dependency table row for `@kaiord/ai` gains
  the three `@ai-sdk/*` optional peer dependencies.

## Impact

- **Packages**: `@kaiord/ai` (public, minor bump via changeset),
  `@kaiord/workout-spa-editor` (private, import rewiring + dead code
  removal), repo `scripts/` (new containment guard), `.changeset/config.json`
  (linked-group edit). No other package changes.
- **Hexagonal layers**: `@kaiord/ai` acts as an adapter-providing package
  (like `fit`/`tcx`): depends on `@kaiord/core` + `ai` peer (+ new optional
  `@ai-sdk/*` peers). SPA `application/` keeps importing workspace packages
  only — it never touches `@ai-sdk/*` directly (now mechanically enforced).
  No new ports: the provider factory and prompt registry are pure library
  surface; credential/binding storage stays behind the SPA's existing Dexie
  repositories.
- **New dependencies**: `@ai-sdk/openai` and `@ai-sdk/google` as
  devDependencies + optional peers of `packages/ai` (justification: the
  factory that instantiates them moves in; they were already runtime deps of
  the SPA, so nothing new enters the workspace lockfile). `knip.json`
  updated accordingly.
- **Public API**: additive only. New subpath exports `./providers` and
  `./prompts`; existing root exports untouched. No migration needed for npm
  consumers. tsup gains multi-entry with `splitting: true` plus a
  module-identity smoke test.
- **Tests**: moved suites travel with their modules (resolution, factory,
  catalog freshness); new suites for the prompt registry, subpath module
  identity, and the containment guard script (`node:test`); prompt snapshot
  tests pin byte-identical assembly. Coverage thresholds unchanged (80/70).
- **Referenced specs**: `spa-ai-model-selection`, `spa-ai-chat` (fence
  behavior unchanged, ownership noted at sync time), `spa-ai-batch`
  (consumes `buildUserPrompt`; behavior unchanged), `hexagonal-arch`.
