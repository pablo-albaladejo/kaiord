# Design: AI platform foundation (Wave 1)

## Context

Wave 1 of the approved AI-platform program: relocate provider plumbing and
prompt assets from the SPA into `@kaiord/ai` behind two new subpath exports,
with zero behavior change and zero breaking API change. Wave 2 (agent runtime,
telemetry port, `AiTool` contract, eval harness) is out of scope and gated on
the lab-extractor program.

## Decision 1 — Subpath exports with `splitting: true`

`@kaiord/ai` gains `./providers` and `./prompts` entries (tsup multi-entry).
The root export stays the stable facade. tsup is currently single-entry with
`splitting: false`; with multiple entries that setting would inline shared
internal modules into each bundle, so a value created via one subpath would
not be module-identical to what another subpath sees. We therefore set
`splitting: true` and add a smoke test asserting cross-subpath module
identity. The existing `.md` text loader is global and must be verified to
apply to the `./prompts` entry.

- Layer: `@kaiord/ai` package surface only.
- `exports` map gains `"./providers"` and `"./prompts"` with `import` +
  `types` conditions, mirroring the root entry.

## Decision 2 — Provider factory as library surface, not a port

`createLanguageModel(credential, modelId, options?)` moves verbatim except the
Anthropic `anthropic-dangerous-direct-browser-access` header, which becomes
`options: { browser?: boolean }` (the SPA passes `browser: true`; Node
consumers omit it). Per-provider `await import()` is preserved so only the
selected SDK loads. No new port: the factory is a pure adapter-level factory
(same role as `createFitReader`); credential/binding STORAGE stays behind the
SPA's existing Dexie repositories. Types move with it: `LlmProviderType`,
`ProviderCredential`, `AiModelPurpose` (widened to
`"default" | "chat" | "workout_generation" | (string & {})`),
`AiModelBinding`, `ResolvedModel`. The SPA's `LlmProviderConfig` keeps its
Dexie-specific fields locally and satisfies the moved types structurally.

## Decision 3 — Catalog machinery moves wholesale

Generator (`generate-model-catalog.mjs`), extractor
(`model-catalog-extract.mjs`), freshness test, generated catalog, and
`getDefaultModel` all move to `packages/ai` together. Rationale: they import
`@ai-sdk/*` type unions; leaving any piece in the SPA makes the containment
guard (Decision 5) impossible and creates a cross-package write (the SPA
generator emitting into another package's `src/`). `pnpm generate:model-catalog`
becomes a `packages/ai` script; the freshness test's relative import to the
extractor is updated in the move.

## Decision 4 — Optional peer dependencies

`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` are declared as
`peerDependencies` with `peerDependenciesMeta: { "<pkg>": { optional: true } }`
(without the meta block, installs warn), and as `devDependencies` so the
factory and catalog machinery typecheck inside `packages/ai` (today only
anthropic is present). Node consumers who never instantiate a provider install
nothing extra. The SPA keeps its own `@ai-sdk/*` dependencies — it is the
runtime installer of the optional peers.

## Decision 5 — `@ai-sdk/*` containment guard

New `scripts/check-ai-sdk-containment.mjs` (+ co-located `node:test` suite,
wired into `pnpm test:scripts`, hence pre-commit and CI): rejects any
`@ai-sdk/*` import declaration in `packages/*/src/**` outside `packages/ai`.
After Decision 3 the SPA has zero source-level `@ai-sdk/*` imports, so no
exceptions are needed: the SPA's remaining `@ai-sdk/*` references are
`package.json` dependencies and `vite.config.ts` alias strings, which the
guard (an import-declaration check) does not flag.

## Decision 6 — Load-bearing vite stubs stay in the SPA

The SPA's `vite.config.ts` aliases `@ai-sdk/gateway` →
`lib/ai-sdk-gateway-stub.ts` and `zod/v3` → `lib/zod-v3-stub.ts` (~146KB
bundle savings). These are SPA build configuration and do not travel with the
npm package. They MUST survive this refactor: the aliases, the stub files, and
the SPA's `@ai-sdk/*` deps stay. A comment in `vite.config.ts` marks them
load-bearing so a later cleanup pass does not remove them as "unused". The
stubs re-implement pinned SDK internals and are version-fragile against
`@ai-sdk` bumps — same hazard class as the catalog freshness test.

## Decision 7 — Prompt registry without a locale axis

`definePrompt({ id, version, template, variables })` +
`resolvePrompt(id, { vars })`. Exactly one locale exists today; the i18n
program adds `locales{}` and locale resolution when Spanish prompts land
(YAGNI, per critic review). Registered prompts: `workout-parser/system`
(absorbs `parse-workout.md` + `load-prompt.ts` templating),
`fitness-assistant/system` (SPA chat system prompt), `workout-parser/user`
(`buildUserPrompt` + Spanish abbreviation dictionary). The fence utility
(`fence.ts`) moves alongside as a plain exported function. Migration is
byte-identical: snapshot tests pin the assembled text of each prompt before
and after; version values remain `1.0.0`, so persisted `aiMeta.promptVersion`
values are unaffected.

## Decision 8 — Versioning: additive minor, linked-group exit first

The linked-group edit (`.changeset/config.json`) lands FIRST so this change's
minor already versions `@kaiord/ai` independently of the 12 format/tooling
packages. All existing root exports keep working — no breaking change is
flagged, so no consumer migration plan is required. The program's single
deprecation major (removing then-deprecated root exports) is explicitly NOT
part of this change.

## Spec-drift fix folded in

`spa-ai-model-selection` currently writes the resolver signature as
`resolveModelForPurpose(profileId, purpose, providers, bindings)`; the
implementation takes `(purpose, providers, bindings)` (profile scoping happens
at the binding-query layer). The MODIFIED requirement restates the actual
signature while relocating ownership.

## Out of scope

Agent runtime, telemetry/observability, `AiTool` contract, eval harness
changes, MCP tool unification, locale-aware prompts, `lab_extraction`
purpose literal, payload-capturing debug flags. Each is deliberately deferred
(Wave 2, gated on lab-extractor) or owned by another program (i18n).

## Risks

- Import-rewire misses → containment guard + full monorepo suite catch them.
- Prompt drift during migration → snapshot equality tests are written BEFORE
  the moves (red/green).
- tsup subpath misconfiguration → module-identity smoke test + `pnpm -r build`
  gate.
- SDK peer resolution differences for external npm consumers → optional peers
  with meta block; README section documents per-provider install matrix.
