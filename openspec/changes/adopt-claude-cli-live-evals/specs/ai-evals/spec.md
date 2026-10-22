## RENAMED Requirements

<!-- The prior name ("cannot execute") no longer describes the rule: a live
runner CAN execute on the maintainer's machine. What makes it inert is that it
cannot run in CI. The requirement itself survives, restated below. -->

- FROM: `### Requirement: A suite that cannot execute declares its own inertness`
- TO: `### Requirement: A suite that cannot run in CI declares its own inertness`

## MODIFIED Requirements

### Requirement: A suite that cannot run in CI declares its own inertness

No eval code in this project SHALL read a provider API key, in CI or locally.
The only live model access SHALL be the maintainer's local Claude Code
subscription, reached through the local subscription-backed live loader, and
that access SHALL never run in CI. A suite is therefore **inert** when its
runner cannot execute in CI: it obtains its model through a loader that needs a
credential the project does not have, or it imports anything from
`packages/ai/src/evals/claude-cli/` (the live loader, the CLI adapter, the
spawner, the rate-limit guard or any other module there).

An inert runner SHALL state, in the runner itself, that it cannot execute in
CI, why, and what it does instead (for the live lane: report and record
cassettes, without a threshold). Such a runner SHALL NOT exit non-zero on the
basis of a score, because a comparison that cannot run in CI is not a gate and
presenting one as a gate is the failure this capability exists to prevent. A
live pass rate MAY inform a manual release decision; it SHALL NOT block CI.

The obligation is on the **runner's exit behaviour**, not on any syntactic form
of it: extracting the comparison to a variable does not satisfy it. The
mechanical guard that enforces it (`scripts/check-no-inert-floors.mjs`) SHALL
treat as inert every runner that names the credential-bound loader or imports
any module under `evals/claude-cli/`, SHALL scan `packages/ai/src/evals`
recursively (not only its top level), and a change to what it recognizes SHALL
be proven by a provoked failure of the guard. A runner that CAN obtain
everything it needs in CI without a credential is unaffected and MAY gate.

#### Scenario: An unrunnable runner says so

- **WHEN** a reader opens a runner whose model comes from a credential-bound loader or that imports from `evals/claude-cli/`
- **THEN** the file SHALL state that it cannot execute in CI and what it does instead

#### Scenario: No score decides the exit code of an inert runner

- **GIVEN** a runner that obtains its model through a credential-bound loader or imports from `evals/claude-cli/`
- **WHEN** its exit path is inspected
- **THEN** no score, rate or threshold comparison SHALL determine the exit code, whether written inline or bound to a variable first

#### Scenario: Any import from the live adapter directory makes a runner inert

- **GIVEN** a runner that imports the CLI adapter directly from `evals/claude-cli/`, not the live loader, and does not mention the credential-bound loader
- **WHEN** the mechanical guard scans it with a score comparison deciding its exit code
- **THEN** the guard SHALL report a violation and fail

#### Scenario: A nested runner is scanned

- **GIVEN** a runner in a subdirectory of `packages/ai/src/evals` that imports from `evals/claude-cli/` and gates on a score
- **WHEN** the mechanical guard runs
- **THEN** it SHALL find that runner and fail

#### Scenario: No credential reaches a live run

- **GIVEN** `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` set in the maintainer's shell
- **WHEN** the live loader spawns the Claude Code CLI
- **THEN** the child process environment SHALL contain none of them, and the run SHALL abort if the CLI reports any API key source other than none

#### Scenario: A keyless runner may still gate

- **GIVEN** a runner that obtains everything it needs in CI without a credential, such as the cassette replay runner
- **WHEN** it computes a result
- **THEN** it MAY exit non-zero on that result, and this requirement SHALL NOT be read to forbid it

## REMOVED Requirements

### Requirement: Provider-generalized manual eval loader

**Reason**: It built the model from `EVAL_PROVIDER` plus a provider API key in
the environment. This project holds no API key anywhere, so the loader could
only throw, and the scenario it specified (`EVAL_PROVIDER=google` with a Google
key) can never occur. It is replaced by "Local subscription-backed live
loader".

