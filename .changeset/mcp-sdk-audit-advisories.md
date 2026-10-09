---
"@kaiord/mcp": patch
---

Bump `@modelcontextprotocol/sdk` from `^1.30.0` to `^1.32.1`, clearing a HIGH advisory on the SDK itself (GHSA-6qxp-vccf-f47h) plus a CRITICAL `proxy-addr` IP-spoofing advisory (GHSA-jqcg-44mw-7w3h) and several moderate `hono`/`ip-address`/`fast-uri` advisories reached transitively through the SDK's `express`, `@hono/node-server`, `express-rate-limit`, and `ajv` dependencies. No OAuth client code or HTTP client transports are used by this package, so the 1.31.0 OAuth-issuer-binding and 1.32.0 same-origin-redirect changes documented in the SDK's upgrade notes do not apply here.
