# @kaiord/ai

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
