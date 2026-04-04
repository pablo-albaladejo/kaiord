# Design: Lambda Tailscale exit node routing

## Decision 1: Use `tailscale-lambda-extension` CDK construct

**Layer:** adapters (`@kaiord/infra`)

**Choice:** Use the community CDK construct [`tailscale-lambda-extension`](https://github.com/rehanvdm/tailscale-lambda-extension) (npm: `tailscale-lambda-extension`) instead of building a custom Lambda Layer.

**Rationale:** The construct handles the full lifecycle: binary packaging, cold start initialization, freeze/thaw recovery, and Secrets Manager integration. It is referenced in the [AWS official blog](https://aws.amazon.com/blogs/compute/building-a-secure-webhook-forwarder-using-an-aws-lambda-extension-and-tailscale/) and published on [Construct Hub](https://constructs.dev/packages/tailscale-lambda-extension). Building a custom Layer would duplicate tested functionality.

**Not official Tailscale software.** Author: Rehan van der Merwe. Tailscale provides [official Lambda docs](https://tailscale.com/kb/1113/aws-lambda) but no maintained construct.

**New dependency:** `tailscale-lambda-extension` (CDK construct, MIT)

**Alternatives considered:**

- **Custom Lambda Layer**: More control but duplicates solved problems (lifecycle, binary management)
- **VPC + EC2 exit node**: $3-5/month, EC2 maintenance, user rejected
- **Docker custom runtime**: Exceeds Lambda size limits, slower cold starts
- **HTTP proxy on exit node**: Lambda can't reach proxy without Tailscale anyway
- **Tailscale Funnel on Raspberry Pi**: Exposes Raspberry to public internet

## Decision 2: SOCKS5 proxy for fetch routing

**Layer:** adapters (`@kaiord/infra`)

**Choice:** Use Tailscale's built-in SOCKS5 proxy (`localhost:1055`) and route Node.js `fetch` through it using `socks-proxy-agent`.

**Rationale:** `socks-proxy-agent` is well-maintained and works with Node.js native `fetch` (undici). The `@kaiord/garmin-connect` client already accepts a custom `fetchFn`, so no changes needed outside `@kaiord/infra`.

**New dependency:** `socks-proxy-agent` (MIT, ~50KB, widely used)

## Decision 3: Secrets Manager for Tailscale API key

**Layer:** adapters (`@kaiord/infra`)

**Choice:** Store the Tailscale API key in AWS Secrets Manager. The CDK construct reads it at runtime, not from environment variables.

**Rationale (from security review):** Lambda env vars are visible in the AWS Console, `GetFunctionConfiguration` API, and CloudFormation templates. Secrets Manager provides encryption at rest, rotation support, and IAM-scoped access. The `tailscale-lambda-extension` construct has built-in Secrets Manager integration via `TS_SECRET_API_KEY` env var (which contains the secret _name_, not the value).

**Exit node hostname** (`TS_EXIT_NODE`) is non-sensitive and stays as an env var.

### Auth key types

The construct's `tailscale up` is hardcoded with only `--authkey` and `--hostname` flags — no `--advertise-tags` support. This means:

- **Auth keys** (`tskey-auth-*`): Work directly. Tags are embedded in the key at creation time. Max expiry: 90 days. Must be rotated.
- **OAuth client keys** (`tskey-client-*`): Do NOT work with the current construct. They require `--advertise-tags` which the extension shell script does not pass.

**Current choice:** Auth key with tags pre-configured (ephemeral, reusable, `tag:lambda`, 90-day expiry).

**Future alternative if auth key rotation becomes burdensome:** Fork the `tailscale-lambda-extension` construct to add `--advertise-tags` support. The change would be in the embedded shell script (`extensions/tailscale-extension`) inside `tailscale-extension.zip`:

```bash
# Current (hardcoded):
/opt/extensions/bin/tailscale --socket=/tmp/tailscale.sock up \
  --authkey="${TS_KEY}" \
  --hostname="${TS_HOSTNAME}"

# Forked (with advertise-tags support):
EXTRA_ARGS=""
if [ -n "${TS_ADVERTISE_TAGS}" ]; then
  EXTRA_ARGS="--advertise-tags=${TS_ADVERTISE_TAGS}"
fi
/opt/extensions/bin/tailscale --socket=/tmp/tailscale.sock up \
  --authkey="${TS_KEY}" \
  --hostname="${TS_HOSTNAME}" \
  ${EXTRA_ARGS}
```

This would allow using OAuth client keys (no expiry) with `TS_ADVERTISE_TAGS=tag:lambda` as an environment variable. Consider contributing this upstream to `rehanvdm/tailscale-lambda-extension`.

## Decision 4: Tunnel health check on every invocation

**Layer:** adapters (`@kaiord/infra`)

**Choice:** Before each request, verify the SOCKS5 tunnel is functional. If stale (after Lambda freeze/thaw), reinitialize.

**Rationale (from Lambda engineer review):** Lambda freezes containers between invocations. On thaw, `tailscaled` resumes but the WireGuard session may be stale. Checking only port availability is insufficient — must verify actual connectivity through the tunnel.

**Implementation:** Attempt a TCP connection through SOCKS5 before proxying to Garmin. If it fails, kill `tailscaled` and reinitialize.

## Decision 5: Reserved concurrency limit

**Layer:** adapters (`@kaiord/infra`)

**Choice:** Set Lambda reserved concurrency to 5.

**Rationale (from Lambda engineer review):** Each concurrent invocation creates a separate ephemeral Tailscale node. Burst traffic can overwhelm the coordination server ([GitHub issue #14956](https://github.com/tailscale/tailscale/issues/14956)). The API Gateway throttle (10 rps, burst 5) provides some protection, but explicit concurrency limits prevent node flood.

## Decision 6: Disable minification, enable source maps

**Layer:** adapters (`@kaiord/infra`)

**Choice:** `minify: false`, `sourceMap: true` in Lambda bundling config.

**Rationale:** Minification obscured error types (`ServiceAuthError` → `Op`), making debugging impossible. Bundle size increase (~100KB) is negligible for server-side. Already deployed during debug session.

## Decision 7: Tailscale ACLs for `tag:lambda`

**Layer:** external (Tailscale admin console)

**Choice:** Configure Tailscale ACLs to restrict `tag:lambda` nodes to internet-only access:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:lambda"],
      "dst": ["autogroup:internet:*"]
    }
  ]
}
```

**Rationale (from security review):** Without explicit ACLs, a compromised Lambda could access every device on the tailnet (including the Raspberry Pi). Restrict to internet-only traffic through the exit node.

## Architecture diagram

```text
Browser → API Gateway → Lambda Handler
                          ├─ tailscale-lambda-extension [cold start + health check]
                          │   ├─ tailscaled --tun=userspace-networking --socks5-server=:1055
                          │   └─ tailscale up --exit-node=raspberry-pi
                          └─ pushToGarmin(krd, creds)
                              └─ createGarminConnectClient({ fetchFn: proxyFetch })
                                  └─ fetch via SOCKS5 → WireGuard → Raspberry Pi → Garmin
```

## Deploy workflow changes

`deploy-infra.yml` needs:

1. Tailscale API key stored in Secrets Manager (manual, one-time setup)
2. Exit node hostname passed as CDK context (non-sensitive)
3. No binary download step needed — construct handles it

## References

- [Tailscale on AWS Lambda — Official Docs](https://tailscale.com/kb/1113/aws-lambda)
- [AWS Blog: Lambda Extension + Tailscale](https://aws.amazon.com/blogs/compute/building-a-secure-webhook-forwarder-using-an-aws-lambda-extension-and-tailscale/)
- [tailscale-lambda-extension (GitHub)](https://github.com/rehanvdm/tailscale-lambda-extension)
- [tailscale-lambda-extension (npm)](https://www.npmjs.com/package/tailscale-lambda-extension)
- [CDK Constructs blog (cold start benchmarks)](https://rehanvdm.com/blog/cdk-lambda-tailscale-extension-and-proxy)
- [GitHub Issue #14956: SOCKS5 context deadline exceeded in Lambda](https://github.com/tailscale/tailscale/issues/14956)
