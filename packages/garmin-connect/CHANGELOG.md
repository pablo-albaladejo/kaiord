# @kaiord/garmin-connect

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
  - @kaiord/garmin@7.1.1

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0
  - @kaiord/garmin@7.0.0

## 6.0.0

### Major Changes

- 89896ab: Redesign Garmin auth provider with separated concerns
  - **TokenManager**: encapsulated token state with generation counter, best-effort persistence, and subscriber-pattern concurrent refresh
  - **Retry wrapper**: `withRetry(fetchFn)` with exponential backoff and full jitter for transient failures (429, 5xx, network errors)
  - **Two fetch paths**: raw fetch for SSO login (no retry), retry-wrapped fetch for API calls
  - **Auth provider decoupled**: no longer creates/returns HTTP client; accepts TokenManager as dependency
  - **HTTP client refactored**: receives narrowed `TokenReader` type; uses token generation to prevent redundant refreshes on concurrent 401s
  - **Client factory**: sync `createGarminConnectClient()` with `await client.init()` for token auto-restore; returns named `GarminConnectClient` type

  BREAKING: `createGarminAuthProvider` signature changed, `createGarminConnectClient` returns new shape, `GarminHttpClient` no longer public.

## 5.0.0

### Patch Changes

- Updated dependencies [22f13a0]
  - @kaiord/garmin@5.0.0

## 4.9.0

### Patch Changes

- 23c788c: feat: natural language to Garmin Connect web integration
  - Add AI workout generation UI with multi-provider support (Anthropic, OpenAI, Google)
  - Add Garmin Connect push flow via self-hostable Lambda proxy
  - Add Settings panel with AI provider, Garmin credentials, and privacy tabs
  - Add LLM eval suite with 22 curated benchmarks
  - Add Playwright E2E tests for AI generation, Garmin push, and settings flows
  - Add @kaiord/infra package for self-hostable AWS CDK stack

- Updated dependencies [23c788c]
  - @kaiord/core@4.9.0

## 4.8.1

### Patch Changes

- 2bb0ffd: Internal: lint fixes, vitest config, and type import cleanup across adapter packages
- Updated dependencies [2bb0ffd]
  - @kaiord/garmin@4.8.1

## 4.6.0

### Minor Changes

- 7a7a4fe: Add @kaiord/garmin-connect package: Garmin Connect API client with SSO authentication, workout listing, and workout pushing via KRD format
