---
"@kaiord/mcp": minor
---

`createServer` takes an optional `logger`. Without it the server logs to stderr as before; a host where stderr is not private, such as a Cloudflare Worker, can pass a quiet one.
