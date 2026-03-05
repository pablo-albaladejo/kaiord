# Natural Language to Garmin Connect (Web)

End-to-end web flow: user describes a workout in natural language, the system generates it via LLM and pushes it to Garmin Connect.

## Requirements

### Requirement: Natural Language Input

The SPA SHALL provide a text input where users can describe workouts in natural language, in any language. The input MUST accept a maximum of 2000 characters (matching `@kaiord/ai` limits).

### Requirement: Custom User Prompt

The SPA SHALL provide an optional text field for a "system prompt" that the user can use to add context to the LLM generation (e.g., "I'm recovering from injury", "keep heart rate below 150"). This prompt SHALL be appended to the LLM system prompt as additional instructions.

### Requirement: Training Zones Integration

The SPA SHALL inject the user's training zones (from the existing profile store) into the LLM prompt context. The LLM MUST use these zones when interpreting references like "Z3", "sweet spot", "threshold", etc.

### Requirement: Multi-Provider LLM Support

The SPA SHALL support multiple LLM providers for workout generation. Supported providers SHALL include at minimum:
- **Anthropic** (Claude) via `@ai-sdk/anthropic`
- **OpenAI** (GPT) via `@ai-sdk/openai`
- **Google** (Gemini) via `@ai-sdk/google`

All LLM calls SHALL be made directly from the browser (all three providers allow CORS). API keys MUST NOT be sent to any server other than the provider's own API endpoint.

### Requirement: Provider Configuration

The SPA SHALL allow users to configure multiple LLM providers in settings. Each provider configuration SHALL include:
- Provider type (Anthropic / OpenAI / Google)
- API key (encrypted in localStorage)
- Model name (e.g., `claude-sonnet-4-5-20241022`, `gpt-4o`, `gemini-2.0-flash`)
- A user-defined label (e.g., "My Claude", "Work OpenAI")

One provider MUST be marked as default.

### Requirement: Model Selection at Generation Time

When generating a workout, the SPA SHALL display a dropdown allowing the user to select from their configured providers/models. The dropdown SHALL default to the user's default provider.

### Requirement: Workout Preview

After LLM generation, the SPA SHALL display the generated workout in the existing workout editor UI, allowing the user to review and edit before pushing to Garmin.

### Requirement: Garmin Push via Lambda

The system SHALL provide a stateless Lambda function that:
1. Receives a KRD document and Garmin credentials (username + password)
2. Performs Garmin SSO login
3. Converts KRD to GCN format
4. Pushes the workout to Garmin Connect
5. Returns `{ id, name, url }` (PushResult)
6. Discards all data after the request completes

### Requirement: Lambda Statelessness

The Lambda MUST NOT persist, log, or transmit credentials or workout data beyond the scope of a single request. CloudWatch logs MUST NOT contain credentials. The Lambda MUST NOT use any external storage (DynamoDB, S3, etc.) for user data.

### Requirement: Encrypted Credential Storage

The SPA SHALL encrypt all stored credentials (LLM API keys for all configured providers, Garmin username/password) using the Web Crypto API before writing to localStorage. The encryption key SHALL be derived from a user-provided passphrase or a generated key stored in the browser's non-exportable key storage.

### Requirement: Privacy Disclaimers

The SPA SHALL display clear disclaimers:
1. "We do not store your credentials on any server"
2. "Garmin credentials are sent to the Lambda proxy only for the duration of the push request"
3. "You can self-host the Lambda — see documentation"
4. "We are not responsible for credential security on your device"

### Requirement: Self-Hostable Infrastructure

The `@kaiord/infra` package SHALL contain a complete AWS CDK stack that any user can deploy with `cdk deploy`. The stack SHALL include:
- Lambda function (Node.js runtime)
- API Gateway (HTTPS endpoint with CORS)
- No persistent storage resources
- No IAM roles beyond Lambda execution

### Requirement: Lambda API Contract

The Lambda endpoint SHALL accept:
```
POST /push
Content-Type: application/json

{
  "krd": { ... },              // KRD document
  "garmin": {
    "username": "user@email.com",
    "password": "secret"
  }
}
```

And return:
```
200 OK
{
  "id": "123456",
  "name": "Sweet Spot Cycling",
  "url": "https://connect.garmin.com/modern/workout/123456"
}
```

Or error:
```
401 { "error": "Garmin authentication failed" }
400 { "error": "Invalid KRD document" }
500 { "error": "Garmin API error: ..." }
```

### Requirement: Configurable Lambda URL

The SPA SHALL allow users to configure the Lambda endpoint URL. This enables users who self-host to point the SPA to their own infrastructure. The default SHALL be the Kaiord-hosted Lambda.

### Requirement: E2E Test Coverage

The new SPA features SHALL have Playwright E2E tests covering:
- AI workout generation flow (input → loading → preview in editor)
- Garmin push flow (push button → loading → success/error)
- Settings management (add/remove providers, save/load credentials)
- Model selector dropdown behavior
LLM and Lambda calls SHALL be mocked in E2E tests (no real API calls).

### Requirement: E2E in CI/CD

E2E tests SHALL run in the CI/CD pipeline on every PR that modifies `packages/workout-spa-editor/`. The CI workflow SHALL include a Playwright job with the SPA running in preview mode.

### Requirement: LLM Eval Suite