**Migration**: `packages/ai/src/evals/load-eval-model.ts` and its
`API_KEY_ENV` map SHALL be deleted. Every runner that imported `loadEvalModel`
SHALL take its model from the local subscription-backed live loader. A suite
whose calls that loader cannot carry (tool calling, document file parts) SHALL
report every case as unmeasured with that reason rather than fail.
`EVAL_PROVIDER` is no longer read. `.github/workflows/eval.yml`, which only
existed to invoke the old loader with a repository secret that will never
exist, SHALL be deleted, and `scripts/check-model-ids-fresh.mjs` SHALL stop
listing it.

## ADDED Requirements

### Requirement: Local subscription-backed live loader

The live eval CLIs SHALL obtain their model through one loader that drives the
maintainer's locally installed Claude Code CLI in headless mode (`claude -p`)
behind a `LanguageModelV4` adapter, so the real agent runtime (prompt assembly,
validation, retry with feedback) runs unchanged above it. The model id SHALL be
`EVAL_MODEL`, defaulting to the pinned official cassette model
`claude-sonnet-5`, written as a literal constant in the loader and never derived
from `getDefaultModel`, whose value can move with the catalog. Any other
Anthropic id (for example `claude-haiku-4-5` or `claude-haiku-5-5`) is an
iteration model. Only Anthropic models are reachable; OpenAI and Google
defaults SHALL be reported as not measured, never as passing.

The loader SHALL detect availability before any model call, through
`claude auth status --json`, and SHALL fail with a message starting
`INERT: claude CLI not available` and naming the reason when: the `CI`
environment variable is set; `EVAL_LIVE` is not exactly `1` (only the
`eval:live` package script sets it, so a bare `tsx` invocation or a CI job
without that script is inert even when `CI` is unset); the binary is missing;
the CLI is not logged in; the auth method is not the claude.ai subscription; or
the API provider is not first-party. It SHALL NOT log or store the account's
email or organization. Unit tests of the adapter, spawner and detector SHALL
inject the `spawn` function and SHALL never start the real `claude` binary.

