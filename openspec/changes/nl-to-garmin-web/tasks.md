# Tasks: Natural Language to Garmin Connect (Web)

## 1. New Package: `@kaiord/infra`

- [x] 1.1 Scaffold `packages/infra/` with `package.json`, `tsconfig.json`, CDK config
- [x] 1.2 Create CDK stack: Lambda + API Gateway (CORS `*`) + CloudWatch log group
- [x] 1.3 Implement Lambda handler: parse request body (KRD + Garmin creds)
- [x] 1.4 Lambda handler: validate KRD with Zod schema
- [x] 1.5 Lambda handler: Garmin SSO login using `@kaiord/garmin-connect`
- [x] 1.6 Lambda handler: push KRD via `garminConnectClient.service.push(krd)`
- [x] 1.7 Lambda handler: return `{ id, name, url }` or error response
- [x] 1.8 Lambda handler: ensure no credentials in CloudWatch logs (scrub/mask)
- [x] 1.9 Add error handling: 400 (invalid KRD), 401 (Garmin auth failed), 500 (API error)
- [x] 1.10 Test Lambda handler locally with `sam local invoke` or unit tests
- [x] 1.11 Add integration test: mock Garmin SSO, verify full pipeline
- [x] 1.12 Add README with self-hosting instructions (`cdk deploy`)
- [ ] 1.13 Update CI: add `@kaiord/infra` to test matrix

## 2. SPA: Encrypted Credential Storage

- [x] 2.1 Create `packages/workout-spa-editor/src/lib/crypto.ts` — AES-GCM encrypt/decrypt with Web Crypto API
- [x] 2.2 Create `packages/workout-spa-editor/src/lib/secure-storage.ts` — encrypted localStorage wrapper
- [x] 2.3 Test crypto module: encrypt/decrypt round-trip, wrong passphrase fails
- [x] 2.4 Test secure-storage: store/retrieve/delete, encryption at rest

## 3. SPA: Zustand Stores

- [x] 3.1 Create `ai-store.ts` — providers list (id, type, encrypted key, model, label, isDefault), custom prompt, generation state, selected provider
- [x] 3.2 Add ai-store actions: addProvider, removeProvider, updateProvider, setDefault, selectForGeneration
- [x] 3.3 Create `garmin-store.ts` — Garmin creds (encrypted), Lambda URL (configurable), push state, connection status
- [x] 3.4 Test ai-store: add/remove/update providers, default selection, state transitions
- [x] 3.5 Test garmin-store: credential management, URL config, state transitions

## 4. SPA: Settings UI

- [ ] 4.1 Create `SettingsPanel` component — tabbed panel (AI, Garmin, Privacy)
- [ ] 4.2 AI tab: provider list (add/remove/edit), each with: provider type dropdown (Anthropic/OpenAI/Google), API key input, model name input, label input, default toggle
- [ ] 4.3 AI tab: custom system prompt textarea (global, applies to all providers)
- [ ] 4.4 Garmin tab: username/password inputs, Lambda URL input (default + custom), connection test button
- [ ] 4.5 Privacy tab: disclaimers text, link to self-hosting docs, "Clear all credentials" button
- [ ] 4.6 Integrate settings into existing `HeaderNav` (gear/settings icon)
- [ ] 4.7 Test settings panel: renders, add/remove providers, saves encrypted, loads decrypted

## 5. SPA: AI Workout Generation UI

- [ ] 5.1 Create `AiWorkoutInput` component — textarea + sport selector + model dropdown + "Generate" button
- [ ] 5.2 Model dropdown: lists all configured providers with labels, defaults to user's default provider
- [ ] 5.3 Add custom prompt field (optional, collapsible) — "Additional instructions for the AI"
- [ ] 5.4 Inject training zones from `profile-store` into LLM prompt context
- [ ] 5.5 Create provider factory: given a provider config, return a `LanguageModel` instance (Anthropic/OpenAI/Google)
- [ ] 5.6 Wire up `createTextToWorkout()` from `@kaiord/ai` with the selected browser model
- [ ] 5.7 Display loading state during generation (streaming if possible)
- [ ] 5.8 On success: load generated workout into existing workout editor via `workout-store.loadWorkout()`
- [ ] 5.9 On error: show error message with retry option
- [ ] 5.10 Handle no providers configured: redirect to settings
- [ ] 5.11 Test AI input component: renders, model dropdown, validates, handles loading/error states
- [ ] 5.12 Test provider factory: creates correct LanguageModel for each provider type

