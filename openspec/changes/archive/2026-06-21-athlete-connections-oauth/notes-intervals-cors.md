# Spike result — intervals.icu API CORS (task 1.1)

Date: 2026-06-19. Probed `OPTIONS https://intervals.icu/api/v1/athlete/0` with an
`Origin` + `Access-Control-Request-{Method,Headers}` preflight.

Response (HTTP/2 200):

- `access-control-allow-origin: <reflected request Origin>`
- `access-control-allow-headers: origin, authorization, accept, content-type, x-requested-with`
- `access-control-allow-methods: GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS`
- `access-control-max-age: 3600`

**Conclusion:** intervals.icu allows cross-origin browser calls with the
`Authorization` header → the client-only API-key connect path is viable. No proxy
/ backend needed for intervals.icu.

**Connect-time validation call (task 1.2):**
`GET https://intervals.icu/api/v1/athlete/0` with HTTP Basic auth
`Authorization: Basic base64("API_KEY:" + <key>)` (intervals.icu convention:
username `API_KEY`, password = the user's key; `/athlete/0` resolves to the
authenticated athlete). `200` → valid; `401/403` → invalid key (reject, do not
persist).
