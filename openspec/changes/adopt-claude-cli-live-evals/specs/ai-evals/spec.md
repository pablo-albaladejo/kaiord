## MODIFIED Requirements

### Requirement: A suite that cannot execute declares its own inertness

No eval code in this project SHALL read a provider API key, in CI or locally.
The only live model access SHALL be the maintainer's local Claude Code
subscription, reached through the local subscription-backed live loader, and
that access SHALL never run in CI. A suite is therefore **inert** when its
runner cannot execute in CI: it obtains its model through a loader that needs a
credential the project does not have, or through the local subscription-backed
live loader.

An inert runner SHALL state, in the runner itself, that it cannot execute in
CI, why, and what it does instead (for the live lane: report and record
cassettes, without a threshold). Such a runner SHALL NOT exit non-zero on the
basis of a score, because a comparison that cannot run in CI is not a gate and
presenting one as a gate is the failure this capability exists to prevent. A
live pass rate MAY inform a manual release decision; it SHALL NOT block CI.

The obligation is on the **runner's exit behaviour**, not on any syntactic form
of it: extracting the comparison to a variable does not satisfy it. The
mechanical guard that enforces it SHALL recognize every loader that makes a
runner inert, by an explicit list or an explicit in-file marker, and a change to
that list SHALL be proven by a provoked failure of the guard. A runner that CAN
obtain everything it needs in CI without a credential is unaffected and MAY
gate.

#### Scenario: An unrunnable runner says so

- **WHEN** a reader opens a runner whose model comes from a credential-bound loader or from the local subscription-backed live loader
- **THEN** the file SHALL state that it cannot execute in CI and what it does instead

#### Scenario: No score decides the exit code of an inert runner

- **GIVEN** a runner that obtains its model through a credential-bound loader or through the local subscription-backed live loader
- **WHEN** its exit path is inspected
- **THEN** no score, rate or threshold comparison SHALL determine the exit code, whether written inline or bound to a variable first

#### Scenario: The live loader is recognized as inert

- **GIVEN** a runner that takes its model from the local subscription-backed live loader and does not mention the credential-bound loader
- **WHEN** the mechanical guard scans it with a score comparison deciding its exit code
- **THEN** the guard SHALL report a violation and fail

#### Scenario: No API key reaches a live run

- **GIVEN** `ANTHROPIC_API_KEY` set in the maintainer's shell
- **WHEN** the live loader spawns the Claude Code CLI
- **THEN** the child process environment SHALL NOT contain `ANTHROPIC_API_KEY`, and the run SHALL abort if the CLI reports any API key source other than none

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
`EVAL_MODEL`, defaulting to the catalog default `getDefaultModel("anthropic")`.
Only Anthropic models are reachable; OpenAI and Google defaults SHALL be
reported as not measured, never as passing.

The loader SHALL detect availability before any model call, through
`claude auth status --json`, and SHALL fail with a message starting
`INERT: claude CLI not available` and naming the reason when: the `CI`
environment variable is set; the binary is missing; the CLI is not logged in;
the auth method is not the claude.ai subscription; or the API provider is not
first-party. It SHALL NOT log or store the account's email or organization.

Every call SHALL run from a freshly created empty temporary directory, with the
arguments passed as an array (no shell), the user prompt on stdin, the
production system prompt passed whole through `--system-prompt`, all built-in
tools, slash commands, settings sources, MCP servers and session persistence
disabled, extended thinking disabled, and `ANTHROPIC_API_KEY` removed from the
child's environment. A live pass SHALL run calls one at a time, SHALL stop
after `EVAL_MAX_CALLS` model calls, and SHALL stop before its next call once
the CLI reports a rate-limit status other than allowed or a seven-day
utilization at or above `EVAL_MAX_WEEKLY_UTILIZATION` (default `0.85`). A rate
limit, a 429 or a stopped pass SHALL be a harness fault that leaves the
affected cases unmeasured; it SHALL NOT be counted as a failed case.

The notional cost the CLI reports SHALL be presented as "API-equivalent cost",
never as money spent. The live runner SHALL support repeating a pass a stated
number of times and reporting, per case, how many of the repetitions passed, so
a k-of-n floor can be derived from a measured A/A run; it SHALL NOT gate on that
result.

#### Scenario: CI is never a live environment

- **GIVEN** the `CI` environment variable is set
- **WHEN** a live eval CLI starts
- **THEN** it SHALL fail with an `INERT: claude CLI not available` message before spawning any model call

#### Scenario: An API-key login is not the subscription

- **GIVEN** a Claude Code CLI authenticated by API key rather than by a claude.ai subscription
- **WHEN** the live loader runs detection
- **THEN** it SHALL refuse with an `INERT` message naming the auth method

#### Scenario: The weekly window stops the pass

- **GIVEN** a live pass in progress and a CLI response reporting seven-day utilization of `0.86`
- **WHEN** the runner decides whether to make the next call
- **THEN** it SHALL stop, report the remaining cases as unmeasured with a rate-limit reason, and SHALL NOT report them as failed

#### Scenario: The call budget is enforced

- **GIVEN** `EVAL_MAX_CALLS=3` and a suite needing more calls
- **WHEN** the live pass runs
- **THEN** it SHALL make at most three model calls and report the rest as unmeasured

#### Scenario: Cost is not reported as spend

- **WHEN** a live pass reports cost
- **THEN** it SHALL label the figure as API-equivalent cost

### Requirement: Cassette provenance

A model response recorded for replay (a cassette) SHALL carry its provenance:
the recorder (`claude-cli`), the CLI version, the provider, the model id the
response was actually served by, the recording time, the prompt id, version
and hash, the tools hash, the fixture hash, a request hash over the system
prompt, messages, schema and model id, the sampling settings that applied, and
a warning for each known parity gap with the production call (at least: the
temperature setting is not honoured, a hidden system overhead is injected by
the CLI, the output-token limit is not honoured). A cassette SHALL NOT contain
the account's email or organization, a session id, or rate-limit information.

The replay runner SHALL feed recorded responses through `MockLanguageModelV4`
into the real runtime and SHALL import nothing from the live CLI adapter, so it
needs no credential and no CLI and MAY gate in CI. A cassette whose prompt,
tools or fixture hash differs from the current one SHALL make its case
unmeasured with a stale-cassette reason, neither passing nor failing.

#### Scenario: Provenance is recorded

- **WHEN** the live runner records a response
- **THEN** the cassette SHALL name the recorder, CLI version, served model id and parity warnings

#### Scenario: Account data never reaches a cassette

- **GIVEN** a CLI result carrying a session id and rate-limit information
- **WHEN** it is recorded
- **THEN** neither SHALL appear in the cassette

#### Scenario: A changed prompt makes a cassette stale

- **GIVEN** a cassette recorded against an earlier prompt hash
- **WHEN** the replay runner loads it
- **THEN** the case SHALL be unmeasured with a stale-cassette reason

#### Scenario: Replay is keyless

- **GIVEN** an environment with no Claude Code CLI and no provider credential
- **WHEN** the replay runner runs
- **THEN** it SHALL execute every non-stale cassette and MAY exit non-zero on a scorer failure
