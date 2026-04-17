> Completed: 2026-04-05

# Proposal: Route Lambda traffic through Tailscale exit node

## Problem

Garmin Connect blocks AWS IP ranges with HTTP 429 (Too Many Requests) on the OAuth1 token exchange endpoint. This affects both `@kaiord/infra` Lambda and the separate `tanita-to-garmin-cdk` project. The SSO login succeeds (ticket obtained) but the subsequent OAuth1 exchange is rate-limited, making the push Lambda unusable.

CI integration tests already solved this by routing traffic through a Tailscale exit node (Raspberry Pi with Home Assistant, residential IP).

## Solution

Use the community CDK construct [`tailscale-lambda-extension`](https://github.com/rehanvdm/tailscale-lambda-extension) to add Tailscale networking to the Lambda. This construct:

- Packages `tailscaled` binary as a Lambda Layer
- Manages lifecycle (cold start init, warm reuse, freeze/thaw health checks)
- Exposes a SOCKS5 proxy on `localhost:1055`
- Stores the Tailscale API key in AWS Secrets Manager (not env vars)

The Lambda handler passes a SOCKS5-aware `fetchFn` to `createGarminConnectClient`.

**Note:** This construct is NOT official Tailscale software. It is a community project by Rehan van der Merwe, referenced in the [AWS blog](https://aws.amazon.com/blogs/compute/building-a-secure-webhook-forwarder-using-an-aws-lambda-extension-and-tailscale/) and published on [Construct Hub](https://constructs.dev/packages/tailscale-lambda-extension). Tailscale provides [official documentation](https://tailscale.com/kb/1113/aws-lambda) for Lambda but does not maintain a construct/extension.

## Alternatives evaluated

| Alternative                               | Why rejected                                          |
| ----------------------------------------- | ----------------------------------------------------- |
| VPC + EC2 t4g.nano ($3/mo) with Tailscale | User prefers serverless, no EC2                       |
| HTTP proxy (Squid) on exit node           | Lambda can't reach the proxy without Tailscale anyway |
| Tailscale Funnel on Raspberry Pi          | Exposes Raspberry to public internet                  |
| Frontend-only (no Lambda)                 | Garmin blocks CORS on all endpoints                   |
| CLI-only push (remove Lambda)             | Push from SPA is a requirement                        |
| Custom Lambda Layer (build own)           | `tailscale-lambda-extension` already solves this      |

## Affected Packages

| Package                  | Change                                              |
| ------------------------ | --------------------------------------------------- |
| `@kaiord/infra`          | CDK construct, handler proxy setup, Secrets Manager |
| `@kaiord/garmin-connect` | No changes — already accepts custom `fetchFn`       |

## Breaking Changes

None. The Lambda API (request/response) is unchanged.

## Constraints

- Architecture layer: adapters only (`@kaiord/infra`)
- Referenced specs: openspec/specs/adapter-contracts/spec.md
- Cold start impact: +5-10s for Tailscale tunnel initialization (real-world benchmarks)
- Memory: 256 → 512 MB (Tailscale needs headroom)
- Timeout: 30 → 60s (tunnel init + Garmin SSO + push)
- Reserved concurrency: 5 (prevent ephemeral node flood on Tailscale coordination server)
- Cost: ~$0 incremental (reuses existing exit node)
- Secrets: Tailscale API key in Secrets Manager, exit node hostname in env var

## Expert review findings

This proposal was reviewed by 5 AWS staff specialists. Key findings incorporated:

1. **Lambda Engineer**: Cold start is 5-10s, not 2-3s. Need tunnel health check after freeze/thaw.
2. **Networking Engineer**: Use existing CDK construct instead of custom Layer. DNS via MagicDNS should work but needs verification.
3. **Security Engineer**: API key MUST be in Secrets Manager, not env vars. Tailscale ACLs must restrict `tag:lambda` to internet-only.
4. **CDK Engineer**: Pin Tailscale version with checksum. Use construct's built-in Secrets Manager integration.
5. **Solutions Architect**: Limit reserved concurrency. Add monitoring for tunnel health.
