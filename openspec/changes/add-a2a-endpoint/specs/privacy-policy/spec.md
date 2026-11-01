## ADDED Requirements

### Requirement: Remote A2A endpoint disclosure

The privacy policy SHALL disclose `https://kaiord.com/a2a` before any route serves it. It SHALL state that the A2A endpoint runs the same tools under the same terms as the remote MCP endpoint (structured workouts only, processed in transit, never stored or logged, client IP used transiently for rate limiting, traffic through Cloudflare), and that A2A tasks finish inside the reply and are not retained. The regulatory compliance statement SHALL name both endpoints. The policy lint SHALL fail when the A2A sentence is removed.

#### Scenario: Policy discloses the A2A endpoint

- **WHEN** the privacy policy page is rendered
- **THEN** it SHALL name `https://kaiord.com/a2a`
- **AND** it SHALL state that the endpoint uses the same tools and terms as `/mcp` and does not retain tasks

#### Scenario: Removing the A2A disclosure fails the policy lint

- **GIVEN** a copy of the policy with the A2A sentence deleted
- **WHEN** the policy lint runs on it
- **THEN** it SHALL exit non-zero and name the missing A2A disclosure

#### Scenario: Disclosure precedes the route

- **WHEN** the `kaiord.com/a2a` Worker route is first deployed
- **THEN** the published privacy policy SHALL already contain the A2A disclosure
