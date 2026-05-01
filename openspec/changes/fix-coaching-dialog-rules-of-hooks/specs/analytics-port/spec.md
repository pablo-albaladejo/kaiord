## MODIFIED Requirements

### Requirement: Editor tracks route render errors

The system SHALL call `analytics.event('route-error', payload)` when `RouteErrorBoundary.componentDidCatch` is triggered. The payload SHALL contain four string fields, each first scrubbed through a shared `scrubAnalyticsString` helper, then truncated:

- `route: string` — `window.location.pathname` at the time of the error, scrubbed; not truncated (route paths are bounded by the router).
- `name: string` — `error.name` (defaulting to `"Error"` when `error.name` is `undefined`, `null`, or empty), scrubbed; not truncated (error class names are bounded).
- `message: string` — `error.message` scrubbed and then truncated to ≤ 500 characters (defaulting to the empty string when `error.message` is `undefined`, `null`, or empty).
- `componentStack: string` — `info.componentStack` scrubbed and then truncated to ≤ 1000 characters (defaulting to the empty string when missing).

`scrubAnalyticsString(input: string, maxLen?: number): string` SHALL replace, in this order, all substring matches with the corresponding placeholder, then (when `maxLen` is provided) truncate the result to at most `maxLen` characters:

1. UUID v4 / v5 (`/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi`) → `<uuid>`.
2. Bearer tokens (`/Bearer\s+[A-Za-z0-9._\-+/=]+/g`) → `Bearer <token>`. The character class is restricted to token-safe chars so trailing punctuation (e.g., `);` or `,`) is preserved verbatim — `Bearer\s+\S+` would greedily consume the punctuation and corrupt downstream message content.
3. Email-shaped substrings, including internationalized local parts and TLDs (`/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu`) → `<email>`. The Unicode-aware regex catches Train2Go-shaped (`usuario@correo.es`) and CJK-shaped (`用户@example.cn`) addresses that the ASCII-only `[A-Za-z0-9]` form would miss.
4. Runs of 32 or more hexadecimal characters (`/[0-9a-f]{32,}/gi`) → `<hex>`.
5. Long base64url-shaped runs of 40 or more characters (`/[A-Za-z0-9_-]{40,}/g`) → `<token>`. This catches raw JWTs (`eyJ...`), OAuth refresh tokens, and other base64url-encoded secrets that appear in error messages without a `Bearer` prefix. Note: hex runs ≥ 32 are also a subset of base64url; rule 4 runs FIRST, so a 60-character hex run produces `<hex>`, not `<token>`. Both placeholders mean "opaque secret" from a triage standpoint — the ambiguity is intentional.

Truncation MUST occur AFTER scrubbing, so placeholders are never chopped mid-token.

The scrubber explicitly does NOT cover IPv4 / IPv6 addresses, phone numbers, or filesystem pathnames. These are documented out-of-scope: the Cloudflare beacon adapter is not yet wired in production, and this gap is revisited when it is.

The analytics call SHALL remain wrapped in `try/catch` so a failure in the scrubber, the truncator, or the analytics adapter cannot trigger a secondary failure inside the error boundary.

The default `noop` adapter MUST continue to accept this richer payload without behavior change.

#### Scenario: Render error fires route-error event with scrubbed-and-truncated payload

- **GIVEN** `RouteErrorBoundary` is mounted with a real (non-noop) `analytics` prop
- **WHEN** a route component throws an `Error("not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab")` and React invokes `componentDidCatch(error, info)`
- **THEN** `analytics.event` is called with event name `'route-error'` and a payload whose `message` is `"not found: <uuid>"`, whose `name` is `"Error"`, whose `route` equals `window.location.pathname` (with any UUID/email/Bearer/hex run replaced by its placeholder), and whose `componentStack` equals `info.componentStack` scrubbed and truncated to ≤ 1000 chars

#### Scenario: Bearer tokens, emails, and long hex runs are scrubbed

- **WHEN** an `Error` thrown during render carries the message `"auth failed for user@example.com (Bearer abc.def.ghi); key=abcdef0123456789abcdef0123456789abcdef01"`
- **THEN** the `message` field of the analytics payload equals `"auth failed for <email> (Bearer <token>); key=<hex>"`

#### Scenario: Raw JWT and base64url tokens are scrubbed

- **WHEN** an `Error` thrown during render carries the message `"401 Unauthorized: token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c expired"`
- **THEN** the `message` field of the analytics payload contains `"<token>"` substituted for each base64url-shaped run of 40+ characters and contains no portion of the original JWT material

#### Scenario: UUID positioned to span the truncation boundary is fully replaced

- **GIVEN** an error message of 600 characters where a UUID-shaped substring straddles input positions 498-533 (i.e., would be split if truncation ran first)
- **WHEN** `scrubAnalyticsString(message, 500)` runs
- **THEN** the output contains the literal placeholder `<uuid>` intact (never split mid-token) and the output length is at most 500 characters

#### Scenario: Empty / missing fields fall back to safe defaults

- **WHEN** `componentDidCatch` is invoked with an error object whose `name` is `undefined` and `message` is `undefined`, and an `info.componentStack` that is `undefined`
- **THEN** the payload sent to analytics is `{ route: <scrubbed pathname>, name: "Error", message: "", componentStack: "" }`

#### Scenario: Truncation applies after scrubbing at exact bounds

- **WHEN** an error's `message` is 600 characters long with no scrub-matching substrings
- **THEN** the analytics payload's `message` is exactly 500 characters long

- **WHEN** an `info.componentStack` is 1100 characters long with no scrub-matching substrings
- **THEN** the analytics payload's `componentStack` is exactly 1000 characters long

#### Scenario: No analytics prop means error is silently untracked

- **WHEN** `RouteErrorBoundary` is rendered without an `analytics` prop
- **THEN** the error boundary renders the fallback UI normally without throwing a secondary error and without calling any analytics code path

#### Scenario: Analytics adapter throwing does not crash the error boundary

- **WHEN** the supplied `analytics.event` implementation throws synchronously while reporting `route-error`
- **THEN** the error boundary still renders the fallback UI and does not surface a secondary error
