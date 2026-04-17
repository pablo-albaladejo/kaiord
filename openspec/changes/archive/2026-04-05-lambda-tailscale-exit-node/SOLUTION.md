# Solution: Lambda Tailscale Exit Node Routing

## Problem

Garmin Connect blocks AWS Lambda IPs with HTTP 429 (Too Many Requests) on the OAuth1 token exchange endpoint. Both `@kaiord/infra` Lambda and the separate `tanita-to-garmin-cdk` project are affected. The SSO login succeeds (ticket obtained) but the subsequent OAuth1 exchange is rate-limited, making workout push from the SPA unusable.

## Architecture

```text
Browser (SPA)
  │
  ▼
API Gateway (CORS: pablo-albaladejo.github.io)
  │
  ▼
AWS Lambda (Node.js 24, 512MB, 60s timeout)
  ├─ tailscale-lambda-extension (Lambda Layer)
  │   ├─ tailscaled --tun=userspace-networking --socks5-server=localhost:1055
  │   └─ tailscale up --authkey=<from Secrets Manager> --hostname=garmin-proxy-lambda
  │
  ├─ Handler initialization (cold start only):
  │   ├─ ensureExitNode() → tailscale set --exit-node=<raspberry-pi-ip>
  │   │   └─ waitForExitNode() → polls tailscale status --json until Online
  │   └─ enableSocksProxy() → setGlobalDispatcher(socksDispatcher(...))
  │
  ├─ checkTunnelHealth() → HEAD https://sso.garmin.com (3 retries, 2s delay)
  │
  └─ pushToGarmin()
      └─ createGarminConnectClient({ tokenStore })
          └─ createCookieFetch() wraps globalThis.fetch
              └─ globalThis.fetch now routes via SOCKS5 → Tailscale → Exit Node
                  │
                  ▼
              Raspberry Pi (Home Assistant + Tailscale exit node)
                  │
                  ▼
              Garmin Connect API (residential IP, no 429)
```

## Key Technical Decisions

### 1. `fetch-socks` + `setGlobalDispatcher` (NOT `socks-proxy-agent` or `undici.Socks5ProxyAgent`)

**This was the hardest problem to solve.** Three approaches were tried and failed:

#### Attempt 1: `socks-proxy-agent` with `dispatcher` option

```typescript
// FAILED: socks-proxy-agent creates an http.Agent, not an undici Dispatcher.
// globalThis.fetch uses undici internally and ignores http.Agent.
import { SocksProxyAgent } from "socks-proxy-agent";
globalThis.fetch(url, {
  dispatcher: new SocksProxyAgent("socks://localhost:1055"),
});
// Error: TypeError: fetch failed
```

#### Attempt 2: `undici.Socks5ProxyAgent` (experimental)

```typescript
// FAILED: Socks5ProxyAgent is experimental (v7.23.0+) and has bugs.
// Returned 404 for URLs that work normally (S3, connectapi.garmin.com).
import { Socks5ProxyAgent } from "undici";
globalThis.fetch(url, {
  dispatcher: new Socks5ProxyAgent("socks5://localhost:1055"),
});
// Error: OAuth consumer 404, OAuth1 token 404
```

#### Attempt 3: `undici.fetch` directly (bypassing globalThis.fetch)

```typescript
// PARTIALLY WORKED: undici.fetch with Socks5ProxyAgent routed some requests.
// BUT: fetch-cookie wraps globalThis.fetch, not undici.fetch.
// Cookies from SSO login were lost when OAuth1 used undici.fetch directly.
import { fetch as undiciFetch, Socks5ProxyAgent } from "undici";
undiciFetch(url, {
  dispatcher: new Socks5ProxyAgent("socks5://localhost:1055"),
});
// Error: OAuth1 token 404 (cookies not forwarded)
```

#### Final solution: `fetch-socks` + `setGlobalDispatcher`

```typescript
// WORKS: fetch-socks creates a proper undici Dispatcher from SOCKS5 config.
// setGlobalDispatcher makes ALL globalThis.fetch calls use it.
// fetch-cookie wraps globalThis.fetch → automatically gets SOCKS5 routing.
import { setGlobalDispatcher } from "undici";
import { socksDispatcher } from "fetch-socks";
setGlobalDispatcher(
  socksDispatcher({ type: 5, host: "localhost", port: 1055 })
);
// All fetch calls now route through Tailscale SOCKS5 → exit node → internet
```

**Why `fetch-socks` works and `undici.Socks5ProxyAgent` doesn't:**

- `fetch-socks` implements SOCKS5 at the socket level using the `socks` package (battle-tested)
- `undici.Socks5ProxyAgent` is experimental (added in undici 7.23.0, March 2026) and has known issues
- `fetch-socks` returns a standard undici `Dispatcher` that `setGlobalDispatcher` accepts
- AWS Lambda's Node.js 24 runtime respects `setGlobalDispatcher` for `globalThis.fetch`

