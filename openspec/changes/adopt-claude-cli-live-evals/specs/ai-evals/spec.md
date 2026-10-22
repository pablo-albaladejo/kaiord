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
treat as inert every runner that names the credential-bound loader, that
imports any module resolving under `evals/claude-cli/` (import specifiers are
resolved against the importing file, so a sibling import `./x` from inside that
directory counts), or that is itself located under `evals/claude-cli/`; it
SHALL scan `packages/ai/src/evals` recursively (not only its top level), and a
change to what it recognizes SHALL
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

#### Scenario: A runner inside the adapter directory is inert

- **GIVEN** a runner located under `evals/claude-cli/` that imports its siblings as `./x` and gates on a score
- **WHEN** the mechanical guard runs
- **THEN** it SHALL treat the runner as inert, report a violation and fail

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
`API_KEY_ENV` map SHALL be deleted. The parser runner SHALL take its model from
the local subscription-backed live loader. The chat-tool and lab-extraction
runners, whose calls that loader cannot carry (tool calling, document file
parts), SHALL NOT call or import the live loader: they keep their scripts
(`eval:chat-tools`, `eval:labs`), report every case as unmeasured with that
reason, and exit zero, so they never reach the `EVAL_LIVE` opt-in and never
fail.
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
`claude auth status --json` run with the same allowlisted child environment as
model calls, and SHALL fail with a message starting
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
`EVAL_MAX_CALLS` is unset the budget SHALL be 50. Weekly utilization is
compared as a fraction from 0 to 1. The rate-limit guard SHALL read one pinned
field of the CLI's `rate_limit_event` for the seven-day window, whose name and
scale are fixed in the guard from a real recorded event (the smoke calls
observed 75 % but did not record the field name or its scale, so the guard
cannot ship before they are pinned); the conversion to 0–1 SHALL be a fixed
rule for that field, never inferred from the value. It SHALL stop before the
next call once utilization is strictly above `EVAL_MAX_WEEKLY_UTILIZATION`
(default `0.85`, decision D1b: "stops above 85 %"), or once the CLI reports a
rate-limit status other than allowed. A call whose output carries no
`rate_limit_event`, an event of an unrecognized shape, or a pinned field that
is missing, non-numeric or outside its scale SHALL be a harness fault that
stops the pass: the guard fails closed. A rate limit, a 429, a missing or
unparseable signal, or a stopped pass SHALL leave the affected cases
unmeasured; it SHALL NOT be counted as a failed case.

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

- **GIVEN** a CLI response whose pinned seven-day field converts to exactly `0.85`
- **WHEN** the runner decides whether to make the next call
- **THEN** it SHALL continue, because the limit stops only above 85 %

#### Scenario: A missing rate-limit signal fails closed

- **GIVEN** a CLI response with no `rate_limit_event`, an event of an unrecognized shape, or a pinned field that is missing or outside its scale
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
over the system prompt, messages, canonical schema and model id, the sampling
settings
that applied, and a warning for each known parity gap with the production call
(at least: the temperature setting is not honoured, a hidden system overhead is
injected by the CLI, the output-token limit is not honoured). The response
content is the structured output, the finish reason and the token usage. The
validator SHALL reject any key outside that schema, so a field the CLI emits
(`cwd`, `uuid`, `session_id`, a home path, `rate_limit_info`, the account's
email or organization, or any field a future CLI version adds) can never reach
a committed cassette.

A cassette committed to the repository for replay SHALL have been recorded with
the pinned official model (decision D1c): its requested model id SHALL equal
`claude-sonnet-5`, and its served model id SHALL be `claude-sonnet-5` or a
dated snapshot of it (`claude-sonnet-5-` followed by an eight-digit date),
recorded verbatim in the cassette; the validator SHALL reject a committed
cassette otherwise. Whether `modelUsage` keys the bare or a dated id is not yet
observed and SHALL be checked against a real result before the recorder ships.
A recording whose CLI `modelUsage` names more than one served model, or one
that is neither the requested id nor a dated snapshot of it, SHALL be rejected
before it is written. A recording with any other model is an iteration run: it
SHALL be written only to a gitignored directory (`packages/ai/.eval-cassettes/`)
or not at all.

The replay runner SHALL feed recorded responses through `MockLanguageModelV4`
into the real runtime and SHALL import nothing from `evals/claude-cli/`, so it
needs no credential and no CLI and MAY gate in CI. Unit tests MAY build
cassettes in memory with `recorder: "claude-cli"`, never written to disk, so
the measured path is exercised before any real cassette exists; the schema
rules apply to them, the committed-cassette rules (official model, manifest) do
not. A cassette whose prompt
hash, tools hash, fixture hash or request hash (which covers the schema and the
model id) differs from the current one is **stale**: its case is unmeasured
with a stale-cassette reason, neither passing nor failing. The schema enters
the request hash **canonicalized**: object keys sorted recursively and the
`$schema` key removed at every level, nothing else, so serialization churn from
an `ai` or `zod` upgrade (key order, a new `$schema` URI) leaves a cassette
fresh. Every other key stays in the hash, including `title` and `description`:
the schema reaches the model through `--json-schema`, so a changed field
description is a changed request and makes the cassette stale. A synthetic cassette SHALL never count
as measured and SHALL never decide an exit code.

