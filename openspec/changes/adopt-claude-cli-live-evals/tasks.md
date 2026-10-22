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
      and served model ids both equal `claude-sonnet-5`.
- [ ] 2.2 Hashes: prompt, tools, fixture, and request (system prompt, messages,
      schema, model id); a mismatch in any of the four makes the case
      unmeasured with a stale-cassette reason. Tests cover a changed prompt, a
      changed schema and a changed model id.
- [ ] 2.3 Replay runner over `MockLanguageModelV4` through the real runtime;
      it imports nothing from `evals/claude-cli/`; a test pins that.
- [ ] 2.4 Empty green is a fault: zero measured cases or any stale cassette
      exits non-zero naming the reason. Only fixture cassettes with
      `recorder: "synthetic"` ship in this PR; they are never measured and
      never gate, and the replay lane stays out of `pnpm test` until PR 7a
      commits a real cassette. Tests: synthetic-only pass exits non-zero as
      zero measured; one stale cassette exits non-zero.
- [ ] 2.5 Sentinel: a sabotaged scorer case turns the replay lane red.

## 3. Live lane over the local subscription (PR 7a)

- [ ] 3.1 `evals/claude-cli/detect-claude-cli.ts` (`claude auth status --json`;
      `CI` set → inert; `EVAL_LIVE !== "1"` → inert; no email or organization
      kept). `eval:live` is the only script that sets `EVAL_LIVE=1`.
- [ ] 3.2 `spawn-claude.ts`: argument array, stdin prompt, `mkdtemp` cwd removed
      in a `finally`, clean-context flags, child env built from the allowlist
      (`PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`, `LANG`, `TMPDIR`,
      `MAX_THINKING_TOKENS=0`) with a test that `ANTHROPIC_API_KEY`,
      `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` never pass; `init` check.
      All adapter/spawner/detector tests inject `spawn`; none runs `claude`.
- [ ] 3.3 `claude-cli-language-model.ts`: `LanguageModelV4.doGenerate`, parity
      warnings, unsupported tools/file parts/stream.
- [ ] 3.4 `rate-limit-guard.ts`: normalizes seven-day utilization to 0–1, stops
      strictly above `EVAL_MAX_WEEKLY_UTILIZATION` (default 0.85), a missing or
      unparseable signal is a harness fault that stops the pass (tests for
      0.85, 85, 0.86, missing, garbage); `EVAL_MAX_CALLS` default 50, counting
      calibration and retries; concurrency 1; limits are harness faults, never
      failures. Calibration call at pass start: input tokens above 1000
      (observed overhead ~670) stop the pass with a context-leak fault.
- [ ] 3.5 Recording decorator writing cassettes with provenance. The official
      model is the literal `claude-sonnet-5` (not `getDefaultModel`); a result
      whose `modelUsage` names more than one model or a model other than the
      requested one is rejected; any other model records only to the gitignored
      `packages/ai/.eval-cassettes/` or not at all. Add that directory and
      `eval-report-*.json` to `.gitignore`; live reports use a strict schema
      that rejects unknown keys. Commit the first real cassettes and add the
      replay lane to `pnpm test`.
- [ ] 3.6 `load-live-model.ts`; runners migrate; `eval:live` for the parser with
      `--repeat N`; cost reported as API-equivalent.
- [ ] 3.7 `check-no-inert-floors.mjs` treats any import from `evals/claude-cli/`
      as inert and scans `packages/ai/src/evals` recursively (today
      `readdirSync` of the top level only); provoked reds show the guard fails
      on a nested runner and on a runner importing the adapter directly.
- [ ] 3.8 Delete `load-eval-model.ts` and `.github/workflows/eval.yml`; update
      `check-model-ids-fresh.mjs`, the eval docs, the Purpose line of
      `openspec/specs/ai-evals/spec.md` (names `EVAL_PROVIDER`), the `eval*`
      script echoes in `packages/ai/package.json`, and the root `CLAUDE.md`
      descriptions of `check-model-ids-fresh.mjs` and `check-no-inert-floors.mjs`
      that mention `eval.yml` and `load-eval-model`.
