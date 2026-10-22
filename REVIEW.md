# Reviewing a Kaiord PR

This file is for every reviewer, AI or human. It adds no new rules. Each
pass points at a rule that already lives in [CLAUDE.md](./CLAUDE.md),
[AGENTS.md](./AGENTS.md), a `scripts/check-*.mjs` guard, a hook in
[.claude/settings.json](./.claude/settings.json), or [openspec/](./openspec/AGENTS.md).
When this file and one of those disagree, the source wins. Fix this file.

## Passes

Run every pass on every PR. (This is a convention of this file, not a
repo rule.)

### 1. Correctness

- Does the code do what the PR says, for every input? Check null, empty
  input, swallowed errors, and races.
- Conversions go through KRD. Round trips stay inside the tolerances:
  time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm.
- Strict TypeScript: no `any` escape, `type` over `interface`, separate
  `import type`. The `*-bridge` packages are plain JavaScript by design.

### 2. Architecture

- Layer order: `domain` → `ports` → `application` → `adapters`. No layer
  imports a layer to its right (R-ArchLeftward).
- `domain` imports only the libraries in `DOMAIN_EXTERNAL_ALLOWLIST`
  (`zod`, `@noble/hashes`, in `scripts/architecture.vocab.mjs`).
  `application` imports no external library (R-ArchAppPure). `ports` holds
  types only, no runtime code (R-ArchPortPure).
- Source: `scripts/check-architecture.mjs` (`pnpm lint:architecture`, run
  in CI) and [hexagonal-arch](./openspec/specs/hexagonal-arch/spec.md).
- `scripts/boundaries-allowlist.mjs` only shrinks. A new entry there is a
  finding: fix the import instead.
- State: Zustand only for the editor runtime, Dexie + `useLiveQuery` for
  persisted data, React state for local UI (CLAUDE.md "State Management").
  `check-no-zustand-writethrough` enforces part of it: no Zustand store
  writes Dexie directly.
- Size: files ≤100 lines, functions <40 lines (60 for React components).
  Tests are exempt. No JSDoc preamble that explains a file split.

### 3. Tests

- Every in-scope `it()` title starts with `should `, and every body has
  `// Arrange`, `// Act`, `// Assert` in order, with blank lines separating
  the sections ([test-conventions](./openspec/specs/test-conventions/spec.md)).
- Every test asserts an observable outcome. No suite targets a pure
  re-export barrel ([test-minimality](./openspec/specs/test-minimality/spec.md)).
- A `*.converter.ts` has a sibling test. A `*.mapper.ts` has none.
- Coverage stays at 80% for core packages and 70% for frontend. A lowered
  threshold or a wider `coverage.exclude` is a finding.
- A non-trivial script in `scripts/` has a co-located `*.test.mjs`.

### 4. Security and privacy

- Local-first: a new path that sends user data off the device is a
  finding. The known paths are the ones the
  [README](./README.md#-local-first-architecture) lists (opt-in Drive
  `drive.appdata` sync, bridges on the user's own session) and the user's
  chosen AI provider, called from the browser
  ([ai-providers](./openspec/specs/ai-providers/spec.md)).
- Bridges never store, send, or manage credentials
  ([adapter-contracts](./openspec/specs/adapter-contracts/spec.md)). Any
  change to a bridge's permissions, hosts, or read allowlist must update the
  golden in `check-bridge-privacy-surface`.
- Toast, `console.*` and `analytics.event` first arguments are static
  literals (`check-no-pii-leakage`).
- A chat tool returns outside text to the model only through
  `fenceUntrusted(...)`, and every chat tool sink is declared
  (`check-untrusted-fields-fenced`, `check-model-facing-sinks`).
- No secrets in code, logs, or fixtures.

### 5. Spec artifacts

- A feature or non-trivial fix has a change in `openspec/changes/<slug>/`
  (proposal, design, tasks), and its tasks are ticked as they land
  ([openspec/AGENTS.md](./openspec/AGENTS.md)).
- A changed domain spec follows `openspec/SPEC_TEMPLATE.md` and passes
  `pnpm lint:specs`.
- A change under a publishable package (`core`, `cli`, `fit`, `tcx`, `zwo`,
  `garmin`, `garmin-connect`, `mcp`, `ai`) has a changeset.

### 6. The gate actually ran

A green check is evidence only if work stands behind it. Report each of
these as a finding, not as a pass:

- An AI review that reports SUCCESS but did not review. On
  [#1333](https://github.com/pablo-albaladejo/kaiord/pull/1333), CodeRabbit
  posted SUCCESS ("Review rate limited") next to a "Review limit reached"
  comment. No review happened.
- A skipped job, or a runner with no credential. The eval runner
  `packages/ai/src/evals/run-evals.ts` is marked INERT: it needs a provider
  key that this project does not have, so it has never run.
  `check-no-inert-floors` keeps a score threshold off it for that reason.
- A red job that is not required. "Green" means the full CI run, not the
  required subset (see "Automated nightly maintenance" in AGENTS.md).
- A test that is skipped without a condition (`check-no-unconditional-skip`).

## Severity

- **Important** blocks the merge: a bug, a broken rule from the sources
  above, missing tests or spec artifacts, a privacy leak, or a gate that
  did not run. The `code-reviewer` agent's CRITICAL and IMPORTANT map here.
- **Nit** does not block: naming, wording, or a simpler form of correct
  code. The agent's SUGGESTION maps here.

Each finding gives file and line, problem, fix, and how to check the fix,
as in the `code-reviewer` agent's output format.
