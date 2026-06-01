# @kaiord/ai

## 9.0.0

### Patch Changes

- Updated dependencies [a015501]
- Updated dependencies [82a7467]
- Updated dependencies [275c221]
- Updated dependencies [d597cb4]
  - @kaiord/core@9.0.0

## 8.0.0

### Patch Changes

- Updated dependencies [581239f]
  - @kaiord/core@8.0.0

## 7.3.2

### Patch Changes

- 5f3a93a: Disable the AI SDK's internal retry layer (`maxRetries: 0` on every `generateText` call). `executeWithRetry` already owns the retry loop and the non-retryable APICallError gate, so the SDK's `retry-with-exponential-backoff` was a redundant second layer — a retryable 5xx could fan out to up to (SDK-maxRetries+1) × (executeWithRetry-maxRetries+1) = 9 HTTP calls per user click. Collapsing to one layer makes the per-click HTTP cost predictable (≤ `maxRetries + 1` attempts) and unblocks the e2e flow b mock from needing the multi-call workaround.
- 51f98ba: Propagate non-retryable `APICallError` immediately from `executeWithRetry` instead of catching it as a prompt-correction retry. Auth errors (e.g. 401/403 from Anthropic) and other provider-classified non-retryable failures now surface in one call rather than three, saving tokens and latency for users with revoked or misconfigured API keys. Provider-classified retryable failures (overloaded errors, network blips) continue to retry as before, and schema validation failures still trigger the prompt-correction loop.

## 7.1.1

### Patch Changes

- 4fc4308: Internal build + CI hardening release. No public API changes, no runtime behavior changes.
  - **TypeScript 6.0.3**: toolchain migrated from TS 5.9.3 across all packages. Consumers can now opt into TS 6 without hitting `baseUrl` deprecation warnings in shipped type declarations.
  - **Dedupe vite to 8.x**: removed the dual-vite-major state in the lockfile (vite 7.3 was coming in via vitepress alpha). `pnpm.overrides` forces a single major.
  - **Dependabot sweep**: @garmin/fitsdk 21.200→21.201, vitest 4.1.4→4.1.5, tailwindcss 4.2.2→4.2.4, lucide-react 1.8→1.11, vue 3.5.32→3.5.33, ora 9.3→9.4, @codecov/vite-plugin 1.9→2.0, @fission-ai/openspec 1.3.0→1.3.1, plus 3 GitHub Actions version bumps.
  - **CI hardening**: Link-checker is now a required status check + lychee pinned to v0.24; `enforce_admins` enabled on main branch protection; CHANGELOG.md excluded from cspell; `pnpm-lock.yaml` excluded from prettier (eliminates a recurring push-time reformat loop).
  - **Build watchdog**: `scripts/check-tsup-ignoredeprecations.mjs` auto-fails lint the day tsup fixes [egoist/tsup#1388](https://github.com/egoist/tsup/issues/1388), so the repo self-heals to drop the last remaining `ignoreDeprecations` silencer without manual tracking.

  No API additions, removals, or behavioral changes. Published packages consume the same surface as 7.0.0.

- Updated dependencies [4fc4308]
  - @kaiord/core@7.1.1

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0

## 4.9.0

### Minor Changes

- 23c788c: feat: natural language to Garmin Connect web integration
  - Add AI workout generation UI with multi-provider support (Anthropic, OpenAI, Google)
  - Add Garmin Connect push flow via self-hostable Lambda proxy
  - Add Settings panel with AI provider, Garmin credentials, and privacy tabs
  - Add LLM eval suite with 22 curated benchmarks
  - Add Playwright E2E tests for AI generation, Garmin push, and settings flows
  - Add @kaiord/infra package for self-hostable AWS CDK stack

### Patch Changes

- Updated dependencies [23c788c]
  - @kaiord/core@4.9.0

## 4.8.0

### Minor Changes

- 8efe9ac: Add @kaiord/ai package for LLM-powered workout parsing via Vercel AI SDK v6