The `@kaiord/ai` package SHALL include an eval suite that tests workout generation quality against a benchmark dataset. Evals SHALL:
- Use real LLM calls (not mocked) against at least one provider
- Validate output schema (Zod `workoutSchema`)
- Check sport type correctness
- Check plausible step count and duration ranges
- Check zone interpretation accuracy when zones are provided
- Check multi-language input support (English, Spanish at minimum)
- Run locally via CLI (`pnpm --filter @kaiord/ai eval`)
- Optionally run in CI/CD via manual trigger (`workflow_dispatch`), never automatic

### Requirement: Eval Benchmark Dataset

The eval suite SHALL use a curated set of at least 20 benchmark workout descriptions spanning:
- Different sports (cycling, running, swimming, generic)
- Different complexities (simple steady-state, intervals, repetition blocks, mixed)
- Different languages (English, Spanish)
- Zone references (FTP percentages, HR zones, pace zones)
- Edge cases (very short, very long, ambiguous descriptions)

### Requirement: Eval Reporting

Eval results SHALL produce a structured report with:
- Pass/fail per benchmark case
- Overall pass rate (target: ≥90% valid workouts)
- Breakdown by sport, complexity, and language
- Any schema validation errors with details

## Scenarios

#### Scenario: Happy path — NL to Garmin

- **GIVEN** a user has configured at least one LLM provider and Garmin credentials
- **AND** they have training zones set in their profile
- **WHEN** they type "45min sweet spot cycling, 10min warmup, 3x10min at 90% FTP, 5min cooldown"
- **AND** select their preferred model from the dropdown
- **THEN** the LLM generates a structured cycling workout with correct power targets
- **AND** the workout is displayed in the editor for review
- **AND** clicking "Push to Garmin" sends it via Lambda and shows the Garmin Connect URL

#### Scenario: Switch between providers

- **GIVEN** a user has configured both Anthropic Claude and OpenAI GPT-4o
- **AND** has set Claude as default
- **WHEN** they open the model selector dropdown
- **THEN** both models are listed with their labels
- **AND** Claude is pre-selected
- **AND** they can switch to GPT-4o before generating

#### Scenario: Custom prompt influences generation

- **GIVEN** a user types "1 hour running intervals"
- **AND** adds custom prompt "I'm recovering from a knee injury, keep it easy"
- **WHEN** the workout is generated
- **THEN** the intensities are lower and the recovery periods are longer than default

#### Scenario: No LLM provider configured

- **GIVEN** a user has not configured any LLM provider
- **WHEN** they try to generate a workout
- **THEN** the SPA shows a settings prompt to configure at least one provider
- **AND** does NOT make any API call

#### Scenario: Add multiple providers

- **GIVEN** a user is in the AI settings tab
- **WHEN** they add an Anthropic provider with key and model, then add an OpenAI provider
- **THEN** both appear in the providers list
- **AND** the first one added is marked as default
- **AND** they can change which is default

#### Scenario: Garmin push fails — bad credentials

- **GIVEN** a user has invalid Garmin credentials
- **WHEN** they push a workout
- **THEN** the Lambda returns 401
- **AND** the SPA shows "Garmin authentication failed — check your username and password"

#### Scenario: Self-hosted Lambda

- **GIVEN** a user has deployed their own Lambda via `@kaiord/infra`
- **AND** configured the custom endpoint URL in the SPA settings
- **WHEN** they push a workout
- **THEN** the request goes to their custom URL, not the default Kaiord Lambda

#### Scenario: Credentials never logged

- **GIVEN** a Lambda invocation with valid credentials
- **WHEN** the push completes (success or failure)
- **THEN** CloudWatch logs contain only the request ID and status code, not credentials or workout data

#### Scenario: E2E — generate and preview workflow

- **GIVEN** a user has a configured LLM provider (mocked API response)
- **WHEN** they type a workout description and click "Generate"
- **THEN** the loading state is shown
- **AND** the generated workout appears in the editor
- **AND** all steps are visible and editable

#### Scenario: E2E — push to Garmin workflow

- **GIVEN** a user has a workout loaded and Garmin credentials configured
- **WHEN** they click "Push to Garmin" (mocked Lambda endpoint)
- **THEN** a success message with the Garmin Connect URL is displayed

#### Scenario: E2E — settings persistence

- **GIVEN** a user configures two LLM providers and Garmin credentials
- **WHEN** they reload the page
- **THEN** all providers and credentials are restored from encrypted storage
- **AND** the default provider is still selected

#### Scenario: Eval — structured workout quality

- **GIVEN** a set of benchmark workout descriptions (e.g., "30min easy run", "4x4min VO2max cycling", "1500m swim drill")
- **WHEN** each is processed by `createTextToWorkout()` with a real LLM
- **THEN** the output MUST be a valid `Workout` (passes Zod schema validation)
- **AND** sport type matches the description
- **AND** step count is reasonable (not empty, not >50 steps)
- **AND** durations and targets are within plausible ranges

#### Scenario: Eval — zone interpretation accuracy

- **GIVEN** a workout description referencing training zones ("Z2 run", "sweet spot cycling", "threshold intervals")
- **AND** explicit user zones are provided in the prompt context
- **WHEN** processed by `createTextToWorkout()`
- **THEN** the generated target values fall within the user's defined zone ranges (±5% tolerance)

#### Scenario: Eval — multi-language input

- **GIVEN** workout descriptions in Spanish, English, and mixed language
- **WHEN** processed by `createTextToWorkout()`
- **THEN** all produce valid `Workout` objects with correct sport and step structure

#### Scenario: Encrypted storage

- **GIVEN** a user stores their Anthropic API key in the SPA
- **WHEN** inspecting localStorage directly
- **THEN** the value is encrypted (not plaintext)
- **AND** decrypting requires the user's passphrase or browser key