An empty green is not a pass: a replay pass that measures zero cases, or that
finds any stale cassette, SHALL exit non-zero with a fault naming the reason
(zero measured, or the stale cassettes by id). Tests of these failures and of
the scorer sentinel SHALL assert the reason (zero measured, the stale ids, the
failing case id and scorer), not only a non-zero exit. No replay lane over
committed cassettes SHALL be part of `pnpm test` until the same change commits
the first real cassette and its manifest entry; until then the replay runner
runs only inside unit tests over in-memory and synthetic cassettes, so
`pnpm test` is never red by construction.

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

#### Scenario: Serialization churn does not make a cassette stale

- **GIVEN** a dependency bump that only reorders the keys of the serialized output schema or changes its `$schema` URI
- **WHEN** the replay runner recomputes the request hash
- **THEN** the canonical hash SHALL be unchanged and the cassette SHALL stay fresh

#### Scenario: A changed field description makes a cassette stale

- **GIVEN** a cassette recorded against an output schema whose only later change is the `description` of one field
- **WHEN** the replay runner recomputes the request hash
- **THEN** the hash SHALL differ and the case SHALL be unmeasured with a stale-cassette reason

#### Scenario: Stale or empty replay never passes silently

- **GIVEN** a replay pass that measures zero cases, or that finds at least one stale cassette
- **WHEN** it finishes
- **THEN** it SHALL exit non-zero with a fault naming the reason, even if no scored case failed

#### Scenario: The measured path is tested before real cassettes exist

- **GIVEN** a unit test that builds an in-memory cassette with `recorder: "claude-cli"` and a sabotaged scorer case
- **WHEN** the replay runner runs it
- **THEN** it SHALL count the case as measured and fail with a reason naming the case id and the scorer, and no cassette file SHALL be written

#### Scenario: A stale failure names its ids

- **GIVEN** a unit test with one in-memory cassette whose prompt hash is out of date
- **WHEN** the replay runner finishes
- **THEN** the test SHALL assert that the fault names that cassette id as stale, not only that the exit code is non-zero

#### Scenario: A synthetic cassette never gates

- **GIVEN** only cassettes with `recorder: "synthetic"`
- **WHEN** the replay runner runs
- **THEN** no case SHALL be counted as measured, and the pass SHALL exit non-zero as zero measured

#### Scenario: Replay is keyless

- **GIVEN** an environment with no Claude Code CLI and no provider credential
- **WHEN** the replay runner runs
- **THEN** it SHALL execute every non-stale real cassette and MAY exit non-zero on a scorer failure

### Requirement: Committed cassettes are pinned by a manifest

The committed cassette directory SHALL carry a committed manifest with one
entry per real cassette expected there: its id and a SHA-256 digest of the
cassette file, both written by the recorder when it records the cassette. The
replay lane SHALL fail when a listed id has no cassette, when a real cassette
is present whose id is not listed, when a cassette file's digest differs from
its manifest entry, and when a listed cassette is stale. Each such failure
SHALL name the affected ids and the only two ways to unblock it: **re-record
the case locally through the live lane, or retire the id in the manifest**.
Retiring an id SHALL
be a removal from the manifest plus deletion of the cassette in the same diff,
so it is visible and reviewed; deleting a cassette without retiring its id
fails. Editing a cassette by hand, including rewriting its hash fields to the
current values so an old response looks fresh, changes its file digest and
fails naming the id; making such an edit pass requires changing the digest in
the manifest too, which is itself a visible, reviewed line in the diff. The
recorder is the only writer of a digest.

A stale real cassette SHALL fail CI on every pull request, including bot pull
requests (for example a dependency bump that changes the canonical output
schema and therefore the request hash): the request really changed, and a
pass that ignored it would replay a response to a request the production code
no longer makes. The failure message SHALL say so and name both unblock paths,
so the maintainer re-records locally within the quota (D1b) or retires the id.

#### Scenario: A missing cassette fails

- **GIVEN** a manifest listing `parse-basic` and no cassette with that id
- **WHEN** the replay lane runs
- **THEN** it SHALL fail naming `parse-basic` as missing and the two unblock paths

#### Scenario: Retiring an id is a reviewed diff

- **GIVEN** a change that deletes a committed cassette and removes its id from the manifest
- **WHEN** the replay lane runs
- **THEN** it SHALL pass that check, and the retirement SHALL appear as a manifest line removed in the diff

#### Scenario: An unlisted cassette fails

- **GIVEN** a real cassette in the committed directory whose id is not in the manifest
- **WHEN** the replay lane runs
- **THEN** it SHALL fail naming that id as unlisted

#### Scenario: A cassette edited without a manifest digest change fails

- **GIVEN** a committed cassette whose hash fields were rewritten by hand to the current values while its manifest digest was left unchanged
- **WHEN** the replay lane runs
- **THEN** it SHALL fail naming that cassette id as not matching its manifest digest

#### Scenario: A bot bump that changes the schema fails with the unblock paths

- **GIVEN** a dependency bump pull request that changes the canonical output schema so a listed cassette's request hash no longer matches
- **WHEN** CI runs the replay lane
- **THEN** it SHALL fail naming the stale ids and stating "re-record locally, or retire the id in the manifest"
