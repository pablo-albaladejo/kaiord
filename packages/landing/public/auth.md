# kaiord.com auth.md

## Who this is for

Any AI agent or program that uses the public Kaiord endpoints on kaiord.com.

## Authentication

None. Every endpoint listed here is public. You do not need an account, an
API key or a token.

## Registration

There is no registration or provisioning endpoint. You do not need to register.

## Supported methods

Anonymous HTTPS requests only. Kaiord does not support OAuth, API keys or any
other login.

## How credentials are used

They are not used. Do not send credentials. Kaiord ignores them.

## Endpoints

- MCP server (Streamable HTTP): `https://kaiord.com/mcp`
  ([server card](https://kaiord.com/.well-known/mcp/server-card.json),
  [tools](https://kaiord.com/docs/mcp/tools))

## Limits

- A request body may be at most 65,536 bytes. A larger body gets 413.
- About 10 requests per 10 seconds per IP address. Above that, the edge
  answers 429.
- Only structured workouts are accepted. Activities, courses and health data
  are rejected.

## Data

The MCP server converts workouts in transit. It stores nothing and keeps no
logs of what you send. See the
[privacy policy](https://kaiord.com/docs/legal/privacy-policy).
