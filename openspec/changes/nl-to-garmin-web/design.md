# Design: Natural Language to Garmin Connect (Web)

## Context

The SPA (`@kaiord/workout-spa-editor`) is a React 19 + Zustand + Tailwind app. It currently handles workout editing and format conversion, but has no AI integration and no Garmin Connect push. The `@kaiord/ai` package provides NL → Workout via Vercel AI SDK (provider-agnostic). The `@kaiord/garmin-connect` package handles Garmin SSO auth + workout push but requires Node.js (CORS-blocked from browser).

## Goals

- Users describe a workout in natural language and it ends up on their Garmin device
- Zero server-side credential storage
- Self-hostable infrastructure for privacy-conscious users
- Reuse existing packages (`@kaiord/ai`, `@kaiord/garmin-connect`, `@kaiord/garmin`)

## Non-Goals

- Native mobile app
- LLM providers beyond Anthropic, OpenAI, and Google (extensible architecture allows adding more later)
- Garmin activity download (only push)
- Multi-user / auth system on our side

## Decisions

### D1: Multi-provider LLM direct from browser (not proxied)

**Layer:** Adapters (SPA)

**Decision:** Call LLM APIs directly from the browser for all supported providers. All three major providers allow CORS:

- **Anthropic:** `anthropic-dangerous-direct-browser-access` header, `Access-Control-Allow-Origin: *`
- **OpenAI:** `dangerouslyAllowBrowser: true`, CORS allowed
- **Google Gemini:** API key in URL, CORS allowed

The user's API keys go straight to the provider, never touch our infra.

**Rationale:** Verified via browser tests that Anthropic, OpenAI, and Google Gemini all accept cross-origin requests. This eliminates a proxy for LLM calls entirely.

**Alternative considered:** Proxy LLM calls through Lambda — rejected because it adds latency, cost, and we'd handle API keys unnecessarily.

**Trade-off:** API keys are visible in browser devtools during requests. Users must understand this risk. Clear disclaimers address this.

### D2: Vercel AI SDK multi-provider in browser

**Layer:** Adapters (SPA)

**Decision:** Use Vercel AI SDK provider packages in the browser:

- `@ai-sdk/anthropic` → `createAnthropic({ apiKey, dangerouslyAllowBrowser: true })`
- `@ai-sdk/openai` → `createOpenAI({ apiKey, dangerouslyAllowBrowser: true })`
- `@ai-sdk/google` → `createGoogleGenerativeAI({ apiKey })`

The existing `@kaiord/ai` `createTextToWorkout()` function works as-is — it accepts any `LanguageModel`. No changes needed to the `@kaiord/ai` package.

**Rationale:** `@kaiord/ai` is already provider-agnostic via Vercel AI SDK. We just need to create the appropriate model instance in the browser and pass it in. Adding providers is a matter of adding the SDK package and a factory function.

**New dependencies in SPA:** `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@kaiord/ai`.

### D3: Lambda proxy for Garmin (not popup/extension)

**Layer:** Adapters (Lambda)

**Decision:** A single Lambda function behind API Gateway handles the full Garmin flow: SSO login → KRD → GCN conversion → push. Receives credentials per-request, discards after.

**Rationale:** Garmin blocks CORS on all endpoints (SSO, OAuth, workout API). A popup-based flow only solves login but not the OAuth exchange or push. A Lambda is the simplest stateless proxy. Using Lambda + API Gateway keeps infra minimal and pay-per-use.

**Alternatives considered:**

- Browser popup for SSO → only solves login, not push (OAuth + workout API also CORS-blocked)
- Browser extension → poor UX, distribution complexity
- Electron/Tauri app → different product, not web
- Pre-exported tokens via CLI → bad UX, tokens expire

### D4: CDK package for self-hosting

**Layer:** New package (`@kaiord/infra`)

**Decision:** A standalone CDK (TypeScript) package that deploys the complete Lambda + API Gateway stack. Users run `cdk deploy` and get their own endpoint.

**Rationale:** Maximum transparency. Users who don't trust our hosted Lambda can deploy their own. The CDK stack is auditable — same code as in the repo.

**Stack resources:**

- Lambda function (Node.js 20, bundled with `@kaiord/garmin-connect` + `@kaiord/garmin` + `@kaiord/core`)
- API Gateway HTTP API (CORS configured for `*`)
- CloudWatch log group (with credential-scrubbing log filter)
- No DynamoDB, no S3, no secrets manager

### D5: Web Crypto API for credential encryption

**Layer:** Adapters (SPA)

**Decision:** Use Web Crypto API (`SubtleCrypto`) with AES-GCM to encrypt credentials in localStorage. Key derived via PBKDF2 from a user passphrase, or a CryptoKey stored in IndexedDB (non-exportable).

**Rationale:** Native browser API, no dependencies. AES-GCM provides authenticated encryption. PBKDF2 makes brute-force passphrase attacks slow.

