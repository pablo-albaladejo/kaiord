---
"@kaiord/ai": minor
"@kaiord/core": patch
"@kaiord/garmin-connect": patch
---

feat: natural language to Garmin Connect web integration

- Add AI workout generation UI with multi-provider support (Anthropic, OpenAI, Google)
- Add Garmin Connect push flow via self-hostable Lambda proxy
- Add Settings panel with AI provider, Garmin credentials, and privacy tabs
- Add LLM eval suite with 22 curated benchmarks
- Add Playwright E2E tests for AI generation, Garmin push, and settings flows
- Add @kaiord/infra package for self-hostable AWS CDK stack
