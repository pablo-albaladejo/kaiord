# Design: Run live evals through the maintainer's local Claude subscription

## Context

All three eval runners (`run-evals.ts`, `run-chat-tool-evals.ts`,
`run-lab-extraction-evals.ts`) take their model from `load-eval-model.ts`,
which needs a provider API key the project will never hold. The keyless lanes
(fixture invariants, scorer tests, the `MockLanguageModelV4` runtime lane) are
the only ones that ever ran. The production calls are:

- parser and labs: `generateText({ output: Output.object({ schema }), system,
messages, temperature: definition.temperature ?? 0, maxOutputTokens: 4096,
maxRetries: 0 })` in `packages/ai/src/agents/generate-mode.ts`, with the
  validation retry loop above it;
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
--disable-slash-commands --no-session-persistence`, an empty `mkdtemp` cwd, and
an environment without `ANTHROPIC_API_KEY` and with `MAX_THINKING_TOKENS=0`
(production does not enable reasoning). The runner checks the `init` message on
every call (`apiKeySource === "none"`, no MCP servers, no skills) and aborts
otherwise: a stray key would bill the API silently.

### D3. Rate limits are a harness fault, never a failure

The subscription quota is shared with the maintainer's daily work. Calls run
one at a time; `EVAL_MAX_CALLS` caps a pass by call count (the CLI's dollar
figure is notional, `costBasis: "list"`, so a dollar budget would cap nothing
real); the runner reads `rate_limit_event` and stops before the next call once
seven-day utilization reaches `EVAL_MAX_WEEKLY_UTILIZATION` (0.85, decision
D1b) or the status leaves `allowed*`. Stopped and rate-limited cases are
unmeasured — chatbot-kb counted 429s as failures and read a broken lane as a
regression.

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

### D5. Inertness is "cannot run in CI", enforced by name

`check-no-inert-floors.mjs` detects inertness by the literal `load-eval-model`.
It becomes a list of live loaders (the new live loader and, until it is
deleted, the old one) and the PR that adds the loader proves the extended guard
fails on a provoked violation.

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
