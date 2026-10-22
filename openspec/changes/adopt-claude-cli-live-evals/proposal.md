# Proposal: Run live evals through the maintainer's local Claude subscription

## Why

`harden-ai-evals` (archived 2026-09-08) rested on one premise: **there will be
no provider API key, now or later**. Every runner took its model from
`load-eval-model.ts`, which throws without a key, so every live suite was
declared inert and `.github/workflows/eval.yml` was kept as a shape that can
never run. That was correct, and it left the project with no way to ever
measure a prompt against a real model: no prompt in `@kaiord/ai` has been
scored against one.

A model can be reached without a key. The maintainer's Claude Code
installation, signed in to a claude.ai Max subscription, runs headless with
`claude -p`. Verified on Claude Code 2.1.302 (two smoke calls, 2026-10-17):

- `--system-prompt` replaces the whole system prompt, `--json-schema` returns a
  validated `structured_output`, and `--output-format json` reports `usage`,
  `modelUsage` (keyed by the served model id) and a notional
  `total_cost_usd` with `costBasis: "list"`.
- The exact catalog id `claude-sonnet-5` is accepted, not only an alias.
- `--bare` is unusable: it allows only `ANTHROPIC_API_KEY`/`apiKeyHelper`, never
  the subscription. A clean context is reached instead with the flags below,
  run from an empty temporary directory with `ANTHROPIC_API_KEY` removed from
  the child's environment (the implementation builds that environment from an
  allowlist). The `init` message then reports
  `apiKeySource: "none"`, no MCP servers, no skills.

  ```
  claude -p --safe-mode --setting-sources "" --strict-mcp-config --tools "" \
    --disable-slash-commands --no-session-persistence
  ```

- The same smoke call returned a `rate_limit_event` with the seven-day window at
  75 % and overage disabled: evals compete with the maintainer's daily use of
  the same quota.

The maintainer has decided (2026-10-17): this use is personal, local, low
volume and never in CI (D1a); a live pass stops above 85 % weekly utilization
(D1b); official cassettes are recorded with `claude-sonnet-5`, iteration uses a
Haiku model (D1c).

So the premise changes from "no key, so nothing live" to **"no API key,
anywhere; live runs only through the maintainer's local subscription, never in
CI"**. What was a proposal-level premise becomes a normative statement in the
spec, and the inertness rule that depended on it is redefined around the thing
that actually separates a gate from a report: whether the runner can execute in
CI.

## What Changes

- **The premise becomes normative.** No provider API key is read by any eval
  code, in CI or locally. The only live model access is the maintainer's local
  Claude Code subscription, and it can never run in CI.
- **Inertness is redefined as "cannot run in CI".** That covers both the old
  credential-bound loader and the new local-subscription loader. The mechanical
  guard (`scripts/check-no-inert-floors.mjs`) today detects inertness by the
  literal string `load-eval-model` (`:35,52`); a runner taking its model from
  the new loader would not contain it and would be allowed to gate while being
  unable to run in CI. The guard SHALL recognize every live loader, and the fix
  ships in the same PR as the loader, proven by a provoked red.
- **"Provider-generalized manual eval loader" is replaced** by a local,
  subscription-backed live loader: `EVAL_MODEL` (default the pinned literal
  `claude-sonnet-5`, never `getDefaultModel`), Anthropic only, an explicit
  `EVAL_LIVE=1` opt-in on top of the `CI` lock, detection declared through
  `claude auth status --json`, clean-context invocation with an allowlisted
  child environment and a context-leak tripwire, a fail-closed rate-limit guard
  that stops above 0.85 weekly utilization, a call budget (`EVAL_MAX_CALLS`,
  default 50), concurrency 1, and cost reported as "API-equivalent cost", never
  as spend. OpenAI and Google
  are no longer reachable from an eval; that gap is declared, not hidden.
- **Cassette provenance is added.** Real responses are recorded once and
  replayed keyless through `MockLanguageModelV4`; every cassette is a strict
  allowlisted schema stating who recorded it, with which CLI version and which
  requested and served model, against which prompt, tools, fixture and request
  hashes, and which parity gaps applied (no `temperature`, hidden system
  overhead, no `maxOutputTokens`). Committed cassettes are `claude-sonnet-5`
  only; Haiku iteration stays gitignored. A replay pass that measures nothing
  or finds a stale cassette exits non-zero. A committed manifest of expected cassette ids makes a missing
  or retired cassette a reviewed diff; a stale one fails naming the ids and the
  two unblock paths (re-record locally, or retire the id). The replay runner imports nothing
  from the CLI adapter, so it stays keyless and may gate.
- **`.github/workflows/eval.yml` is deleted** (in the implementing PR): it can
  never have a secret, so it is a shape with no possible path.
  `scripts/check-model-ids-fresh.mjs` scans it and is updated in the same PR.
- **Explicitly NOT in this change**: the chat-with-tools live lane (an MCP
  server exposing the real `ChatTool`s, spike 7b) — undecided; until then the
  chat trajectory stays on scripted mocks and the chat runner declares the gap.
  Lab extraction live runs, which need document file parts the CLI adapter
  cannot carry on stdin, are likewise out until verified.

## Capabilities

### Modified Capabilities

- `ai-evals`: the no-key premise becomes normative and is narrowed to "no API
  key, anywhere; live only through the local subscription, never in CI";
  inertness is redefined as "cannot run in CI"; the provider-generalized loader
  is replaced by a local subscription-backed live loader; cassette provenance is
  added.

`spa-ai-chat`, `ai-guardrails`, `ai-prompts`, `ai-agents` and
`ai-observability` are unchanged.

## Impact

- **Packages**: `@kaiord/ai` (public). `src/evals/**` is not a build entry and
  not in `exports`; the implementing PRs touch only eval-internal code and need
  no runtime changeset unless a public export changes.
- **Dependencies**: none added. The live lane shells out to the `claude` binary
  already installed on the maintainer's machine; nothing in CI installs or calls
  it.
- **CI**: unchanged in what blocks a merge. The keyless replay lane joins
  `pnpm test`; the live lane is manual (`pnpm --filter @kaiord/ai eval:live`)
  and never runs in CI. `eval.yml` is deleted.
- **Security and privacy**: the child process never sees `ANTHROPIC_API_KEY`,
  `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL` or any variable outside the
  allowlist;
  the CLI runs from an empty temporary directory so no `CLAUDE.md`, settings,
  hooks, plugins or MCP servers of the maintainer leak into the prompt; account
  data (email, organization, `session_id`, `rate_limit_info`, `cwd`) is never
  written to a cassette or a live report, because both are allowlisted schemas
  and the repo is public.
- **Terms**: personal, local, small-batch use of a documented Claude Code mode;
  never exposed to Kaiord users nor to CI (D1a).
- **Delivery**: PR 6 (cassettes + replay, synthetic fixtures only), then PR 7a (`evals/claude-cli/`,
  `eval:live` for the parser, `--repeat` for A/A, guard fix, removal of
  `load-eval-model.ts` and `eval.yml`). PR 7b (chat MCP spike) is not part of
  this change.