## 6. SPA: Garmin Push UI

- [ ] 6.1 Add "Push to Garmin" button in `WorkoutActions` toolbar
- [ ] 6.2 On click: send KRD + encrypted creds to Lambda endpoint
- [ ] 6.3 Display loading state during push
- [ ] 6.4 On success: show Garmin Connect URL with link
- [ ] 6.5 On 401 error: show "Check your Garmin credentials" with link to settings
- [ ] 6.6 On other errors: show error message
- [ ] 6.7 Handle missing credentials: redirect to settings
- [ ] 6.8 Test push flow: success, auth error, network error, missing creds

## 7. SPA: New Dependencies

- [ ] 7.1 Add `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` to SPA dependencies
- [ ] 7.2 Add `@kaiord/ai` to SPA dependencies
- [ ] 7.3 Verify bundle size impact — lazy-load AI provider modules per-provider
- [ ] 7.4 Verify browser compatibility of all three providers (Vercel AI SDK in browser)

## 8. SPA: E2E Tests (Playwright)

- [ ] 8.1 Create Playwright test setup with API mocking (`page.route()` for LLM and Lambda endpoints)
- [ ] 8.2 Create LLM response fixtures (valid Workout JSON for different sports)
- [ ] 8.3 Create Lambda response fixtures (PushResult success and error cases)
- [ ] 8.4 E2E: generate workout flow — type NL → select model → generate → workout appears in editor
- [ ] 8.5 E2E: push to Garmin flow — push button → loading → success message with URL
- [ ] 8.6 E2E: push error flow — 401 → error message → link to settings
- [ ] 8.7 E2E: settings — add provider, remove provider, set default, save and reload
- [ ] 8.8 E2E: settings — configure Garmin credentials, custom Lambda URL
- [ ] 8.9 E2E: no providers configured — generate button shows settings prompt
- [ ] 8.10 E2E: model selector dropdown — lists all configured providers, defaults correct
- [ ] 8.11 Add E2E to CI workflow — Playwright job on PRs that modify `packages/workout-spa-editor/`

## 9. LLM Eval Suite (`@kaiord/ai`)

- [ ] 9.1 Create `packages/ai/src/evals/` directory structure
- [ ] 9.2 Create `benchmarks.json` — 20+ curated workout descriptions with expected assertions
- [ ] 9.3 Include benchmarks for: cycling, running, swimming, generic sports
- [ ] 9.4 Include benchmarks for: simple, intervals, repetition blocks, mixed complexity
- [ ] 9.5 Include benchmarks for: English, Spanish, mixed language
- [ ] 9.6 Include benchmarks for: zone references (FTP %, HR zones, pace zones) with expected ranges
- [ ] 9.7 Include edge case benchmarks: very short, very long, ambiguous descriptions
- [ ] 9.8 Create eval runner script: iterate benchmarks, call `createTextToWorkout()`, validate output
- [ ] 9.9 Eval assertions: Zod schema validation (100% required)
- [ ] 9.10 Eval assertions: sport type correctness (≥95%)
- [ ] 9.11 Eval assertions: plausible step count (not empty, not >50)
- [ ] 9.12 Eval assertions: zone accuracy when zones provided (±5% tolerance, ≥90%)
- [ ] 9.13 Create eval report generator: JSON + human-readable summary with pass/fail per case
- [ ] 9.14 Add `pnpm --filter @kaiord/ai eval` script in package.json
- [ ] 9.15 Create `.github/workflows/eval.yml` — `workflow_dispatch` only (manual trigger), posts results as artifact
- [ ] 9.16 Document eval process in `packages/ai/README.md`

## 10. Documentation

- [ ] 10.1 Add privacy policy / disclaimers page content
- [ ] 10.2 Add self-hosting guide in `@kaiord/infra/README.md`
- [ ] 10.3 Update SPA README with new features
- [ ] 10.4 Update `CLAUDE.md` — add `@kaiord/infra` to packages list
- [ ] 10.5 Document eval process and how to run evals locally

## 11. CI/CD & Release

- [ ] 11.1 Add `@kaiord/infra` to CI test matrix (`.github/workflows/ci.yml`)
- [ ] 11.2 Add `@kaiord/infra` to changeset config (`.changeset/config.json`)
- [ ] 11.3 Add Playwright E2E job to CI (on SPA changes)
- [ ] 11.4 Create `.github/workflows/eval.yml` — `workflow_dispatch` manual trigger only
- [ ] 11.5 Add changeset for all modified packages
