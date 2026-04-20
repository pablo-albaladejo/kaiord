## ADDED Requirements

### Requirement: Bridge extensions are in the changesets linked group

The `linked` array in `.changeset/config.json` SHALL include `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` alongside the existing monorepo packages, so that `Changesets configuration for extensions` is enforced by the tool itself rather than relying on manual coordination.

#### Scenario: Both bridge packages appear in linked

- **WHEN** `.changeset/config.json` is parsed
- **THEN** at least one entry of its `linked` array SHALL contain both `@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` (regardless of its position in the array)
- **AND** the parse SHALL succeed with no duplicate names across linked groups

#### Scenario: Version bump for one extension bumps the other

- **GIVEN** a changeset that targets only `@kaiord/train2go-bridge`
- **WHEN** `pnpm exec changeset version` runs
- **THEN** `@kaiord/garmin-bridge` SHALL receive the same version bump because both belong to the same linked group
