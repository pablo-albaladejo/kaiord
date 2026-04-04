# Spec: Lambda Tailscale exit node routing

## Requirement: Outbound traffic routing

The Lambda function SHALL route all outbound HTTP requests through a Tailscale exit node to avoid Garmin Connect IP-based rate limiting (429).

### Scenario: Successful push through exit node

- **GIVEN** the Lambda is configured with valid Tailscale API key (Secrets Manager) and exit node
- **WHEN** a push request is received with valid Garmin credentials and KRD payload
- **THEN** the SSO login, OAuth1 exchange, and workout push SHALL succeed
- **AND** the response SHALL contain the Garmin workout ID and URL

### Scenario: Tailscale connection failure

- **GIVEN** the Tailscale tunnel fails to establish (invalid API key, exit node offline)
- **WHEN** a push request is received
- **THEN** the Lambda SHALL return HTTP 503 with error message "Proxy tunnel unavailable"
- **AND** the error SHALL be logged with the Tailscale failure reason

### Scenario: Stale tunnel after freeze/thaw

- **GIVEN** a Lambda container is thawed after being frozen
- **AND** the Tailscale tunnel is stale (WireGuard session expired)
- **WHEN** a push request is received
- **THEN** the handler SHALL detect the stale tunnel via health check
- **AND** reinitialize the Tailscale connection before processing the request

## Requirement: Cold start initialization

The Tailscale tunnel MUST be established during Lambda cold start, before handling the first request. Warm invocations SHOULD reuse the existing tunnel after a health check.

### Scenario: Cold start timing

- **GIVEN** a cold Lambda invocation
- **WHEN** Tailscale initializes and connects to the exit node
- **THEN** the total cold start overhead SHOULD be under 10 seconds

## Requirement: Secret management

The Tailscale API key SHALL be stored in AWS Secrets Manager. The Lambda environment variable `TS_SECRET_API_KEY` SHALL contain the secret **name** (not the value). The `tailscale-lambda-extension` construct SHALL handle fetching the secret at runtime.

The exit node hostname (`TS_EXIT_NODE`) MAY be stored as a Lambda environment variable (non-sensitive).

## Requirement: Concurrency limits

The Lambda function SHALL have reserved concurrency set to 5 to prevent ephemeral Tailscale node flood on the coordination server.

## Requirement: Tailscale ACLs

The Tailscale network ACLs MUST restrict `tag:lambda` nodes to internet-only access. Lambda nodes MUST NOT be able to reach other devices on the tailnet.

## Requirement: No impact on existing API

The Lambda HTTP API (request schema, response schema, CORS, throttling) MUST NOT change. The proxy is an internal networking concern only.
