# Design: Run live evals through the maintainer's local Claude subscription

## Context

All three eval runners (`run-evals.ts`, `run-chat-tool-evals.ts`,
`run-lab-extraction-evals.ts`) take their model from `load-eval-model.ts`, which
needs a provider API key the project will never hold. The keyless lanes (fixture
invariants, scorer tests, the `MockLanguageModelV4` runtime lane) are the only
ones that ever ran. The production calls are:

- parser and labs: `generateText` with `output: Output.object({ schema })`,
  `system`, `messages`, `temperature: definition.temperature ?? 0`,
  `maxOutputTokens: definition.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS` and
  `maxRetries: 0`, built in `packages/ai/src/agents/call-model.ts:44-56`, with
  the validation retry loop above it;
- chat: `streamText({ system, messages, tools, stopWhen: stepCountIs(8) })` in
  `packages/ai/src/chat/run-turn.ts`, with action tools registered without
  `execute`.

## Decisions

### D1. A `LanguageModelV4` adapter over `claude -p --json-schema`

The adapter implements `doGenerate` only. System messages of the call prompt
become `--system-prompt`; user content goes to stdin; a JSON response format
becomes `--json-schema`. The CLI's `structured_output` is returned as a single
text part, so the AI SDK's own `Output.object` parsing and the runtime's
validation and retry loop run unchanged above it. Each retry is one process.

`doStream`, tool definitions and file parts are rejected with an explicit
unsupported-functionality error, so a suite needing them is reported as
unmeasured rather than silently degraded.

_Alternatives_: calling the CLI from inside each runner (duplicates the runtime,
and the measured thing would no longer be the production path); a textual
tool-call protocol (`<tool_call>{…}</tool_call>`) for chat — rejected, it
measures obedience to an invented format, not native tool use.

### D2. Clean context without `--bare`

