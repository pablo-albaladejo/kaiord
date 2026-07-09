# Proposal: Lab-report AI extraction on the agent runtime (Wave 2 kickoff)

## Why

Labs V1 shipped manual form entry only. The program docs define V2 as
"attach a PDF/photo of a lab report and let AI extract the data": the user
uploads a document, a multimodal LLM extracts report metadata and per-parameter
values (including the printed reference ranges), the user reviews and corrects
the draft in the existing entry form, and the saved report carries
`ai-extracted` provenance. V1 already sealed the seams: `"ai-extracted"` is in
the provenance enum, the report range is the flagging authority, and the form
state model can be pre-filled.

The AI-platform program (Wave 1 shipped in `add-ai-platform-foundation`)
intentionally gated Wave 2 — agent runtime, telemetry port, deterministic eval
lane — on this program starting, so a real third consumer shapes the runtime
instead of hardening abstractions around the two existing agents. The lab
extractor is that consumer, and it brings the requirement that neither current
entry point has: multimodal input (PDF/image file parts) feeding a
structured-output run with validation retries, resolved per-purpose, gated in
CI without API keys.

## What Changes

- **New `@kaiord/ai/observability` subpath**: a minimal telemetry port
  (`AiTelemetrySink`) with a two-event union (`run_finished`, `run_failed`)
  carrying ids, versions, and metrics only — never prompts, payloads, or API
  keys. Shipped sinks: console (dev) and in-memory ring buffer (tests/evals).
- **New `@kaiord/ai/agents` subpath**: declarative `AgentDefinition` plus a
  **generate-mode** runtime — prompt resolution from the registry, optional
  multimodal file parts (PDF/image), structured output with a
  validate-and-retry-with-feedback loop (generalizing today's
  `execute-with-retry.ts`), abort support, token usage surfaced to the caller,
  and telemetry emitted per run. `createTextToWorkout` becomes a deprecated
  thin wrapper over a shipped `workout-parser` definition, keeping its public
  signature and behavior (existing tests and eval benchmarks unchanged).
- **Deterministic eval smoke lane** (net-new): keyless vitest suites built on
  `ai/test`'s `MockLanguageModelV4` exercise the real runtime end to end
  (prompt assembly, file-part passthrough, retry loop, telemetry, strict
  validation) and run inside `pnpm test` — the CI gate the runtime rewire
  merges against. The manual eval loader generalizes beyond Anthropic via
  `EVAL_PROVIDER`/`EVAL_MODEL` (default unchanged).
- **New `lab-extractor` agent** in `packages/ai`: versioned system prompt
  (`lab-extractor/system` in the registry, catalog keys injected as a
  template variable), a permissive zod extraction schema (report header +
  per-value label/key/value/unit/printed range), and an `AgentDefinition`
  running in generate mode. `"lab_extraction"` joins the typed
  `AiModelPurpose` literals (per the program's approved decision #3).
- **SPA lab-extraction feature**: an "Import from document" affordance on the
  labs entry tab — upload a PDF/JPEG/PNG/WebP (≤10MB), run the extractor with
  the user's BYOK provider (purpose `lab_extraction`, browser flag on),
  deterministically map extracted labels to catalog parameters (custom-row
  fallback for unmapped ones), pre-fill the existing V1 entry form for review,
  and save through the existing transactional use case with provenance
  `{ source: "ai-extracted" }`. The document is transit-only: bytes go to the
  model call and are never persisted. UI strings land in the en/es i18n
  dictionaries. The application layer's report/value builders gain an explicit
  provenance parameter (defaulting to `manual`).
- **Explicitly NOT in this change** (each is its own follow-up change):
  converse-mode migration and the `AiTool` contract (chat stays on
  `createChatAgent`), usage-accounting migration to telemetry (dual-write
  parity plan), document persistence (`documentRef` stays an unsealed seam),
  and full editing of persisted lab reports.

## Capabilities

### New Capabilities

- `ai-agents`: `@kaiord/ai/agents` as the declarative agent surface —
  `AgentDefinition`, the generate-mode runtime with multimodal input and
  validation retries, usage reporting, and behavior-preserving deprecated
  wrappers for the pre-existing entry points.
- `ai-observability`: the telemetry port, its minimal redaction-safe event
  set, and the shipped console/ring-buffer sinks.
- `ai-evals`: the deterministic keyless smoke lane on `MockLanguageModelV4`
  as a CI gate over the real runtime, plus the provider-generalized manual
  eval loader.
- `spa-lab-extraction`: the labs V2 ingestion feature — document upload,
  AI extraction draft, review-before-save through the V1 form, canonical
  parameter mapping with custom fallback, printed-range authority,
  `ai-extracted` provenance, and transit-only document handling.

### Modified Capabilities

- None. `ai-providers` and `ai-prompts` exist only as delta specs inside the
  still-active `add-ai-platform-foundation` change (not yet graduated to
  `openspec/specs/`), so this change does not patch them; the
  `AiModelPurpose` union they describe is open by design and gains the
  `lab_extraction` literal in code without a behavioral change. Existing
  on-disk specs (`spa-ai-model-selection`, `spa-ai-chat`, `spa-ai-batch`,
  `hexagonal-arch`, `health-data`) are untouched: resolution semantics, chat
  behavior, usage accounting, and package dependencies do not change here.

## Impact

- **Packages**: `@kaiord/ai` (public, additive minor via changeset — two new
  subpaths, new agent, eval lane), `@kaiord/workout-spa-editor` (private —
  new feature + provenance parameter threading). No other package changes.
- **Dependencies**: none added or removed. `MockLanguageModelV4` ships inside
  the existing `ai` package (`ai/test` subpath); `@ai-sdk/*` optional peers
  are unchanged. `knip.json` gains the two new entry files.
- **Persistence**: NO Dexie schema change. `labReports`/`labValues` tables
  and indexes are untouched; `ai-extracted` provenance was already in the
  domain enum; documents are not stored.
- **Hexagonal layers**: SPA `application/` keeps importing workspace packages
  only (`@kaiord/ai/agents` joins `@kaiord/core`); the `@ai-sdk/*`
  containment guard still passes. The extraction runner is an application
  use case; UI stays in components/hooks; no new ports (extraction reuses
  the existing `labs` repository through the existing save use case).
- **Public API**: additive only. New subpath exports `./agents` and
  `./observability`; existing root exports untouched; `createTextToWorkout`
  keeps working (deprecated JSDoc, removal deferred to the program's single
  scheduled major). tsup gains two entries under the existing
  `splitting: true` configuration; the module-identity smoke test extends to
  the new subpaths.
- **Tests**: new unit suites for telemetry, runtime, retry policy, extraction
  schema/mapper, and SPA components/hooks; the deterministic smoke lane runs
  keyless in CI; existing text-to-workout and chat suites pass unchanged;
  prompt snapshots extend to the lab-extractor system prompt. Coverage
  thresholds unchanged (80/70).
- **Referenced specs**: `spa-ai-model-selection` (purpose resolution consumed
  as-is), `hexagonal-arch` (dependency table unchanged), `health-data`
  (unaffected; labs remain a separate domain), and the pending `ai-providers`/
  `ai-prompts` deltas from `add-ai-platform-foundation` (consumed, not
  modified).
