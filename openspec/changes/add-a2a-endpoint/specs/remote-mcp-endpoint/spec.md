## MODIFIED Requirements

### Requirement: Request size and rate are bounded

The endpoint SHALL reject a request body larger than 65,536 bytes with `413` before parsing it, whether or not `content-length` is present or truthful. It SHALL reject a JSON-RPC batch (an array body) with `400`. The endpoint SHALL rate-limit requests per client IP and SHALL answer an over-limit request with `429`. Rate limiting SHALL include a control that runs before the Worker is invoked, so throttled traffic does not consume the account's shared daily Worker quota. That control SHALL be one bucket shared by `/mcp` and `/a2a`: 10 requests per 10 seconds per client IP, then a 10-second block.

#### Scenario: Oversized body is rejected

- **WHEN** a client posts a 65,537-byte body to `/mcp`
- **THEN** the response SHALL be `413` and no tool SHALL run

#### Scenario: Missing content-length does not bypass the cap

- **WHEN** a client streams a 65,537-byte body without a `content-length` header
- **THEN** the response SHALL be `413`

#### Scenario: A body at the limit is accepted

- **WHEN** a client posts a valid `tools/list` request padded to exactly 65,536 bytes
- **THEN** the response SHALL NOT be `413`

#### Scenario: Batches are rejected

- **WHEN** a client posts a JSON array of two `tools/call` requests
- **THEN** the response SHALL be `400` and no tool SHALL run

#### Scenario: Over-limit client is throttled

- **GIVEN** a handler whose injected rate limiter reports the client IP over its limit
- **WHEN** it sends another request
- **THEN** the response SHALL be `429`

#### Scenario: The edge bucket is shared with A2A

- **GIVEN** a client that has sent 10 requests to `/a2a` within 10 seconds
- **WHEN** it sends a request to `/mcp`
- **THEN** the response SHALL be `429` from the edge, before any Worker runs
