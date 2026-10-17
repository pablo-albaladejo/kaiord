# Tasks

## 1. Spec (this PR)

- [x] 1.1 Delta on `ai-evals`: MODIFY inertness (no API key anywhere; inert =
      cannot run in CI), REMOVE "Provider-generalized manual eval loader",
      ADD "Local subscription-backed live loader" and "Cassette provenance".

## 2. Cassettes and replay (PR 6)

- [ ] 2.1 Cassette type and keyless validator with every provenance field;
      reject account data (email, organization, session id, rate-limit info).
- [ ] 2.2 Hashes: prompt, tools, fixture, request; a mismatch makes the case
      unmeasured with a stale-cassette reason.
- [ ] 2.3 Replay runner over `MockLanguageModelV4` through the real runtime;
      it imports nothing from `evals/claude-cli/`; a test pins that.
- [ ] 2.4 Sentinel: a sabotaged scorer case turns the replay lane red.

## 3. Live lane over the local subscription (PR 7a)

- [ ] 3.1 `evals/claude-cli/detect-claude-cli.ts` (`claude auth status --json`,
      `CI` → inert, no email or organization kept).
- [ ] 3.2 `spawn-claude.ts`: argument array, stdin prompt, `mkdtemp` cwd,
      clean-context flags, env without `ANTHROPIC_API_KEY`,
      `MAX_THINKING_TOKENS=0`, `init` check.
- [ ] 3.3 `claude-cli-language-model.ts`: `LanguageModelV4.doGenerate`, parity
      warnings, unsupported tools/file parts/stream.
- [ ] 3.4 `rate-limit-guard.ts` (0.85 weekly default), `EVAL_MAX_CALLS`,
      concurrency 1; limits are harness faults, never failures.
- [ ] 3.5 Recording decorator writing cassettes with provenance.
- [ ] 3.6 `load-live-model.ts`; runners migrate; `eval:live` for the parser with
      `--repeat N`; cost reported as API-equivalent.
- [ ] 3.7 `check-no-inert-floors.mjs` recognizes the live loader; a provoked red
      shows the guard fails.
- [ ] 3.8 Delete `load-eval-model.ts` and `.github/workflows/eval.yml`; update
      `check-model-ids-fresh.mjs` and the eval docs.
