# Cloudflare operations for `/a2a`

Two scripts the owner runs by hand for OpenSpec `add-a2a-endpoint`. An agent
never runs them against Cloudflare: they change the production zone.

| Script             | Task | When                                                   | Token scope             |
| ------------------ | ---- | ------------------------------------------------------ | ----------------------- |
| `waf-widen-a2a.sh` | 3.1  | Before the deploy that adds the `kaiord.com/a2a` route | Zone WAF Edit, one zone |
| `dns-a2a-svcb.sh`  | 6.1  | Optional, after the `/a2a` production smoke passes     | Zone DNS Edit, one zone |

Both are a **dry run by default**: they only read, assert what they read and
print what they would change. Only `--apply` writes. Each refuses to act when
the live state is not the one the design expects, and does nothing when the
change is already there.

```sh
CF_API_TOKEN=... CF_ZONE_ID=... pnpm -C packages/mcp-worker ops:waf-widen-a2a
CF_API_TOKEN=... CF_ZONE_ID=... pnpm -C packages/mcp-worker ops:waf-widen-a2a --apply

CF_API_TOKEN=... CF_ZONE_ID=... CF_ZONE_NAME=kaiord.com pnpm -C packages/mcp-worker ops:dns-a2a-svcb
CF_API_TOKEN=... CF_ZONE_ID=... CF_ZONE_NAME=kaiord.com pnpm -C packages/mcp-worker ops:dns-a2a-svcb --apply
```

- Nothing account-specific is in the repo: the token, the zone id and the
  zone apex come from the environment. The token reaches `curl` through a
  file descriptor, never its command line. Revoke it after the run.
- `waf-widen-a2a.sh` finds the one rate-limiting rule whose expression has
  `http.request.uri.path eq "/mcp"`, asserts the budget the docs state (10
  requests per 10 s, a 10 s block, keyed on `ip.src` and `cf.colo.id`;
  design D7), and replaces that clause with
  `http.request.uri.path in {"/mcp" "/a2a"}`, so both paths share one bucket.
  After `--apply` it reads the rule back and fails if anything but the
  expression changed. The JSON goes to `OUT_DIR` (a new temporary directory
  by default); it holds zone data, so keep it out of the repo.
- `dns-a2a-svcb.sh` copies the `_mcp._agents` SVCB record (priority 1, target
  the apex) to `_a2a._agents`. Afterwards check five DoH lookups a minute
  apart with `AD == true` for both names (task 6.3).

Tests: `scripts/a2a-ops.test.mjs` runs both scripts against a fake `curl`
(`pnpm test:scripts`); no test reaches the network.
