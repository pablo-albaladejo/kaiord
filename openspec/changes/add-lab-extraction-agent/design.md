# Design: Lab-report AI extraction on the agent runtime

## Context

Two approved program documents govern this change:

- The **AI-platform plan** (Wave 1 shipped via `add-ai-platform-foundation`,
  PR #870) gates Wave 2 — `./agents` runtime, `./observability` telemetry
  port, deterministic eval lane, `./tools` contract, usage migration — on the
  lab-extractor program starting, so real requirements shape the runtime.
- The **labs program** (V1 shipped manual entry, PR #861) defines V2 as
  document upload + AI extraction + review/confirm, with provenance
  `ai-extracted` and the printed report range captured as authority.

Exploration of the current tree (fresh off main `8b2be1d7`) established:

- `packages/ai` has three subpaths (`.`, `./providers`, `./prompts`), tsup
  `splitting: true`, optional `@ai-sdk/*` peers, `ai@^7.0.14`. No multimodal
  handling anywhere: `createTextToWorkout` sends a plain string prompt via
  `generateText` + `Output.object`; chat passes `messages` verbatim.
- `ai/test` in the installed SDK exports **`MockLanguageModelV4`** (the plan
  referenced `MockLanguageModelV2`). `generateText` + `Output.object` in
  ai@7 drives the v4 model spec — structured output only resolves when the
  mock returns the v4 shape (`finishReason: { unified, raw }`, nested usage
  `{ total }`) — so the eval lane targets `MockLanguageModelV4`.
- Evals are two manual Anthropic-only CLIs (`load-anthropic-model.ts`);
  nothing imports `ai/test` today; unit tests mock `ai` with vitest.
- The lab domain is extraction-ready: `labProvenanceSchema` already contains
  `"ai-extracted"`; `LabValue` stores raw + canonical values and effective
  ranges; `computeFlag` gives the report range authority; the catalog has 56
  parameters with affine unit conversion; `custom:<slug>` covers the long
  tail. The V1 entry form is state-driven (`LabRowState[]` + header) and
  saves through `buildLabReportSubmission` → `saveLabReport` (transactional).
- There is NO blob storage in Dexie, no PDF/OCR dependency, and no image
  handling in the SPA. File ingestion exists as a pattern:
  `File.arrayBuffer()` → `Uint8Array`, 10MB cap, `FileUpload` molecule.
- Only chat records token usage (`recordChatUsage`, monthly `usage` row);
  generation/batch/coaching are invisible by construction because
  `createTextToWorkout` does not surface usage.
- Purposes in use: `"chat"`, `"workout_generation"`. `AiModelPurpose` is an
  open union; per-purpose bindings and the resolver live in `./providers`.

## Goals / Non-Goals

**Goals**

1. Ship the labs V2 ingestion feature end to end: upload → extract → review
   in the V1 form → save with `ai-extracted` provenance.
2. Ship the Wave 2 platform slice this feature actually needs: generate-mode
   agent runtime with multimodal input, telemetry port, deterministic eval
   smoke lane — each abstraction arriving with its first real consumer.
3. Prove "new capability = one AgentDefinition" on both a new agent
   (lab-extractor) and an existing one (workout-parser wrapper rewire).
4. Keep everything additive: no breaking API change, no Dexie migration, no
   behavior change to chat/generation/batch/coaching.

**Non-Goals**

- Converse-mode runtime and the `AiTool` contract: chat stays on
  `createChatAgent` untouched. Migrating it buys no user value here and
  couples this change to 12 SPA tool definitions; it lands as its own change
  when the tool contract does.
- Usage-accounting migration: extraction (like generation today) does not
  write the `usage` table. The telemetry port ships the substrate; folding
  events into Dexie with a dual-write parity plan is the dedicated follow-up
  the program already defines.
- Document persistence: no `documentRef` field, no blob table, no OPFS. See
  decision D3.
- Full editing of persisted lab reports (the other V2 item in the labs
  program): zero AI coupling, independent value, own change.
- LLM-as-judge graders, locale-axis prompts, new providers.

## Decisions

### D1 — One change, platform-first task order (re-slicing Wave 2)

The plan sketched Wave 2 as five separate changes (eval lane, runtime,
telemetry, usage migration, tool contract). This change collapses the three
pieces the extractor needs (eval lane, generate-mode runtime, telemetry port)
plus the feature into ONE change, mirroring how Wave 1 collapsed its three
phases into `add-ai-platform-foundation`. Rationale: the pieces are
individually unshippable (a runtime with no consumer, an eval lane with no
runtime), the whole slice is comparable in size to Wave 1 (~60 files), and
tasks are ordered so the platform lands first and each section keeps the
monorepo green — the PR can still be split mechanically at apply time if it
grows past review size. Usage migration and the tool contract keep their own
future changes exactly as planned (they carry independent risk: stateful
dual-write; 12-tool rewire).

### D2 — Generate-mode-only runtime slice

`AgentDefinition` ships with `mode: "generate"` support only. The prelude
(model + prompt resolution, telemetry, usage mapping) is written so
converse-mode can attach later, but no converse implementation ships now:
its only consumer (chat) works today, and rewiring it without the tool
contract would force a second rewire later. The two generate consumers
(workout-parser, lab-extractor) are enough to validate the definition shape.
`createTextToWorkout` becomes a thin deprecated wrapper over the
`workout-parser` definition — same signature, same `AiParsingError`
semantics, same retry/validation behavior — so its existing unit tests and
the 22-case manual benchmark remain valid unchanged.

### D3 — Documents are transit-only (no storage, no Dexie bump)

The uploaded PDF/photo is read into memory (`File.arrayBuffer()` →
`Uint8Array`), sent to the model as a file part, and dropped. Nothing is
persisted: no blob table, no OPFS, no `documentRef` on `LabReport`.
Consequences: NO Dexie migration in this change (v31 stays the head), no
storage-quota or clinical-data-at-rest surface beyond what V1 already has
(issue #858 covers snapshot encryption), and re-extraction means re-upload.
The seam stays open: when document retention becomes a requirement, an
optional unindexed `documentRef` field plus a blob table is an additive
migration. This follows the labs deep-dive, which explicitly left
"storage of the original vs transit-only" as a V2 decision.

### D4 — Extraction schema is permissive; mapping is deterministic code

The LLM's structured output uses a PERMISSIVE zod schema (flat, optional
fields, no discriminated unions) for the same reason `aiWorkoutSchema` does:
provider structured-output complexity limits. Per extracted row the model
returns the verbatim printed label, its best-guess canonical `parameterKey`
(the 56 catalog keys travel in the system prompt as a template variable),
numeric value, verbatim unit, and the printed reference range
(`refLow`/`refHigh` or free `refText`). A deterministic SPA-side mapper then
decides the actual row identity: a model-proposed key is accepted only if it
exists in the catalog; otherwise the label is matched via the existing
display-name/abbreviation lookups (both locales); anything still unmapped
becomes a **custom-parameter row** (`custom:<slug>`, the V1 long-tail
mechanism) carrying the verbatim label — the user resolves or deletes it
during review. The LLM never gets to invent a canonical key that skips
validation, and no extracted value is silently dropped.

### D5 — Review IS the V1 form; printed ranges keep authority

Extraction produces form state, not persisted records: header fields plus
`LabRowState[]` pre-fill the existing entry form under an "AI-extracted
draft — review before saving" banner. Extracted printed ranges populate the
row's ref fields with `refTouched: true`, so the existing
`resolveEffectiveRefRange` marks them `refSource: "report"` — the V1
authority rule applies to extracted data with zero new logic. Values without
a printed range fall back to the catalog exactly as manual entry does.
Saving goes through the untouched transactional `saveLabReport`; until the
user saves, nothing exists in Dexie. This is the HITL pattern of the chat
action tools translated to form UX, as the program docs prescribed.

### D6 — Provenance becomes a parameter (default `manual`)

`build-lab-report.ts` and `build-lab-value.ts` hardcode
`provenance: { source: "manual" }`. They gain an optional provenance
argument threaded from the form hook (`manual` by default; `ai-extracted`
when the draft came from extraction, even if the user edited rows — the
field records origin, not purity). No `sourceBridgeId`/`externalId` is
written (those stay reserved for a future labs bridge).

### D7 — Purpose `lab_extraction` and its binding UI

`"lab_extraction"` is added to the `AiModelPurpose` typed literals (the
program's decision #3 said "when V2 starts" — that is now) and to the
settings ModelPicker purpose list, so users can pin a model for extraction
(multimodal-capable models matter here). Resolution needs no code: the
standard order (purpose binding → default binding → default provider)
already covers it. Note for graduation: the `ai-providers` delta inside the
still-active `add-ai-platform-foundation` change quotes the pre-existing
union; when that change is archived/synced, the graduated spec should state
the union including `lab_extraction`. This change does not edit another
change's delta.

### D8 — Telemetry port: minimal, redaction-safe, wired but unconsumed

`AiTelemetrySink` + two events (`run_finished`, `run_failed`) with ids,
versions, provider/model/purpose, token usage, and latency — never message
content, prompts, or keys (repo PII rule R-PIIInterpolation by
construction). The runtime emits unconditionally to an injected sink
(no-op default). Shipped sinks: console (dev debugging) and ring buffer
(used by the smoke lane to assert emission). Field names stay mappable to
OTel GenAI semantic conventions without an OTel dependency. The SPA does not
consume events yet — that is the usage-migration change; shipping the port
now means the runtime never needs a breaking retrofit.

### D9 — Deterministic smoke lane on `MockLanguageModelV4`, inside `pnpm test`

The lane is vitest suites in `packages/ai` driving the REAL runtime against
`MockLanguageModelV4` from `ai/test` (correcting the plan's V2 reference):
scripted responses assert prompt assembly from the registry, file-part
passthrough (mediaType + bytes reach the model), the
invalid-then-valid retry-with-feedback loop, strict-validation rejection,
telemetry emission, and usage mapping. Keyless, deterministic, runs in
`pnpm test` → the CI gate for the runtime rewire, exactly the role the plan
assigned to phase 5'. The manual lanes stay: `pnpm eval` gains a
provider-generalized loader (`EVAL_PROVIDER`, `EVAL_MODEL`; Anthropic
default) built on `./providers`, and a `lab-extractor` manual benchmark runs
against a SYNTHETIC fixture document (a rendered fake lab-report table —
no real clinical data enters the repo).

### D10 — Multimodal input contract and its provider limits

Runtime input is `{ text?, files? }` where a file part is
`{ data: Uint8Array, mediaType, filename? }`, forwarded as AI SDK file
content parts. Accepted upload types: `application/pdf`, `image/jpeg`,
`image/png`, `image/webp`; 10MB cap (BYOK browser calls embed base64, so
~13MB request bodies stay acceptable). PDF/image support varies by provider
and model (Anthropic and Google models accept both; OpenAI depends on the
model); the runtime does not pre-flight capability — a provider rejection
surfaces through the existing retry/error path as a user-visible failure
with the model name, and the binding UI lets the user pick a capable model.
An `AbortSignal` threads through to `generateText` so the SPA can offer
cancel during long extractions.

### D11 — i18n from day one

The SPA now has the i18n foundation (en/es). All new UI strings (import
affordance, progress, review banner, error states) enter both dictionaries;
parameter names keep using the existing display map. The lab-extractor
SYSTEM prompt stays English (core rule: language-agnostic engine; the model
reads Spanish documents fine with an English instruction set) — prompt
localization remains the i18n program's future work.

## Risks & Mitigations

- **Regression in workout generation from the wrapper rewire** → smoke lane
  gates it; existing unit tests + prompt snapshots run unchanged; manual
  `pnpm eval` before/after on the same 22 benchmarks as acceptance evidence.
- **Extraction hallucination / wrong values** → review-before-save is
  mandatory (nothing auto-persists); deterministic mapping refuses invented
  keys; printed ranges + verbatim units are carried so the reviewer sees
  what the document said; provenance marks origin permanently.
- **Provider can't read the document** → clear failure surface with the
  resolved model named; per-purpose binding lets the user route extraction
  to a capable model; docs note current provider support.
- **Oversized/hostile documents** → type allowlist + 10MB cap before any
  bytes leave the browser; extraction output is size-bounded by the schema;
  abort support prevents hung UI.
- **Module identity across four subpaths** → existing `splitting: true`
  guard extends to `./agents`/`./observability` (registry and telemetry
  singletons asserted across entries).
- **Scope creep toward converse mode** → explicit non-goal; chat files are
  untouched in this change (mechanically visible in the diff).

## Rollback

Additive minors + retained wrappers: revert the PR and nothing breaks — no
Dexie migration to unwind, no persisted-format change (`ai-extracted` was
already a legal provenance value), no published-package removal. The feature
is a new affordance on the labs entry tab; reverting removes it cleanly.

## Follow-up changes (unchanged from the program plan)

1. `add-ai-tool-contract` + converse-mode runtime; chat rewired as a
   deprecated wrapper.
2. `migrate-usage-accounting`: SPA Dexie telemetry sink, dual-write + parity
   with the legacy `usage` row, then remove `record-chat-usage`; extraction
   and generation start counting.
3. Lab report editing (non-AI labs V2 remainder).
4. Document retention (`documentRef` + blob storage) if users ask for it.
5. Program-end deprecation major (remove wrapped entry points).