Every call SHALL run from a freshly created empty temporary directory, removed
after the call whether it succeeded or failed, with the arguments passed as an
array (no shell), the user prompt on stdin, the production system prompt passed
whole through `--system-prompt`, all built-in tools, slash commands, settings
sources, MCP servers and session persistence disabled, and extended thinking
disabled (`MAX_THINKING_TOKENS=0`). The child's environment SHALL be built from
an explicit allowlist of the variables the CLI needs to locate its binary and
its own login (`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `LANG`, `TMPDIR`),
plus `MAX_THINKING_TOKENS`; every other variable of the parent, in particular
any `ANTHROPIC_*` or `CLAUDE_*` variable, SHALL be absent.

Each pass SHALL begin with one calibration call carrying a fixed minimal prompt;
its reported input tokens (including cache reads and writes) measure the hidden
overhead the CLI injects, observed at about 670 tokens. If that overhead exceeds
1000 tokens, the pass SHALL stop with a harness fault naming a probable context
leak (for example a user `CLAUDE.md` or a setting that escaped isolation), and
no case SHALL be measured.

A live pass SHALL run calls one at a time and SHALL stop after `EVAL_MAX_CALLS`
model calls, counting the calibration call and every retry; when
`EVAL_MAX_CALLS` is unset the budget SHALL be 50. Weekly utilization is a
fraction from 0 to 1: the rate-limit guard SHALL normalize the CLI's seven-day
utilization to that scale (a value reported as a percentage is divided by 100)
and SHALL stop before the next call once it is strictly above
`EVAL_MAX_WEEKLY_UTILIZATION` (default `0.85`, decision D1b: "stops above
85 %"), or once the CLI reports a rate-limit status other than allowed. A call
whose output carries no seven-day rate-limit signal, or one the guard cannot
parse or normalize into 0–1, SHALL be a harness fault that stops the pass: the
guard fails closed. A rate limit, a 429, a missing or unparseable signal, or a
stopped pass SHALL leave the affected cases unmeasured; it SHALL NOT be counted
as a failed case.

The notional cost the CLI reports SHALL be presented as "API-equivalent cost",
never as money spent. The live runner SHALL support repeating a pass a stated
number of times and reporting, per case, how many of the repetitions passed, so
a k-of-n floor can be derived from a measured A/A run; it SHALL NOT gate on that
result. A live report written to disk SHALL follow the same allowlist rule as a
cassette: a strict schema whose validator rejects any unknown key, and
`eval-report-*.json` SHALL be gitignored.

#### Scenario: CI is never a live environment

- **GIVEN** the `CI` environment variable is set
- **WHEN** a live eval CLI starts
- **THEN** it SHALL fail with an `INERT: claude CLI not available` message before spawning any model call

#### Scenario: Live runs need the explicit opt-in

- **GIVEN** `CI` is unset and `EVAL_LIVE` is not `1`
- **WHEN** a live runner is started directly with `tsx`
- **THEN** it SHALL fail with an `INERT: claude CLI not available` message naming the missing opt-in, before spawning any process

#### Scenario: An API-key login is not the subscription

- **GIVEN** a Claude Code CLI authenticated by API key rather than by a claude.ai subscription
- **WHEN** the live loader runs detection
- **THEN** it SHALL refuse with an `INERT` message naming the auth method

#### Scenario: Adapter tests never start the binary

- **WHEN** the adapter, spawner and detector unit tests run
- **THEN** every process they start SHALL come from an injected `spawn` double, and none SHALL execute `claude`

#### Scenario: The weekly window stops the pass

- **GIVEN** a live pass in progress and a CLI response reporting seven-day utilization of `0.86`
- **WHEN** the runner decides whether to make the next call
- **THEN** it SHALL stop, report the remaining cases as unmeasured with a rate-limit reason, and SHALL NOT report them as failed

#### Scenario: The threshold itself does not stop the pass

- **GIVEN** a CLI response reporting seven-day utilization of exactly `0.85`, or `85` on a percentage scale
- **WHEN** the runner decides whether to make the next call
- **THEN** it SHALL normalize the value to `0.85` and continue, because the limit stops only above 85 %

#### Scenario: A missing rate-limit signal fails closed

- **GIVEN** a CLI response with no seven-day utilization, or one that cannot be parsed into a fraction from 0 to 1
- **WHEN** the runner decides whether to make the next call
- **THEN** it SHALL stop the pass with a harness fault and leave the remaining cases unmeasured

#### Scenario: The call budget is enforced

- **GIVEN** `EVAL_MAX_CALLS=3` and a suite needing more calls
- **WHEN** the live pass runs
- **THEN** it SHALL make at most three model calls and report the rest as unmeasured

#### Scenario: The call budget has a finite default

- **GIVEN** `EVAL_MAX_CALLS` is unset
- **WHEN** the live pass runs
- **THEN** it SHALL make at most 50 model calls

#### Scenario: Leaked context is a fault

- **GIVEN** a calibration call reporting more than 1000 input tokens for the fixed minimal prompt
- **WHEN** the pass starts
- **THEN** it SHALL stop with a context-leak harness fault and measure no case

#### Scenario: Cost is not reported as spend

- **WHEN** a live pass reports cost
- **THEN** it SHALL label the figure as API-equivalent cost

### Requirement: Cassette provenance

A model response recorded for replay (a cassette) SHALL conform to a strict,
allowlisted schema: the provenance fields and the response content, nothing
else. The provenance fields are the recorder (`claude-cli` for a real
recording, `synthetic` for a hand-written fixture), the CLI version, the
provider, the requested model id, the served model id, the recording time, the
prompt id, version and hash, the tools hash, the fixture hash, a request hash
over the system prompt, messages, schema and model id, the sampling settings
that applied, and a warning for each known parity gap with the production call
(at least: the temperature setting is not honoured, a hidden system overhead is
injected by the CLI, the output-token limit is not honoured). The response
content is the structured output, the finish reason and the token usage. The
validator SHALL reject any key outside that schema, so a field the CLI emits
(`cwd`, `uuid`, `session_id`, a home path, `rate_limit_info`, the account's
email or organization, or any field a future CLI version adds) can never reach
a committed cassette.

A cassette committed to the repository for replay SHALL have been recorded with
the pinned official model: its requested and served model ids SHALL both equal
`claude-sonnet-5` (decision D1c), and the validator SHALL reject a committed
cassette otherwise. A recording whose CLI `modelUsage` names more than one
served model, or one that differs from the requested model, SHALL be rejected
before it is written. A recording with any other model is an iteration run: it
SHALL be written only to a gitignored directory (`packages/ai/.eval-cassettes/`)
or not at all.

The replay runner SHALL feed recorded responses through `MockLanguageModelV4`
into the real runtime and SHALL import nothing from `evals/claude-cli/`, so it
needs no credential and no CLI and MAY gate in CI. A cassette whose prompt
hash, tools hash, fixture hash or request hash (which covers the schema and the
model id) differs from the current one is **stale**: its case is unmeasured
with a stale-cassette reason, neither passing nor failing. A synthetic cassette
SHALL never count as measured and SHALL never decide an exit code.

An empty green is not a pass: a replay pass that measures zero cases, or that
finds any stale cassette, SHALL exit non-zero with a fault naming the reason
(zero measured, or the stale cassettes by id). Because synthetic fixtures are
never measured, the replay lane joins `pnpm test` only once at least one real
cassette is committed; until then the replay runner is exercised by unit tests
over synthetic fixtures.

#### Scenario: Provenance is recorded

- **WHEN** the live runner records a response
- **THEN** the cassette SHALL name the recorder, CLI version, requested and served model ids and parity warnings

#### Scenario: An unknown key is rejected

- **GIVEN** a cassette or a live report carrying a key outside its schema, such as the `init` message's `cwd` or a `session_id`
- **WHEN** the validator checks it
- **THEN** it SHALL reject the file, naming the key

#### Scenario: A committed cassette was recorded by the official model

- **GIVEN** a cassette in the committed cassette directory whose served model is `claude-haiku-4-5`
- **WHEN** the validator checks it
- **THEN** it SHALL reject the cassette as not recorded with `claude-sonnet-5`

#### Scenario: A mixed or substituted model is not recorded

- **GIVEN** a CLI result whose `modelUsage` names two models, or one model other than the requested one
- **WHEN** the recorder receives it
- **THEN** it SHALL reject the recording and write no cassette

#### Scenario: Iteration recordings stay out of the repository

- **GIVEN** a live pass with `EVAL_MODEL=claude-haiku-5-5` and recording enabled
- **WHEN** it records responses
- **THEN** the cassettes SHALL be written only under the gitignored iteration directory

#### Scenario: A changed prompt makes a cassette stale

- **GIVEN** a cassette recorded against an earlier prompt hash
- **WHEN** the replay runner loads it
- **THEN** the case SHALL be unmeasured with a stale-cassette reason

#### Scenario: A changed schema or model id makes a cassette stale

- **GIVEN** a cassette whose request hash was computed over an earlier output schema or another model id
- **WHEN** the replay runner loads it
- **THEN** the case SHALL be unmeasured with a stale-cassette reason

#### Scenario: Stale or empty replay never passes silently

- **GIVEN** a replay pass that measures zero cases, or that finds at least one stale cassette
- **WHEN** it finishes
- **THEN** it SHALL exit non-zero with a fault naming the reason, even if no scored case failed

#### Scenario: A synthetic cassette never gates

- **GIVEN** only cassettes with `recorder: "synthetic"`
- **WHEN** the replay runner runs
- **THEN** no case SHALL be counted as measured, and the pass SHALL exit non-zero as zero measured

#### Scenario: Replay is keyless

- **GIVEN** an environment with no Claude Code CLI and no provider credential
- **WHEN** the replay runner runs
- **THEN** it SHALL execute every non-stale real cassette and MAY exit non-zero on a scorer failure