**Alternative considered:** No encryption (plaintext localStorage) — rejected for obvious security reasons. Third-party encryption library — rejected because Web Crypto API is sufficient and zero-dependency.

### D6: Zustand store for AI + Garmin state

**Layer:** Adapters (SPA)

**Decision:** Two new Zustand stores:

- `ai-store`: List of configured providers (each with: id, provider type, API key encrypted, model name, label, isDefault), custom system prompt, generation state (loading/error/result), selected provider id for current generation
- `garmin-store`: Garmin credentials (encrypted), Lambda URL (configurable), push state (loading/error/result), connection status

**Rationale:** SPA already uses Zustand for all state (workout-store, profile-store, library-store, clipboard-store). Follows existing patterns. The ai-store holds an array of provider configs, enabling multi-model support with one marked as default.

### D7: Lambda receives KRD, not Workout

**Layer:** Application

**Decision:** The Lambda receives a full KRD document (not a raw Workout object). Inside the Lambda, it uses `toText(krd, garminWriter)` for conversion and `garminConnectClient.service.push(krd)` for push.

**Rationale:** KRD is the canonical format (per spec). The browser already produces KRD via `createWorkoutKRD()`. Sending KRD keeps the Lambda's contract aligned with the core architecture.

### D8: Conversion happens in the Lambda

**Layer:** Application

**Decision:** KRD → GCN conversion happens inside the Lambda, not in the browser. The browser sends KRD, the Lambda converts to GCN and pushes.

**Rationale:** The Lambda already needs `@kaiord/garmin-connect` (which internally uses `@kaiord/garmin` for conversion). Doing conversion in the Lambda keeps the browser bundle smaller and the API contract simpler (one format in, one result out).

### D9: Playwright E2E tests with mocked APIs

**Layer:** Adapters (SPA)

**Decision:** E2E tests use Playwright with intercepted network requests. LLM API calls are mocked to return fixture Workout JSON. Lambda endpoint is mocked to return fixture PushResult. No real API calls in E2E.

**Rationale:** E2E tests run on every PR — they must be fast, free, and deterministic. Real LLM calls are slow (~3s), cost money, and produce non-deterministic output. Mocking at the network layer (Playwright `route.fulfill()`) tests the full UI flow without external dependencies.

**Alternative considered:** Component tests only — rejected because the integration between stores, crypto, and API calls needs full browser testing.

### D10: LLM eval suite separate from unit/E2E tests

**Layer:** Application (`@kaiord/ai`)

**Decision:** Evals live in `packages/ai/src/evals/` and run via a dedicated script (`pnpm --filter @kaiord/ai eval`), NOT as part of `pnpm test`. Evals use real LLM calls and are run locally by the developer. An optional CI workflow (`eval.yml`) with `workflow_dispatch` allows manual triggering from GitHub Actions — never automatic, never scheduled.

**Rationale:** Evals are slow (20+ LLM calls × ~3s each = ~1 minute), cost money (API usage), and are inherently non-deterministic. They must never block PRs or run automatically. The developer decides when to run them (locally after changing prompts, or via manual CI trigger before a release).

**Eval framework:** Simple custom runner — iterate benchmark cases, call `createTextToWorkout()`, validate output against assertions, produce JSON report. No need for heavy eval frameworks (Braintrust, Promptfoo) at this stage.

**Benchmark dataset:** `packages/ai/src/evals/benchmarks.json` — curated set of 20+ workout descriptions with expected assertions (sport, min/max steps, zone ranges).

### D11: Eval assertions — structural, not semantic

**Decision:** Evals assert on structural properties (valid schema, correct sport, plausible step count, zone values within range), NOT on exact output (specific step names, exact durations). LLMs are non-deterministic — asserting exact output would make evals flaky.

**Thresholds:**

- Schema validity: 100% (every output must parse)
- Sport correctness: ≥95%
- Zone accuracy (when provided): ≥90%
- Overall pass rate: ≥90%

## Risks and Mitigations

| Risk                                                    | Mitigation                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Garmin changes SSO flow, breaking Lambda                | `@kaiord/garmin-connect` is versioned; pin Lambda dependency. Monitor with integration tests.                |
| User's API key exposed in browser devtools              | Clear disclaimer. Anthropic's own naming (`dangerous-direct-browser-access`) communicates this.              |
| Lambda cold start adds latency to push                  | Garmin SSO is already ~2-3s. Cold start (~1s) is negligible in comparison.                                   |
| Garmin rate-limits or blocks Lambda IP                  | Use user-provided credentials (not a single service account). Each push is independent.                      |
| User forgets passphrase for encrypted storage           | Provide "reset credentials" option that clears and re-enters.                                                |
| LLM output quality degrades after provider model update | Eval suite catches regressions. Run evals after bumping AI SDK or when providers release new model versions. |
| Eval costs accumulate                                   | Manual trigger only — developer decides when to spend. Use cheapest model that passes thresholds.            |

## Open Questions

None — all major decisions resolved during explore phase.
