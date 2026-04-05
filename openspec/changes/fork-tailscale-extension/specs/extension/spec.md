# Spec: tailscale-lambda-extension fork

## Requirement: Exit node configuration

The extension SHALL support configuring a Tailscale exit node during initialization via the `TS_EXIT_NODE` environment variable.

### Scenario: Exit node configured at startup

- **GIVEN** the Lambda has `TS_EXIT_NODE=100.116.150.51` environment variable
- **WHEN** the extension initializes and `tailscale up` completes
- **THEN** the extension SHALL run `tailscale set --exit-node=100.116.150.51`
- **AND** wait until `tailscale status --json` reports `ExitNodeStatus.Online=true`
- **AND** signal ready to the Lambda runtime only after the exit node is online

### Scenario: Exit node not configured

- **GIVEN** the Lambda has no `TS_EXIT_NODE` environment variable
- **WHEN** the extension initializes
- **THEN** the extension SHALL NOT configure an exit node
- **AND** behavior SHALL be identical to the current version

### Scenario: Exit node timeout

- **GIVEN** the Lambda has `TS_EXIT_NODE` configured
- **AND** the exit node does not come online within 10 seconds
- **WHEN** the extension initialization times out
- **THEN** the extension SHALL log a warning and continue without exit node
- **AND** the handler SHALL still be invoked (degraded mode)

## Requirement: Advertise tags

The extension SHALL support passing `--advertise-tags` to `tailscale up` via the `TS_ADVERTISE_TAGS` environment variable.

### Scenario: Tags advertised with OAuth client key

- **GIVEN** the Lambda has `TS_ADVERTISE_TAGS=tag:lambda` environment variable
- **AND** the Secrets Manager secret contains an OAuth client key (`tskey-client-*`)
- **WHEN** the extension runs `tailscale up`
- **THEN** the command SHALL include `--advertise-tags=tag:lambda`
- **AND** the node SHALL register with the specified tags

### Scenario: Tags not configured

- **GIVEN** the Lambda has no `TS_ADVERTISE_TAGS` environment variable
- **WHEN** the extension runs `tailscale up`
- **THEN** the command SHALL NOT include `--advertise-tags`
- **AND** behavior SHALL be identical to the current version

## Requirement: CDK construct props

The construct SHALL expose new optional props for configuring the extension.

### Scenario: Props passed to environment

- **GIVEN** a CDK stack creates `TailscaleLambdaExtension` with `advertiseTags: "tag:lambda"` and `exitNode: "100.116.150.51"`
- **WHEN** the construct is synthesized
- **THEN** the Lambda environment SHALL include `TS_ADVERTISE_TAGS=tag:lambda` and `TS_EXIT_NODE=100.116.150.51`

## Requirement: Backward compatibility

All new features MUST be optional. Existing usage without new props MUST behave identically to the current version.

## Requirement: Documentation

The README MUST document:

- New environment variables (`TS_EXIT_NODE`, `TS_ADVERTISE_TAGS`)
- Usage with OAuth client keys (when using `--advertise-tags`)
- Usage with exit nodes
- Cold start time impact
