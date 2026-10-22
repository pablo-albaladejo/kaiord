# Design: Run live evals through the maintainer's local Claude subscription

## Context

All three eval runners (`run-evals.ts`, `run-chat-tool-evals.ts`,
`run-lab-extraction-evals.ts`) take their model from `load-eval-model.ts`,
which needs a provider API key the project will never hold. The keyless lanes
(fixture invariants, scorer tests, the `MockLanguageModelV4` runtime lane) are
the only ones that ever ran. The production calls are:

- parser and labs: `generateText({ output: Output.object({ schema }), system,
messages, temperature: definition.temperature ?? 0, maxOutputTokens:
definition.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS, maxRetries: 0 })`,
  built in `packages/ai/src/agents/call-model.ts:44-56`, with the validation
  retry loop above it;
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

`--bare` forbids OAuth, so it cannot use the subscription. Isolation comes
from `--safe-mode --setting-sources "" --strict-mcp-config --tools ""
--disable-slash-commands --no-session-persistence`, an empty `mkdtemp` cwd
removed after every call, and a child environment built from an allowlist
(`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `LANG`, `TMPDIR`) plus
`MAX_THINKING_TOKENS=0` (production does not enable reasoning). A denylist that
only drops `ANTHROPIC_API_KEY` would still pass `ANTHROPIC_AUTH_TOKEN`,
`ANTHROPIC_BASE_URL` and any variable a future CLI reads. The runner checks the
`init` message on every call (`apiKeySource === "none"`, no MCP servers, no
skills) and aborts otherwise: a stray key would bill the API silently.

Isolation is also checked by its effect: each pass opens with a calibration
call on a fixed minimal prompt. The smoke calls showed ~670 hidden input
tokens; above 1000 the pass stops with a context-leak fault, because something
(a user `CLAUDE.md`, a setting) escaped the flags.

Two locks keep the lane off CI: `CI` set makes it inert, and so does any
`EVAL_LIVE` other than `1`, which only the `eval:live` script sets. Unit tests
of the adapter inject `spawn` and never start the binary.

### D3. Rate limits are a harness fault, never a failure

The subscription quota is shared with the maintainer's daily work. Calls run
one at a time; `EVAL_MAX_CALLS` caps a pass by call count (the CLI's dollar
figure is notional, `costBasis: "list"`, so a dollar budget would cap nothing
real) and defaults to 50, counting calibration and retries; the runner reads
`rate_limit_event`, normalizes seven-day utilization to a 0–1 fraction, and
stops before the next call once it is strictly above
`EVAL_MAX_WEEKLY_UTILIZATION` (0.85; D1b says "above", so 0.85 itself
continues) or the status leaves `allowed*`. The guard fails closed: a missing
or unparseable signal stops the pass, since "no signal" cannot be read as "room
left". Stopped and rate-limited cases are unmeasured — chatbot-kb counted 429s
as failures and read a broken lane as a regression.

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
cassette must have requested and served that id; `modelUsage` naming two models
or a substitute rejects the recording. Haiku iteration runs write to the
gitignored `packages/ai/.eval-cassettes/` or nowhere.

Staleness covers prompt, tools, fixture and request hash (system prompt,
messages, schema, model id). Empty green is a fault, and exit non-zero was
chosen over a "not a gate" label: the replay runner is meant to gate, so a pass
that measured nothing or found a stale cassette must turn red rather than ask a
reader to notice a label. PR 6 ships only `recorder: "synthetic"` fixtures,
which are never measured; the lane joins `pnpm test` in PR 7a with the first
real cassettes, so it is never red by construction in between.

### D5. Inertness is "cannot run in CI", enforced by import

`check-no-inert-floors.mjs` detects inertness by the literal `load-eval-model`
and lists only the top level of `packages/ai/src/evals` (`readdirSync`, `:87`).
It becomes: a runner is inert if it names the old loader (until deleted) or
imports anything from `evals/claude-cli/` — not only the loader, since a runner
could build the adapter itself — and the scan is recursive. The PR that adds
the loader proves the guard fails on a nested runner and on a direct adapter
import.

The requirement is renamed to "A suite that cannot run in CI declares its own
inertness" (OpenSpec `RENAMED` then `MODIFIED` under the new name): a live
runner can execute locally, so "cannot execute" would mislabel it.

## Risks

- **Quota contention** (observed 75 % weekly utilization during the smoke
  calls) — mitigated by D3; official recordings with `claude-sonnet-5`,
  iteration with Haiku (D1c).
- **CLI flag drift** between versions (`--max-turns` absent in 2.1.302) — the
  CLI version goes into every cassette.
- **Coverage gap**: OpenAI and Google defaults are never measured live; the
  report says so.
- **Terms**: personal, local, low-volume use, never exposed to users or CI
  (D1a, confirmed by the maintainer).
