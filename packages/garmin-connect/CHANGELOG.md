# @kaiord/garmin-connect

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
