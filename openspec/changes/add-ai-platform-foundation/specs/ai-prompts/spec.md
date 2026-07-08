## ADDED Requirements

### Requirement: Versioned prompt registry

`@kaiord/ai/prompts` SHALL provide `definePrompt({ id, version, template, variables })`
and `resolvePrompt(id, { vars })`. Resolution SHALL substitute every declared
`{{variable}}` placeholder; resolving an unregistered prompt id or omitting a
declared variable SHALL fail fast with a typed error. The registry SHALL NOT
have a locale axis in this change (the i18n program adds it).

#### Scenario: Declared variables are substituted

- **GIVEN** a registered prompt whose template contains `{{sport}}`
- **WHEN** `resolvePrompt` is called with `vars: { sport: "cycling" }`
- **THEN** the resolved text SHALL contain `cycling` and no `{{sport}}` placeholder

#### Scenario: Unregistered id fails fast

- **WHEN** `resolvePrompt` is called with an id that was never defined
- **THEN** it SHALL throw a typed error naming the missing id

#### Scenario: Missing declared variable fails fast

- **GIVEN** a registered prompt declaring the variable `sport`
- **WHEN** `resolvePrompt` is called without `sport` in `vars`
- **THEN** it SHALL throw a typed error naming the missing variable

### Requirement: Single ownership of shipped prompts

The registry SHALL own the four existing prompt assets: the workout-parser
system prompt (`parse-workout.md`), the fitness-assistant (chat) system prompt,
the workout-generation user-prompt builder with its Spanish abbreviation
dictionary, and their version constants. The SPA SHALL consume them only via
`@kaiord/ai/prompts`; no prompt template text SHALL remain in SPA source.

#### Scenario: Chat agent uses the registry prompt

- **WHEN** the SPA builds its chat agent
- **THEN** the system prompt SHALL come from the registry's fitness-assistant entry

#### Scenario: Batch and coaching share the user-prompt builder

- **WHEN** batch processing or coaching conversion builds its user prompt
- **THEN** both SHALL call the registry-owned builder, and the Spanish abbreviation dictionary SHALL be applied identically in both paths

### Requirement: Byte-identical prompt migration

Migrating a prompt into the registry SHALL NOT change its assembled text or its
version value. Snapshot tests SHALL pin the assembled output of each migrated
prompt before the move and pass unchanged after it, and version values SHALL
remain `1.0.0` so persisted `aiMeta.promptVersion` data keeps its meaning.

#### Scenario: Assembled text survives the migration

- **GIVEN** snapshots of the assembled workout-parser system prompt, chat system prompt, and a representative user prompt taken before the migration
- **WHEN** the same inputs are resolved through the registry after the migration
- **THEN** the outputs SHALL match the snapshots byte for byte

#### Scenario: Persisted prompt versions keep their meaning

- **GIVEN** stored workouts whose `aiMeta.promptVersion` is `1.0.0`
- **WHEN** a new workout is generated after the migration
- **THEN** it SHALL also be stamped `1.0.0`, because no prompt text changed

### Requirement: Shared untrusted-data fence utility

`@kaiord/ai/prompts` SHALL export the untrusted-data fence utility that wraps
external text in `<<<untrusted_data>>>` markers with the existing 500-character
cap. Fencing behavior as specified by `spa-ai-chat` SHALL NOT change; only its
ownership moves.

#### Scenario: Fenced output is unchanged after the move

- **GIVEN** an external coaching description previously fenced by the SPA-local utility
- **WHEN** the same text is fenced through `@kaiord/ai/prompts`
- **THEN** the fenced output SHALL be identical, including markers and truncation
