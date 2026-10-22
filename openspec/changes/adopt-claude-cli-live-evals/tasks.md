# Tasks

## 1. Spec (this PR)

- [x] 1.1 Delta on `ai-evals`: RENAME and MODIFY inertness (no API key
      anywhere; inert = cannot run in CI), REMOVE "Provider-generalized manual
      eval loader", ADD "Local subscription-backed live loader" and "Cassette
      provenance".

## 2. Cassettes and replay (PR 6)

- [ ] 2.1 Cassette type and keyless validator as a strict allowlisted schema
      (provenance fields + response content); any unknown key is rejected and
      named, so `cwd`, `uuid`, `session_id`, home paths, rate-limit info, email,
      organization and future CLI fields cannot be committed. A committed
      cassette with `recorder: "claude-cli"` is rejected unless its requested
      requested model id equals `claude-sonnet-5` and its served id is
      `claude-sonnet-5` or a dated snapshot of it. Committed-cassette rules apply
      only to files in the committed directory; tests may build in-memory
      `recorder: "claude-cli"` cassettes that are never written.
- [ ] 2.2 Hashes: prompt, tools, fixture, and request (system prompt, messages,
      schema, model id); a mismatch in any of the four makes the case
      unmeasured with a stale-cassette reason. Tests cover a changed prompt, a
      changed schema and a changed model id, and assert the stale ids in the
      fault, not only the exit code.
- [ ] 2.3 Replay runner over `MockLanguageModelV4` through the real runtime;
      it imports nothing from `evals/claude-cli/`; a test pins that.
- [ ] 2.4 Empty green is a fault: zero measured cases or any stale cassette
      exits non-zero naming the reason. Only fixture cassettes with
      `recorder: "synthetic"` are committed in this PR; no replay lane over
      committed cassettes enters `pnpm test` here (it joins in 3.5, in the same
      commit as the first real cassette). Tests assert the reason: a
      synthetic-only pass fails as zero measured; one stale in-memory cassette
      fails naming its id.
- [ ] 2.5 Sentinel: an in-memory `recorder: "claude-cli"` cassette with a
      sabotaged scorer case is measured and fails with a reason naming the case
      id and scorer (asserted, not only the exit code).
- [ ] 2.6 Manifest of committed real cassette ids (empty in this PR) and its
      checks: missing id, unlisted cassette and stale cassette each fail
      naming the ids and "re-record locally, or retire the id in the
      manifest"; retiring = manifest line removed + cassette deleted in one
      diff. Stale fails on every PR, bot PRs included.

## 3. Live lane over the local subscription (PR 7a)

- [ ] 3.1 `evals/claude-cli/detect-claude-cli.ts` (`claude auth status --json`;
      `CI` set → inert; `EVAL_LIVE !== "1"` → inert; no email or organization
      kept; runs with the same allowlisted env as model calls). `eval:live` is the only script that sets `EVAL_LIVE=1`.
- [ ] 3.2 `spawn-claude.ts`: argument array, stdin prompt, `mkdtemp` cwd removed
      in a `finally`, clean-context flags, child env built from the allowlist
      (`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `LANG`, `TMPDIR`,
      `MAX_THINKING_TOKENS=0`) with a test that `ANTHROPIC_API_KEY`,
      `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` never pass; `init` check.
      All adapter/spawner/detector tests inject `spawn`; none runs `claude`.
- [ ] 3.3 `claude-cli-language-model.ts`: `LanguageModelV4.doGenerate`, parity
      warnings, unsupported tools/file parts/stream.
- [ ] 3.4 `rate-limit-guard.ts`: before it ships, pin the seven-day field name
      and its scale from a real recorded `rate_limit_event` (not recorded in the
      smoke calls) and convert by a fixed rule; stop strictly above
      `EVAL_MAX_WEEKLY_UTILIZATION` (default 0.85); a missing event, an
      unrecognized shape or an out-of-scale field is a harness fault that stops
      the pass (tests for exactly 0.85, 0.86, missing, unknown shape); `EVAL_MAX_CALLS` default 50, counting
      calibration and retries; concurrency 1; limits are harness faults, never
      failures. Calibration call at pass start: input tokens above 1000
      (observed overhead ~670) stop the pass with a context-leak fault.
- [ ] 3.5 Recording decorator writing cassettes with provenance. The official
      model is the literal `claude-sonnet-5` (not `getDefaultModel`). Before it
      ships, check against a real result whether `modelUsage` keys the bare id
      or a dated snapshot and pin that in the validator. A result whose
      `modelUsage` names more than one model, or one that is neither the
      requested id nor a dated snapshot of it, is rejected; any other model records only to the gitignored
      `packages/ai/.eval-cassettes/` or not at all. Add that directory and
      `eval-report-*.json` to `.gitignore`; live reports use a strict schema
      that rejects unknown keys. Commit the first real cassettes, their manifest
      entries and the replay lane in `pnpm test` in one commit.
- [ ] 3.6 `load-live-model.ts`; the parser runner migrates; the chat-tool and
      lab runners drop the loader and report every case unmeasured with the
      unsupported reason, exit 0; `eval:live` for the parser with
      `--repeat N`; cost reported as API-equivalent.
- [ ] 3.7 `check-no-inert-floors.mjs` treats any import from `evals/claude-cli/`
      as inert and scans `packages/ai/src/evals` recursively (today
      `readdirSync` of the top level only), resolving import specifiers against
      the importing file; provoked reds show the guard fails on a nested
      runner, on a runner importing the adapter directly, and on a runner
      located under `evals/claude-cli/` importing siblings as `./x`.
- [ ] 3.8 Delete `load-eval-model.ts` and `.github/workflows/eval.yml`; update
      `check-model-ids-fresh.mjs`, the eval docs, the Purpose line of
      `openspec/specs/ai-evals/spec.md` (names `EVAL_PROVIDER`), the `eval*`
      script echoes in `packages/ai/package.json`, and the root `CLAUDE.md`
      descriptions of `check-model-ids-fresh.mjs` and `check-no-inert-floors.mjs`
      that mention `eval.yml` and `load-eval-model`.