`--bare` forbids OAuth, so it cannot use the subscription. Isolation comes from
`--safe-mode`, `--setting-sources ""`, `--strict-mcp-config`, `--tools ""`,
`--disable-slash-commands` and `--no-session-persistence`, an empty `mkdtemp`
cwd removed after every call, and a child environment built from an allowlist
(`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `LANG`, `TMPDIR`) plus
`MAX_THINKING_TOKENS=0` (production does not enable reasoning). A denylist that
only drops `ANTHROPIC_API_KEY` would still pass `ANTHROPIC_AUTH_TOKEN`,
`ANTHROPIC_BASE_URL` and any variable a future CLI reads. The runner checks the
`init` message on every call (`apiKeySource === "none"`, no MCP servers, no
skills) and aborts otherwise: a stray key would bill the API silently.

Isolation is also checked by its effect: each pass opens with a calibration call
on a fixed minimal prompt. The smoke calls showed ~670 hidden input tokens;
above 1000 the pass stops with a context-leak fault, because something (a user
`CLAUDE.md`, a setting) escaped the flags.

Two locks keep the lane off CI: `CI` set makes it inert, and so does any
`EVAL_LIVE` other than `1`, which only the `eval:live` script sets. Unit tests
of the adapter inject `spawn` and never start the binary.

### D3. Rate limits are a harness fault, never a failure

The subscription quota is shared with the maintainer's daily work. Calls run one
at a time; `EVAL_MAX_CALLS` caps a pass by call count (the CLI's dollar figure
is notional, `costBasis: "list"`, so a dollar budget would cap nothing real) and
defaults to 50, counting calibration and retries; the runner reads
`rate_limit_event` through one pinned seven-day field whose name and scale come
from a real recorded event (the smoke calls saw 75 % but did not record the
field, so this is pinned before the guard ships; no "divide by 100 if large"
heuristic, which is ambiguous at 1), converts it to 0–1 by a fixed rule, and
stops before the next call once it is strictly above
`EVAL_MAX_WEEKLY_UTILIZATION` (0.85; D1b says "above", so 0.85 itself continues)
or the status is neither `allowed` nor `allowed_warning`. The fraction governs:
D1b's rule is "stop above 85 % of the weekly limit", so `allowed_warning`
continues and only the pinned fraction above 0.85 stops the pass; any other
status (`rejected` or a value the guard does not know) stops it. The guard fails closed: a missing or
unparseable signal stops the pass, since "no signal" cannot be read as "room
left"; an unrecognized event shape is the same fault. Stopped and rate-limited
cases are unmeasured — chatbot-kb counted 429s as failures and read a broken
lane as a regression.

### D4. Cassettes record provenance, replay never touches the CLI

A recording decorator wraps any `LanguageModelV4` and writes what it saw; the
replay runner feeds the recorded responses to `MockLanguageModelV4`. Same
interface in both directions, and the replay runner imports nothing from
`evals/claude-cli/`, so it stays keyless and may gate. Parity gaps
(`temperature` not honoured, ~670 hidden input tokens injected by the CLI,
`maxOutputTokens` not honoured) are recorded as warnings because they are real:
a cassette is a real decision of the production model under a noisier sampling
regime, not a bit-exact replica of an app call. That is why the live lane
supports `--repeat N` for an A/A run before any k-of-n floor is set.

The cassette is a strict allowlisted schema, not "the CLI result minus a
denylist": the `init` message carries `cwd` (a home path), `uuid` and
`session_id`, and a future CLI may add more. Unknown keys are rejected; live
reports follow the same rule and `eval-report-*.json` is gitignored.

The official model is the literal `claude-sonnet-5` (D1c), not
`getDefaultModel("anthropic")`, which moves with the catalog. A committed
cassette must have requested that id and been served it or a dated snapshot of
it (the smoke calls did not record which form `modelUsage` keys; the
calibration of 2026-10-23 showed the bare id, which is now the only form
accepted); `modelUsage` naming two models or a substitute rejects the
recording. Haiku iteration runs write to the gitignored
`packages/ai/.eval-cassettes/` or nowhere.

Staleness covers prompt, tools, fixture and request hash (system prompt,
messages, canonical schema, model id). The schema is hashed canonicalized (keys
sorted recursively, only `$schema` stripped) so an `ai`/`zod` bump that only
reshuffles serialization does not stale every cassette. `title` and
`description` stay in the hash: the schema is model-facing through
`--json-schema`, so editing a description changes what the model is asked. Empty
green is a fault, and exit non-zero was chosen over a "not a gate" label: the
replay runner is meant to gate, so a pass that measured nothing or found a stale
cassette must turn red rather than ask a reader to notice a label. PR 6 ships
only `recorder: "synthetic"` fixtures, which are never measured; the measured
path, the sentinel and staleness are tested with in-memory
`recorder: "claude-cli"` cassettes whose failure reasons are asserted. The lane
over committed cassettes joined `pnpm test` in the same commit as the first
real cassettes, so it was never red by construction in between.

The fixture hash covers only what the model sees: for the parser, the
benchmark text, the sport line input and `athleteZones`, exactly what reaches
the prompt. It does not cover scorer expectations (`minSteps`, `maxSteps`,
`zoneCheck`, `targetCheck`, `expectedRepeatCounts`, `category`, `language`).
Re-scoring a stored answer keylessly against tightened expectations is one of
the main points of a cassette, and an expectation change must not force a
quota-bound re-record; a change to anything the model is shown does.

A cassette holds exactly one model call, so replay runs the runtime with
`maxRetries: 0`: a retry would send a request carrying validation feedback
that no cassette holds, and a recorded answer that fails validation is a
measured failure, not a retry. A case is measured only when it consumed its
cassette (exactly one model call) and at least one scorer returned a verdict.
PR 7a's recorder SHALL record exactly one call per case, with the same
`maxRetries: 0`.

A committed manifest lists the expected real cassette ids, each with a digest of
its cassette file written by the recorder. Without the digest, rewriting a
cassette's hash fields to current values would make an old response look fresh,
an unblock nobody sees; with it, that edit fails unless the manifest digest
changes too, which shows in review. Without it, the only way to unblock a stale
cassette in CI would be a quota-bound local run or a silent delete. With it, a
missing or unlisted id fails, and the two unblock paths are explicit: re-record
locally, or retire the id in the manifest (a reviewed diff; a case still in the
suite also loses its benchmark, or it fails as uncovered). Stale fails on
every PR, bot bumps included: a dependency that changes the canonical schema
really changes the request. The alternative, letting stale pass on bot PRs, was
rejected because it is exactly the empty green this change exists to remove.

The chat-tool and lab runners do not call the live loader at all: they would
otherwise stop on the `EVAL_LIVE` opt-in before reporting their gap. They keep
their scripts, report every case unmeasured with the unsupported reason, and
exit zero. Detection (`claude auth status --json`) uses the same allowlisted
environment as model calls.

### D5. Inertness is "cannot run in CI", enforced by import

`check-no-inert-floors.mjs` detects inertness by the literal `load-eval-model`
and lists only the top level of `packages/ai/src/evals` (`readdirSync`, `:87`).
It becomes: a runner is inert if it names the old loader (until deleted),
imports anything resolving under `evals/claude-cli/` (specifiers resolved
against the importing file, so `./x` inside it counts), or lives there — not
only the loader, since a runner could build the adapter itself — and the scan is
recursive. The PR that adds the loader proves the guard fails on a nested runner
and on a direct adapter import.

The requirement is renamed to "A suite that cannot run in CI declares its own
inertness" (OpenSpec `RENAMED` then `MODIFIED` under the new name): a live
runner can execute locally, so "cannot execute" would mislabel it.

## Risks

- **Quota contention** (observed 75 % weekly utilization during the smoke calls)
  — mitigated by D3; official recordings with `claude-sonnet-5`, iteration with
  Haiku (D1c).
- **CLI flag drift** between versions (`--max-turns` absent in 2.1.302) — the
  CLI version goes into every cassette.
- **Coverage gap**: OpenAI and Google defaults are never measured live; the
  report says so.
- **Terms**: personal, local, low-volume use, never exposed to users or CI (D1a,
  confirmed by the maintainer).