### 2. Exit node configured from handler (not extension)

The `tailscale-lambda-extension` construct only supports `--authkey` and `--hostname` in its `tailscale up` command. No `--exit-node` flag.

**Solution:** After the extension starts Tailscale, the handler calls `tailscale set --exit-node=<IP>` using `execFileSync` (not `execSync` — avoids command injection). Then polls `tailscale status --json` until `ExitNodeStatus.Online` is true.

**Why not fork the construct:** The workaround is 30 lines. Forking means maintaining a separate package, tracking upstream updates, and rebuilding the Lambda Layer. The workaround is documented and easily removable if the construct adds `--exit-node` support or we fork later.

### 3. Auth key (90-day expiry) instead of OAuth client key

The construct doesn't support `--advertise-tags`, which OAuth client keys require. Auth keys with pre-configured tags (ephemeral, reusable, `tag:lambda`) work directly.

**Trade-off:** Auth keys expire in 90 days max. Must rotate. Documented in design.md with fork instructions for OAuth support.

### 4. Selective routing NOT used (all traffic through SOCKS5)

Initially tried routing only `*.garmin.com` through SOCKS5 and S3 directly. This caused cookie management issues because `fetch-cookie` maintains a single cookie jar for `globalThis.fetch`. Splitting requests between two fetch implementations broke cookie forwarding.

**Final approach:** ALL traffic goes through SOCKS5 via `setGlobalDispatcher`. This is simpler and ensures cookies are preserved across all requests in the SSO flow.

### 5. Health check with retries

The SOCKS5 tunnel takes 1-3 seconds to become functional after exit node configuration. A single probe fails on cold start. Retry 3 times with 2-second delays.

## Files

| File                     | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `proxy-fetch.ts`         | `enableSocksProxy()` + `checkTunnelHealth()`                         |
| `tailscale-exit-node.ts` | `ensureExitNode()` — configures exit node + waits                    |
| `handler.ts`             | Orchestrates: validate → exit node → proxy → health → push           |
| `garmin-push.ts`         | Creates Garmin client (unchanged — uses default `createCookieFetch`) |
| `garmin-proxy-stack.ts`  | CDK: Tailscale Layer, Secrets Manager, env vars, bundling            |
| `deploy-infra.yml`       | Passes `tsSecretName` and `tsExitNode` context to CDK                |

## Dependencies

| Package                      | Purpose                                  | Why this one                                                                                                                |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `tailscale-lambda-extension` | CDK construct for Tailscale Lambda Layer | Only maintained CDK construct, referenced by AWS blog                                                                       |
| `fetch-socks`                | SOCKS5 dispatcher for undici             | Works with `setGlobalDispatcher`, unlike `socks-proxy-agent` (http.Agent) or `undici.Socks5ProxyAgent` (experimental/buggy) |
| `undici`                     | `setGlobalDispatcher` API                | Needed to redirect globalThis.fetch through SOCKS5                                                                          |
| `socks`                      | SOCKS5 protocol (fetch-socks dep)        | Externalized in nodeModules for Lambda ESM compatibility                                                                    |

## Infrastructure

| Resource        | Value                                             |
| --------------- | ------------------------------------------------- |
| Memory          | 512 MB (was 256)                                  |
| Timeout         | 60s (was 30)                                      |
| Bundling        | minify: false, sourceMap: true                    |
| nodeModules     | undici, fetch-socks, socks                        |
| Secrets Manager | `tailscale-api-key` (auth key, 90-day expiry)     |
| Exit node       | Raspberry Pi (Home Assistant) with residential IP |
| Tailscale tag   | `tag:lambda` (ephemeral, internet-only ACL)       |

## Debugging Timeline

1. **429 from Garmin** → Discovered AWS IPs are blocked
2. **Minified error `Op`** → Disabled minification, enabled source maps
3. **`Dynamic require of "events"`** → Externalized socks packages in nodeModules
4. **`oauth authkeys require --advertise-tags`** → Switched from OAuth client key to auth key
5. **Reserved concurrency rejected** → AWS account quota too low, removed
6. **Health check 503 before validation** → Moved health check after request validation
7. **`socks-proxy-agent` TypeError** → http.Agent incompatible with undici Dispatcher
8. **`undici.Socks5ProxyAgent` 404** → Experimental, buggy with S3 and Garmin API
9. **`undici.fetch` cookies lost** → fetch-cookie wraps globalThis.fetch, not undici.fetch
10. **S3 404 via SOCKS5** → S3 virtual hosting issue with experimental SOCKS5
11. **`setGlobalDispatcher` ignored** → Lambda runtime ignores it for some dispatcher types
12. **`fetch-socks` + `setGlobalDispatcher`** → Works. All traffic routes correctly.
